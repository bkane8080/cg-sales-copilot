-- ============================================================
-- Velvet F&B Wholesale Companion - Database Setup
-- ============================================================

CREATE DATABASE IF NOT EXISTS VELVET_FB_DEMO;
CREATE SCHEMA IF NOT EXISTS VELVET_FB_DEMO.WHOLESALE_APP;
USE SCHEMA VELVET_FB_DEMO.WHOLESALE_APP;

-- ============================================================
-- PRODUCTS TABLE
-- ============================================================
CREATE OR REPLACE TABLE PRODUCTS (
    PRODUCT_ID INTEGER,
    CATEGORY VARCHAR(50),
    PRODUCT_NAME VARCHAR(200),
    DESCRIPTION VARCHAR(500),
    PRICE_TIER VARCHAR(50) DEFAULT 'Premium',
    LAUNCH_DATE DATE,
    IMAGE_URL VARCHAR(500)
);

INSERT INTO PRODUCTS VALUES
(1, 'Fragrance', 'Oud Mystique', 'An opulent oriental fragrance blending aged oud with saffron and amber. A signature scent for the connoisseur.', 'Premium', '2024-01-15', '/images/oud_mystique.jpg'),
(2, 'Fragrance', 'Lumière de Soie', 'A luminous floral composition of white gardenia, silk musk, and Italian bergamot.', 'Premium', '2024-03-01', '/images/lumiere_soie.jpg'),
(3, 'Fragrance', 'Noir Absolu', 'Dark, mysterious and magnetic. Black orchid, leather accord, and Venezuelan tonka bean.', 'Premium', '2023-09-10', '/images/noir_absolu.jpg'),
(4, 'Fragrance', 'Jardin Éphémère', 'A fresh green escape of crushed fig leaves, dewy peony, and white cedar.', 'Premium', '2025-11-20', '/images/jardin_ephemere.jpg'),
(5, 'Fragrance', 'Ambre Céleste', 'Celestial warmth — solar amber, labdanum resin, and golden vanilla.', 'Premium', '2024-06-15', '/images/ambre_celeste.jpg'),
(6, 'Skincare', 'Éclat Suprême Sérum', 'Concentrated vitamin C and hyaluronic acid serum with 24K gold microparticles for radiant luminosity.', 'Premium', '2024-02-01', '/images/eclat_serum.jpg'),
(7, 'Skincare', 'Crème Nuit Régénérante', 'Overnight regenerating cream with retinol microspheres, bakuchiol, and Swiss alpine rose stem cells.', 'Premium', '2024-04-10', '/images/creme_nuit.jpg'),
(8, 'Skincare', 'Masque Or 24K', 'Luxurious peel-off mask infused with colloidal gold, caviar extract, and marine collagen.', 'Premium', '2023-11-15', '/images/masque_or.jpg'),
(9, 'Skincare', 'Contour des Yeux Précieux', 'Targeted eye contour treatment with peptides, caffeine, and diamond powder for instant luminosity.', 'Premium', '2025-10-05', '/images/contour_yeux.jpg'),
(10, 'Skincare', 'Huile Royale Visage', 'Multi-correctional facial oil blending argan, rosehip, and sea buckthorn with Damask rose essence.', 'Premium', '2024-08-20', '/images/huile_royale.jpg'),
(11, 'Makeup', 'Rouge Velours Éternel', 'Long-wear matte lipstick in a jewel-toned burgundy with hydrating cashmere finish.', 'Premium', '2024-05-01', '/images/rouge_velours.jpg'),
(12, 'Makeup', 'Palette Regard Opéra', 'A 12-shade eyeshadow palette inspired by Parisian opera houses — champagne golds to deep mahoganies.', 'Premium', '2024-07-15', '/images/palette_opera.jpg'),
(13, 'Makeup', 'Fond de Teint Perfection', 'Buildable coverage foundation with micro-pigment technology, SPF 30, in 40 inclusive shades.', 'Premium', '2023-10-01', '/images/fond_teint.jpg'),
(14, 'Makeup', 'Mascara Volume Infini', 'Dramatic volumizing mascara with fiber-extension complex and smudge-proof formula.', 'Premium', '2025-12-01', '/images/mascara_infini.jpg'),
(15, 'Makeup', 'Poudre Lumière Haute', 'Baked highlighting powder with light-reflecting pearls for a natural, dewy glow.', 'Premium', '2024-09-10', '/images/poudre_lumiere.jpg');

-- ============================================================
-- STORES TABLE
-- ============================================================
CREATE OR REPLACE TABLE STORES (
    STORE_ID INTEGER,
    RETAILER_NAME VARCHAR(100),
    STORE_TYPE VARCHAR(100),
    LOCATION_LAT FLOAT,
    LOCATION_LONG FLOAT,
    ADDRESS VARCHAR(300),
    REGION VARCHAR(100),
    STORE_MANAGER_NAME VARCHAR(200)
);

INSERT INTO STORES VALUES
(1, 'Sephora', 'Flagship', 48.8698, 2.3078, '70 Avenue des Champs-Élysées, 75008 Paris', 'Île-de-France', 'Marie Dupont'),
(2, 'Sephora', 'Standard', 48.8566, 2.3522, '23 Boulevard Saint-Michel, 75005 Paris', 'Île-de-France', 'Camille Laurent'),
(3, 'Sephora', 'Standard', 48.8847, 2.3426, '15 Rue de Lévis, 75017 Paris', 'Île-de-France', 'Sophie Martin'),
(4, 'Sephora', 'Standard', 45.7640, 4.8357, '52 Rue de la République, 69002 Lyon', 'Auvergne-Rhône-Alpes', 'Lucie Bernard'),
(5, 'Marionnaud', 'Standard', 48.8606, 2.3376, '8 Rue de Rivoli, 75004 Paris', 'Île-de-France', 'Isabelle Moreau'),
(6, 'Marionnaud', 'Standard', 48.8738, 2.2950, '45 Avenue de Wagram, 75017 Paris', 'Île-de-France', 'Nathalie Petit'),
(7, 'Marionnaud', 'Standard', 43.6047, 1.4442, '18 Rue Alsace-Lorraine, 31000 Toulouse', 'Occitanie', 'Julie Roux'),
(8, 'Marionnaud', 'Standard', 43.2965, 5.3698, '72 Rue Saint-Ferréol, 13001 Marseille', 'Provence-Alpes-Côte d''Azur', 'Aurélie Blanc'),
(9, 'Nocibé', 'Standard', 48.8490, 2.3508, '112 Boulevard Saint-Germain, 75006 Paris', 'Île-de-France', 'Céline Garcia'),
(10, 'Nocibé', 'Standard', 48.8922, 2.2382, 'Centre Commercial Les 4 Temps, 92800 Puteaux', 'Île-de-France', 'Émilie Fournier'),
(11, 'Nocibé', 'Standard', 47.2184, -1.5536, '5 Rue Crébillon, 44000 Nantes', 'Pays de la Loire', 'Pauline Girard'),
(12, 'Nocibé', 'Standard', 48.5734, 7.7521, '28 Rue du Vieux Marché aux Poissons, 67000 Strasbourg', 'Grand Est', 'Manon Leroy'),
(13, 'Galeries Lafayette', 'Department Store Corner', 48.8738, 2.3320, '40 Boulevard Haussmann, 75009 Paris', 'Île-de-France', 'Véronique Morel'),
(14, 'Galeries Lafayette', 'Department Store Corner', 45.7578, 4.8320, 'Part-Dieu, 17 Rue du Docteur Bouchut, 69003 Lyon', 'Auvergne-Rhône-Alpes', 'Anne-Sophie Lemaire'),
(15, 'Galeries Lafayette', 'Department Store Corner', 43.7102, 7.2620, '6 Avenue Jean Médecin, 06000 Nice', 'Provence-Alpes-Côte d''Azur', 'Christine Duval'),
(16, 'Printemps', 'Department Store Corner', 48.8743, 2.3281, '64 Boulevard Haussmann, 75009 Paris', 'Île-de-France', 'Stéphanie Robin'),
(17, 'Printemps', 'Department Store Corner', 48.8848, 2.3455, '30 Place d''Italie, 75013 Paris', 'Île-de-France', 'Florence Mercier'),
(18, 'Sephora', 'Premium', 48.8615, 2.2879, '50 Avenue Victor Hugo, 75016 Paris', 'Île-de-France', 'Hélène Faure'),
(19, 'Marionnaud', 'Standard', 44.8378, -0.5792, '35 Cours de l''Intendance, 33000 Bordeaux', 'Nouvelle-Aquitaine', 'Caroline Gauthier'),
(20, 'Nocibé', 'Standard', 48.1173, -1.6778, '14 Rue Le Bastard, 35000 Rennes', 'Bretagne', 'Marion Chevalier');

-- ============================================================
-- FIELD_SALES TABLE
-- ============================================================
CREATE OR REPLACE TABLE FIELD_SALES (
    REP_ID INTEGER,
    REP_NAME VARCHAR(200),
    REGION VARCHAR(100),
    MANAGER_ID INTEGER
);

INSERT INTO FIELD_SALES VALUES
(1, 'Antoine Beaumont', 'Paris Nord', 6),
(2, 'Clara Fontaine', 'Paris Sud', 6),
(3, 'Thomas Lefèvre', 'Paris Ouest', 6),
(4, 'Léa Deschamps', 'Régions Sud', 6),
(5, 'Maxime Roussel', 'Régions Ouest', 6),
(6, 'Philippe Cartier', 'National', NULL);

-- ============================================================
-- STORE_PERFORMANCE TABLE
-- ============================================================
CREATE OR REPLACE TABLE STORE_PERFORMANCE (
    RECORD_ID INTEGER AUTOINCREMENT,
    STORE_ID INTEGER,
    PRODUCT_ID INTEGER,
    DATE DATE,
    SELL_IN_UNITS INTEGER,
    SELL_OUT_UNITS INTEGER,
    SHELF_SHARE_PERCENT FLOAT,
    NUMERICAL_DISTRIBUTION_STATUS BOOLEAN,
    PROMO_EFFICIENCY_SCORE FLOAT,
    MARKET_SHARE_PERCENT FLOAT
);

INSERT INTO STORE_PERFORMANCE (STORE_ID, PRODUCT_ID, DATE, SELL_IN_UNITS, SELL_OUT_UNITS, SHELF_SHARE_PERCENT, NUMERICAL_DISTRIBUTION_STATUS, PROMO_EFFICIENCY_SCORE, MARKET_SHARE_PERCENT)
SELECT
    s.STORE_ID,
    p.PRODUCT_ID,
    DATEADD('day', -seq.SEQ_NUM, CURRENT_DATE()) AS DATE,
    CASE
        WHEN p.CATEGORY = 'Fragrance' THEN UNIFORM(5, 30, RANDOM())
        WHEN p.CATEGORY = 'Skincare' THEN UNIFORM(8, 40, RANDOM())
        ELSE UNIFORM(10, 50, RANDOM())
    END AS SELL_IN_UNITS,
    CASE
        WHEN p.CATEGORY = 'Fragrance' THEN UNIFORM(3, 25, RANDOM())
        WHEN p.CATEGORY = 'Skincare' THEN UNIFORM(5, 35, RANDOM())
        ELSE UNIFORM(7, 45, RANDOM())
    END AS SELL_OUT_UNITS,
    ROUND(UNIFORM(5, 25, RANDOM())::FLOAT + 
        CASE WHEN s.STORE_TYPE = 'Flagship' THEN 5 ELSE 0 END, 1) AS SHELF_SHARE_PERCENT,
    CASE 
        WHEN p.LAUNCH_DATE > DATEADD('day', -60, CURRENT_DATE()) AND seq.SEQ_NUM > 30 THEN FALSE
        WHEN UNIFORM(1, 100, RANDOM()) > 15 THEN TRUE
        ELSE FALSE
    END AS NUMERICAL_DISTRIBUTION_STATUS,
    ROUND(UNIFORM(40, 95, RANDOM())::FLOAT / 10.0, 1) AS PROMO_EFFICIENCY_SCORE,
    ROUND(UNIFORM(2, 18, RANDOM())::FLOAT + 
        CASE WHEN s.RETAILER_NAME = 'Sephora' THEN 3 ELSE 0 END, 1) AS MARKET_SHARE_PERCENT
FROM STORES s
CROSS JOIN PRODUCTS p
CROSS JOIN (SELECT SEQ4() AS SEQ_NUM FROM TABLE(GENERATOR(ROWCOUNT => 180))) seq
WHERE seq.SEQ_NUM < 180
  AND MOD(seq.SEQ_NUM, 7) = 0;

-- ============================================================
-- VISITS TABLE
-- ============================================================
CREATE OR REPLACE TABLE VISITS (
    VISIT_ID INTEGER AUTOINCREMENT,
    REP_ID INTEGER,
    STORE_ID INTEGER,
    SCHEDULED_DATETIME TIMESTAMP,
    STATUS VARCHAR(50),
    AI_RECOMMENDATION_NOTES VARCHAR(1000),
    AUDIT_PLANOGRAM_COMPLIANCE_SCORE FLOAT
);

INSERT INTO VISITS (REP_ID, STORE_ID, SCHEDULED_DATETIME, STATUS, AI_RECOMMENDATION_NOTES, AUDIT_PLANOGRAM_COMPLIANCE_SCORE)
VALUES
(1, 1, DATEADD('hour', 9, DATE_TRUNC('week', CURRENT_DATE())), 'Completed', 'Push Oud Mystique end-cap — sell-out up 18% but shelf share declined. Negotiate 2nd facing.', 92.5),
(1, 3, DATEADD('hour', 14, DATE_TRUNC('week', CURRENT_DATE())), 'Completed', 'Restock Éclat Suprême Sérum — stockout risk detected. Check planogram compliance on new launches.', 78.0),
(1, 6, DATEADD('hour', 9, DATEADD('day', 1, DATE_TRUNC('week', CURRENT_DATE()))), 'Planned', 'Review NPD placement for Jardin Éphémère. Competitor brand gained facing in fragrance bay.', NULL),
(1, 16, DATEADD('hour', 14, DATEADD('day', 1, DATE_TRUNC('week', CURRENT_DATE()))), 'Planned', 'Printemps quarterly review prep. Bring sell-out data for Palette Regard Opéra — strong performer.', NULL),
(2, 2, DATEADD('hour', 9, DATEADD('day', 2, DATE_TRUNC('week', CURRENT_DATE()))), 'Planned', 'Check promo efficiency on Ambre Céleste set. Previous promo underperformed vs category benchmark.', NULL),
(2, 9, DATEADD('hour', 14, DATEADD('day', 2, DATE_TRUNC('week', CURRENT_DATE()))), 'Planned', 'Nocibé sell-in negotiation. Propose Skincare bundle for Q2. Prepare margin structure.', NULL),
(2, 5, DATEADD('hour', 10, DATEADD('day', 3, DATE_TRUNC('week', CURRENT_DATE()))), 'Urgent', 'ALERT: Sell-out dropped 35% at this location in past 2 weeks. Investigate out-of-stock or display issue.', NULL),
(3, 18, DATEADD('hour', 9, DATEADD('day', 2, DATE_TRUNC('week', CURRENT_DATE()))), 'Planned', 'Premium Sephora — audit full Velvet bay. Mascara Volume Infini launch activation check.', NULL),
(3, 10, DATEADD('hour', 14, DATEADD('day', 3, DATE_TRUNC('week', CURRENT_DATE()))), 'Planned', 'Les 4 Temps — high footfall location. Negotiate additional promotional slot for summer.', NULL),
(3, 13, DATEADD('hour', 9, DATEADD('day', 4, DATE_TRUNC('week', CURRENT_DATE()))), 'Planned', 'Galeries Lafayette flagship — prepare for Contour des Yeux Précieux exclusive preview event.', NULL),
(4, 4, DATEADD('hour', 9, DATEADD('day', 1, DATE_TRUNC('week', CURRENT_DATE()))), 'Planned', 'Lyon Sephora — quarterly assortment review. Bring NPD tracker for launches < 60 days.', NULL),
(4, 14, DATEADD('hour', 14, DATEADD('day', 1, DATE_TRUNC('week', CURRENT_DATE()))), 'Planned', 'Galeries Lafayette Lyon — underperforming on Skincare. Propose end-cap activation.', NULL),
(4, 8, DATEADD('hour', 9, DATEADD('day', 3, DATE_TRUNC('week', CURRENT_DATE()))), 'Urgent', 'Marseille store — numerical distribution gap on 3 SKUs. Urgent corrective action needed.', NULL),
(4, 15, DATEADD('hour', 14, DATEADD('day', 4, DATE_TRUNC('week', CURRENT_DATE()))), 'Planned', 'Nice — summer season prep. Review stock levels for holiday-driven sell-out surge.', NULL),
(5, 11, DATEADD('hour', 9, DATEADD('day', 2, DATE_TRUNC('week', CURRENT_DATE()))), 'Planned', 'Nantes — introduce Huile Royale Visage. Skincare segment growing 12% in this market.', NULL),
(5, 19, DATEADD('hour', 9, DATEADD('day', 3, DATE_TRUNC('week', CURRENT_DATE()))), 'Planned', 'Bordeaux — negotiate Makeup gondola head for Rouge Velours Éternel limited edition.', NULL),
(5, 20, DATEADD('hour', 14, DATEADD('day', 4, DATE_TRUNC('week', CURRENT_DATE()))), 'Planned', 'Rennes — market share recovery plan. Competitor launched aggressively in Fragrance.', NULL);

-- ============================================================
-- Summary
-- ============================================================
SELECT 'Setup complete' AS STATUS,
    (SELECT COUNT(*) FROM PRODUCTS) AS PRODUCTS_COUNT,
    (SELECT COUNT(*) FROM STORES) AS STORES_COUNT,
    (SELECT COUNT(*) FROM FIELD_SALES) AS REPS_COUNT,
    (SELECT COUNT(*) FROM STORE_PERFORMANCE) AS PERFORMANCE_RECORDS,
    (SELECT COUNT(*) FROM VISITS) AS VISITS_COUNT;
