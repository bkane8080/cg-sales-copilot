import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import timedelta
from snowflake.snowpark.context import get_active_session

st.set_page_config(
    page_title="Velvet F&B – Sales Manager Dashboard",
    page_icon="🧴",
    layout="wide",
    initial_sidebar_state="expanded"
)

session = get_active_session()

MANAGER_ID = 101
INNOVATION_PRODUCT = "Rouge Velours Éternel"
INNOVATION_TARGET_PCT = 88

@st.cache_data(ttl=timedelta(minutes=5))
def get_team():
    return session.sql("""
        SELECT REP_ID, REP_NAME, REGION FROM VELVET_FB_DEMO.WHOLESALE_APP.FIELD_SALES
        WHERE MANAGER_ID = 101 AND ROLE = 'Field Sales' ORDER BY REP_NAME
    """).to_pandas()

@st.cache_data(ttl=timedelta(minutes=5))
def get_monthly_performance():
    return session.sql("""
        SELECT p.*, f.REP_NAME, f.REGION
        FROM VELVET_FB_DEMO.WHOLESALE_APP.REP_MONTHLY_PERFORMANCE p
        JOIN VELVET_FB_DEMO.WHOLESALE_APP.FIELD_SALES f ON p.REP_ID = f.REP_ID
        WHERE f.MANAGER_ID = 101
        ORDER BY p.MONTH_DATE, f.REP_NAME
    """).to_pandas()

@st.cache_data(ttl=timedelta(minutes=5))
def get_innovation_tracking():
    return session.sql("""
        SELECT it.*, s.STORE_NAME, s.RETAILER_NAME, s.STORE_TIER, s.ADDRESS, f.REP_NAME
        FROM VELVET_FB_DEMO.WHOLESALE_APP.INNOVATION_TRACKING it
        JOIN VELVET_FB_DEMO.WHOLESALE_APP.STORES s ON it.STORE_ID = s.STORE_ID
        JOIN VELVET_FB_DEMO.WHOLESALE_APP.FIELD_SALES f ON it.REP_ID = f.REP_ID
        WHERE it.REP_ID BETWEEN 1 AND 8
        ORDER BY it.MONTH_DATE, s.STORE_NAME
    """).to_pandas()

@st.cache_data(ttl=timedelta(minutes=5))
def get_stores_for_rep(rep_id):
    return session.sql(f"""
        SELECT s.STORE_ID, s.STORE_NAME, s.RETAILER_NAME, s.STORE_TIER, s.ADDRESS,
               it.IS_LISTED, it.FACINGS, it.SELL_OUT_EUR, it.LAST_VISIT_DATE, it.STATUS, it.NOTES
        FROM VELVET_FB_DEMO.WHOLESALE_APP.STORES s
        LEFT JOIN VELVET_FB_DEMO.WHOLESALE_APP.INNOVATION_TRACKING it
            ON s.STORE_ID = it.STORE_ID AND it.MONTH_DATE = (SELECT MAX(MONTH_DATE) FROM VELVET_FB_DEMO.WHOLESALE_APP.INNOVATION_TRACKING)
        WHERE s.REP_ID = {rep_id}
        ORDER BY s.STORE_TIER, s.STORE_NAME
    """).to_pandas()

def ask_cortex(question):
    try:
        result = session.sql(f"""
            SELECT SNOWFLAKE.CORTEX.COMPLETE('mistral-large2',
                'You are a sales analytics expert for Velvet F&B cosmetics. Answer concisely based on context.
                Context: Team of 8 reps in Paris region managed by Amandine Chang. Innovation product: Rouge Velours Éternel launched Jan 2026, target 88% distribution by Jun 2026.
                Eric Sarr (rep 1) had a dip in May-Jun due to personal leave causing stock-out at Marionnaud Saint-Cloud CC (tier A store, delisted).
                Question: {question.replace("'", "''")}'
            ) AS ANSWER
        """).to_pandas()
        raw = result.iloc[0]['ANSWER']
        if isinstance(raw, str):
            return raw
        return str(raw)
    except Exception as e:
        return f"Error: {e}"

team = get_team()
perf = get_monthly_performance()
innov = get_innovation_tracking()

with st.sidebar:
    st.image("https://img.icons8.com/emoji/48/lipstick-emoji.png", width=40)
    st.title("Velvet F&B")
    st.caption("Sales Manager Dashboard")
    st.divider()

    page = st.radio("Navigation", ["🏠 Territory Overview", "👤 Rep Deep-Dive", "🏬 Store Deep-Dive", "💬 Ask AI"], label_visibility="collapsed")

    st.divider()
    st.markdown(f"**Manager:** Amandine Chang")
    st.markdown(f"**Region:** Paris ({len(team)} reps)")

if page == "🏠 Territory Overview":
    st.title("Territory Overview")
    st.caption("Paris Region · Amandine Chang · 8 Direct Reports")

    latest = perf[perf['MONTH_DATE'] == perf['MONTH_DATE'].max()]
    prev = perf[perf['MONTH_DATE'] == perf['MONTH_DATE'].iloc[-1] - pd.DateOffset(months=1)] if len(perf) > 8 else latest

    tot_sell_out = latest['SELL_OUT_EUR'].sum()
    tot_sell_in = latest['SELL_IN_EUR'].sum()
    avg_innov = latest['INNOVATION_ADOPTION_PCT'].mean()
    avg_promo_roi = latest['PROMO_ROI'].mean()

    prev_sell_out = prev['SELL_OUT_EUR'].sum() if not prev.empty else tot_sell_out
    prev_innov = prev['INNOVATION_ADOPTION_PCT'].mean() if not prev.empty else avg_innov

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Sell-Out (Team)", f"€{tot_sell_out:,.0f}", f"{((tot_sell_out/prev_sell_out)-1)*100:+.1f}%")
    c2.metric("Sell-In (Team)", f"€{tot_sell_in:,.0f}")
    c3.metric("Innovation Adoption", f"{avg_innov:.0f}%", f"{avg_innov - prev_innov:+.1f}pp")
    c4.metric("Avg Promo ROI", f"{avg_promo_roi:.1f}x")

    st.subheader(f"Innovation Distribution: {INNOVATION_PRODUCT}")

    monthly_innov = innov.groupby('MONTH_DATE').agg(
        listed=('IS_LISTED', 'sum'),
        total=('IS_LISTED', 'count')
    ).reset_index()
    monthly_innov['pct'] = (monthly_innov['listed'] / monthly_innov['total'] * 100).round(1)

    fig = go.Figure()
    fig.add_trace(go.Scatter(x=monthly_innov['MONTH_DATE'], y=monthly_innov['pct'], mode='lines+markers', name='Actual', line=dict(color='#1c1926', width=3)))
    fig.add_hline(y=INNOVATION_TARGET_PCT, line_dash="dash", line_color="green", annotation_text=f"Target {INNOVATION_TARGET_PCT}%")
    fig.update_layout(yaxis_title="% Distribution", xaxis_title="", height=300, margin=dict(t=20, b=40))
    st.plotly_chart(fig, use_container_width=True)

    st.subheader("Team Rankings")

    rankings = latest[['REP_NAME', 'REGION', 'SELL_OUT_EUR', 'INNOVATION_ADOPTION_PCT', 'PROMO_ROI', 'VISITS_COUNT', 'AVG_AUDIT_SCORE']].copy()
    rankings.columns = ['Rep', 'Territory', 'Sell-Out €', 'Innovation %', 'Promo ROI', 'Visits', 'Audit Score']
    rankings = rankings.sort_values('Innovation %', ascending=False).reset_index(drop=True)

    def highlight_row(row):
        if row['Innovation %'] < 75:
            return ['background-color: #fee2e2'] * len(row)
        elif row['Innovation %'] >= 88:
            return ['background-color: #d1fae5'] * len(row)
        return [''] * len(row)

    st.dataframe(rankings.style.apply(highlight_row, axis=1), use_container_width=True, hide_index=True)

elif page == "👤 Rep Deep-Dive":
    st.title("Rep Deep-Dive")

    rep_options = team['REP_NAME'].tolist()
    selected_rep = st.selectbox("Select Rep", rep_options, index=0)
    rep_id = team[team['REP_NAME'] == selected_rep]['REP_ID'].iloc[0]

    rep_perf = perf[perf['REP_ID'] == rep_id].sort_values('MONTH_DATE')

    if not rep_perf.empty:
        latest_rep = rep_perf.iloc[-1]
        prev_rep = rep_perf.iloc[-2] if len(rep_perf) > 1 else latest_rep

        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Sell-Out", f"€{latest_rep['SELL_OUT_EUR']:,.0f}",
                  f"{((latest_rep['SELL_OUT_EUR']/prev_rep['SELL_OUT_EUR'])-1)*100:+.1f}%")
        c2.metric("Innovation", f"{latest_rep['INNOVATION_ADOPTION_PCT']:.0f}%",
                  f"{latest_rep['INNOVATION_ADOPTION_PCT'] - prev_rep['INNOVATION_ADOPTION_PCT']:+.0f}pp")
        c3.metric("Promo ROI", f"{latest_rep['PROMO_ROI']:.1f}x")
        c4.metric("Visits", f"{latest_rep['VISITS_COUNT']:.0f}",
                  f"{latest_rep['VISITS_COUNT'] - prev_rep['VISITS_COUNT']:+.0f}")

        col1, col2 = st.columns(2)
        with col1:
            fig = px.line(rep_perf, x='MONTH_DATE', y='SELL_OUT_EUR', title="Sell-Out Trend", markers=True)
            fig.update_layout(height=250, margin=dict(t=30, b=20))
            st.plotly_chart(fig, use_container_width=True)
        with col2:
            fig = px.line(rep_perf, x='MONTH_DATE', y='INNOVATION_ADOPTION_PCT', title="Innovation Adoption %", markers=True)
            fig.add_hline(y=88, line_dash="dash", line_color="green")
            fig.update_layout(height=250, margin=dict(t=30, b=20))
            st.plotly_chart(fig, use_container_width=True)

        st.subheader("Store Matrix")
        stores = get_stores_for_rep(rep_id)
        if not stores.empty:
            display_cols = ['STORE_NAME', 'RETAILER_NAME', 'STORE_TIER', 'STATUS', 'FACINGS', 'SELL_OUT_EUR', 'LAST_VISIT_DATE']
            available = [c for c in display_cols if c in stores.columns]
            styled = stores[available].copy()
            styled.columns = ['Store', 'Chain', 'Tier', 'Status', 'Facings', 'Sell-Out €', 'Last Visit']

            def highlight_status(row):
                if row.get('Status') in ('Stock-Out', 'Delisted'):
                    return ['background-color: #fee2e2'] * len(row)
                elif row.get('Status') == 'Not Listed':
                    return ['background-color: #fef3c7'] * len(row)
                return [''] * len(row)

            st.dataframe(styled.style.apply(highlight_status, axis=1), use_container_width=True, hide_index=True)

elif page == "🏬 Store Deep-Dive":
    st.title("Store Deep-Dive")

    rep_options = team['REP_NAME'].tolist()
    selected_rep = st.selectbox("Filter by Rep", ["All"] + rep_options)

    if selected_rep == "All":
        flagged = innov[(innov['STATUS'].isin(['Stock-Out', 'Delisted'])) & (innov['MONTH_DATE'] == innov['MONTH_DATE'].max())]
    else:
        rep_id = team[team['REP_NAME'] == selected_rep]['REP_ID'].iloc[0]
        flagged = innov[(innov['REP_ID'] == rep_id) & (innov['STATUS'].isin(['Stock-Out', 'Delisted', 'Not Listed'])) & (innov['MONTH_DATE'] == innov['MONTH_DATE'].max())]

    if not flagged.empty:
        st.warning(f"⚠️ {len(flagged)} stores with issues (Stock-Out/Delisted/Not Listed)")

        for _, row in flagged.iterrows():
            with st.container():
                c1, c2, c3 = st.columns([3, 1, 1])
                with c1:
                    st.markdown(f"**{row['STORE_NAME']}** ({row['RETAILER_NAME']})")
                    st.caption(f"Rep: {row['REP_NAME']} · Tier {row['STORE_TIER']}")
                with c2:
                    status_color = "🔴" if row['STATUS'] == 'Delisted' else "🟡" if row['STATUS'] == 'Stock-Out' else "⚪"
                    st.markdown(f"{status_color} **{row['STATUS']}**")
                with c3:
                    st.metric("Facings", row['FACINGS'])
                if row.get('NOTES'):
                    st.info(row['NOTES'])

                store_history = innov[innov['STORE_ID'] == row['STORE_ID']].sort_values('MONTH_DATE')
                if not store_history.empty:
                    fig = px.bar(store_history, x='MONTH_DATE', y='SELL_OUT_EUR', title="Monthly Sell-Out", color='IS_LISTED',
                                 color_discrete_map={True: '#10b981', False: '#ef4444'})
                    fig.update_layout(height=200, margin=dict(t=30, b=20), showlegend=False)
                    st.plotly_chart(fig, use_container_width=True)
    else:
        st.success("✅ No critical issues found for the selected filter.")

    st.subheader("All Stores")
    latest_innov = innov[innov['MONTH_DATE'] == innov['MONTH_DATE'].max()]
    if selected_rep != "All":
        rep_id = team[team['REP_NAME'] == selected_rep]['REP_ID'].iloc[0]
        latest_innov = latest_innov[latest_innov['REP_ID'] == rep_id]

    summary = latest_innov.groupby('REP_NAME').agg(
        stores=('STORE_ID', 'count'),
        listed=('IS_LISTED', 'sum'),
        avg_facings=('FACINGS', 'mean'),
        total_sellout=('SELL_OUT_EUR', 'sum')
    ).reset_index()
    summary['adoption_pct'] = (summary['listed'] / summary['stores'] * 100).round(1)
    summary.columns = ['Rep', 'Stores', 'Listed', 'Avg Facings', 'Total Sell-Out €', 'Adoption %']
    st.dataframe(summary.sort_values('Adoption %', ascending=False), use_container_width=True, hide_index=True)

elif page == "💬 Ask AI":
    st.title("Ask AI – Deep-Dive Analysis")
    st.caption("Ask questions about your team's performance, innovation adoption, and store issues.")

    if "ai_messages" not in st.session_state:
        st.session_state.ai_messages = []

    for msg in st.session_state.ai_messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    if prompt := st.chat_input("Ask about your team, stores, or innovation..."):
        st.session_state.ai_messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        with st.chat_message("assistant"):
            with st.spinner("Analyzing..."):
                answer = ask_cortex(prompt)
            st.markdown(answer)
        st.session_state.ai_messages.append({"role": "assistant", "content": answer})
