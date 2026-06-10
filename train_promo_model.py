import sys
sys.path.insert(0, '/Users/bkane/Documents/Demos/CG Sales Copilot')
from snowpark_session import create_snowpark_session
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import root_mean_squared_error, r2_score
from sklearn.preprocessing import LabelEncoder

session = create_snowpark_session("DEMO")
session.use_database("VELVET_FB_DEMO")
session.use_schema("WHOLESALE_APP")

print("Loading training data...")
df = session.table("PROMOTION_HISTORY").to_pandas()
print(f"Training data: {df.shape[0]} rows, {df.shape[1]} columns")

le_promo = LabelEncoder()
le_retailer = LabelEncoder()
le_store_type = LabelEncoder()
le_region = LabelEncoder()
le_category = LabelEncoder()
le_season = LabelEncoder()
le_traffic = LabelEncoder()

df['PROMO_TYPE_ENC'] = le_promo.fit_transform(df['PROMO_TYPE'])
df['RETAILER_ENC'] = le_retailer.fit_transform(df['RETAILER_NAME'])
df['STORE_TYPE_ENC'] = le_store_type.fit_transform(df['STORE_TYPE'])
df['REGION_ENC'] = le_region.fit_transform(df['REGION'])
df['CATEGORY_ENC'] = le_category.fit_transform(df['CATEGORY'])
df['SEASON_ENC'] = le_season.fit_transform(df['SEASON'])
df['TRAFFIC_ENC'] = le_traffic.fit_transform(df['STORE_TRAFFIC_LEVEL'])
df['COMPETITOR_INT'] = df['COMPETITOR_PROMO_ACTIVE'].astype(int)

features = ['PROMO_TYPE_ENC', 'RETAILER_ENC', 'STORE_TYPE_ENC', 'REGION_ENC',
            'CATEGORY_ENC', 'SEASON_ENC', 'MONTH', 'DAY_OF_WEEK', 'DURATION_DAYS',
            'DISCOUNT_VALUE', 'PRODUCT_COUNT', 'TRAFFIC_ENC', 'COMPETITOR_INT']

X = df[features]
y_score = df['ACTUAL_SCORE']
y_uplift = df['ACTUAL_UPLIFT_PCT']

X_train, X_test, y_score_train, y_score_test, y_uplift_train, y_uplift_test = train_test_split(
    X, y_score, y_uplift, test_size=0.2, random_state=42
)

print("\nTraining Score model (GradientBoosting)...")
score_model = GradientBoostingRegressor(n_estimators=150, max_depth=5, learning_rate=0.1, random_state=42)
score_model.fit(X_train, y_score_train)
score_pred = score_model.predict(X_test)
print(f"  RMSE: {root_mean_squared_error(y_score_test, score_pred):.3f}")
print(f"  R²:   {r2_score(y_score_test, score_pred):.3f}")

print("\nTraining Uplift model (GradientBoosting)...")
uplift_model = GradientBoostingRegressor(n_estimators=150, max_depth=5, learning_rate=0.1, random_state=42)
uplift_model.fit(X_train, y_uplift_train)
uplift_pred = uplift_model.predict(X_test)
print(f"  RMSE: {root_mean_squared_error(y_uplift_test, uplift_pred):.3f}")
print(f"  R²:   {r2_score(y_uplift_test, uplift_pred):.3f}")

print("\nRegistering models in Snowflake Model Registry...")
from snowflake.ml.registry import Registry

registry = Registry(session=session, database_name="VELVET_FB_DEMO", schema_name="WHOLESALE_APP")

sample_input = X_test.head(5)

score_mv = registry.log_model(
    model=score_model,
    model_name="PROMO_SCORE_MODEL",
    version_name="v1",
    sample_input_data=sample_input,
    metrics={"rmse": float(root_mean_squared_error(y_score_test, score_pred)),
             "r2": float(r2_score(y_score_test, score_pred))},
    comment="Predicts promotion effectiveness score (0-10). Features: promo_type, retailer, store_type, region, category, season, month, day_of_week, duration, discount, product_count, traffic, competitor."
)
print(f"  Score model registered: PROMO_SCORE_MODEL v1")

uplift_mv = registry.log_model(
    model=uplift_model,
    model_name="PROMO_UPLIFT_MODEL",
    version_name="v1",
    sample_input_data=sample_input,
    metrics={"rmse": float(root_mean_squared_error(y_uplift_test, uplift_pred)),
             "r2": float(r2_score(y_uplift_test, uplift_pred))},
    comment="Predicts % sales uplift from a promotion. Features: promo_type, retailer, store_type, region, category, season, month, day_of_week, duration, discount, product_count, traffic, competitor."
)
print(f"  Uplift model registered: PROMO_UPLIFT_MODEL v1")

print("\nScoring PROMOTION_CALENDAR entries...")
calendar = session.table("PROMOTION_CALENDAR").to_pandas()

for idx, row in calendar.iterrows():
    promo_type_enc = le_promo.transform([row['PROMO_TYPE']])[0] if row['PROMO_TYPE'] in le_promo.classes_ else 0
    season_enc = le_season.transform([row['SEASON']])[0] if row['SEASON'] in le_season.classes_ else 0
    category_enc = le_category.transform([row['CATEGORY']])[0] if pd.notna(row['CATEGORY']) and row['CATEGORY'] in le_category.classes_ else 0
    month = row['START_DATE'].month
    duration = (row['END_DATE'] - row['START_DATE']).days
    discount = row['DISCOUNT_VALUE'] if pd.notna(row['DISCOUNT_VALUE']) else 15
    
    feat = pd.DataFrame([[promo_type_enc, 1, 1, 0, category_enc, season_enc, month, 1, duration, discount, 3, 2, 0]], columns=features)
    score = float(np.clip(score_model.predict(feat)[0], 1, 10))
    uplift = float(np.clip(uplift_model.predict(feat)[0], 2, 50))
    
    session.sql(f"UPDATE PROMOTION_CALENDAR SET ML_SCORE = {score:.1f}, ML_UPLIFT_PCT = {uplift:.1f} WHERE PROMO_CAL_ID = {row['PROMO_CAL_ID']}").collect()

print("  All calendar entries scored!")

print("\nVerifying scores:")
result = session.sql("SELECT PROMO_NAME, ML_SCORE, ML_UPLIFT_PCT FROM PROMOTION_CALENDAR ORDER BY ML_SCORE DESC").to_pandas()
print(result.to_string(index=False))

print("\n✓ Done! Models registered and calendar scored.")
session.close()
