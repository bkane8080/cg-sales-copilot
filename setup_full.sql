-- ============================================================
-- Velvet F&B Wholesale Companion — Full Database Setup
-- Run this on any Snowflake account to set up the demo
-- ============================================================

CREATE DATABASE IF NOT EXISTS VELVET_FB_DEMO;
CREATE SCHEMA IF NOT EXISTS VELVET_FB_DEMO.WHOLESALE_APP;
USE SCHEMA VELVET_FB_DEMO.WHOLESALE_APP;

-- ============================================================
-- PRODUCTS (15 premium beauty products)
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
(1, 'Fragrance', 'Oud Mystique', 'An opulent oriental fragrance blending aged oud with saffron and amber.', 'Premium', '2024-01-15', '/images/oud_mystique.jpg'),
(2, 'Fragrance', 'Lumière de Soie', 'A luminous floral composition of white gardenia, silk musk, and Italian bergamot.', 'Premium', '2024-03-01', '/images/lumiere_soie.jpg'),
(3, 'Fragrance', 'Noir Absolu', 'Dark, mysterious. Black orchid, leather accord, and Venezuelan tonka bean.', 'Premium', '2023-09-10', '/images/noir_absolu.jpg'),
(4, 'Fragrance', 'Jardin Éphémère', 'A fresh green escape of crushed fig leaves, dewy peony, and white cedar.', 'Premium', '2025-11-20', '/images/jardin_ephemere.jpg'),
(5, 'Fragrance', 'Ambre Céleste', 'Celestial warmth — solar amber, labdanum resin, and golden vanilla.', 'Premium', '2024-06-15', '/images/ambre_celeste.jpg'),
(6, 'Skincare', 'Éclat Suprême Sérum', 'Concentrated vitamin C and hyaluronic acid serum with 24K gold microparticles.', 'Premium', '2024-02-01', '/images/eclat_serum.jpg'),
(7, 'Skincare', 'Crème Nuit Régénérante', 'Overnight regenerating cream with retinol microspheres and alpine rose stem cells.', 'Premium', '2024-04-10', '/images/creme_nuit.jpg'),
(8, 'Skincare', 'Masque Or 24K', 'Luxurious peel-off mask infused with colloidal gold, caviar extract, and marine collagen.', 'Premium', '2023-11-15', '/images/masque_or.jpg'),
(9, 'Skincare', 'Contour des Yeux Précieux', 'Eye contour treatment with peptides, caffeine, and diamond powder.', 'Premium', '2025-10-05', '/images/contour_yeux.jpg'),
(10, 'Skincare', 'Huile Royale Visage', 'Multi-correctional facial oil blending argan, rosehip, and sea buckthorn.', 'Premium', '2024-08-20', '/images/huile_royale.jpg'),
(11, 'Makeup', 'Rouge Velours Éternel', 'Long-wear matte lipstick in jewel-toned burgundy with cashmere finish.', 'Premium', '2024-05-01', '/images/rouge_velours.jpg'),
(12, 'Makeup', 'Palette Regard Opéra', '12-shade eyeshadow palette — champagne golds to deep mahoganies.', 'Premium', '2024-07-15', '/images/palette_opera.jpg'),
(13, 'Makeup', 'Fond de Teint Perfection', 'Buildable coverage foundation with micro-pigment technology, SPF 30.', 'Premium', '2023-10-01', '/images/fond_teint.jpg'),
(14, 'Makeup', 'Mascara Volume Infini', 'Dramatic volumizing mascara with fiber-extension complex.', 'Premium', '2025-12-01', '/images/mascara_infini.jpg'),
(15, 'Makeup', 'Poudre Lumière Haute', 'Baked highlighting powder with light-reflecting pearls.', 'Premium', '2024-09-10', '/images/poudre_lumiere.jpg');

-- ============================================================
-- FIELD_SALES (30 reps + 6 managers)
-- ============================================================
CREATE OR REPLACE TABLE FIELD_SALES (
    REP_ID INTEGER,
    REP_NAME VARCHAR(200),
    REGION VARCHAR(100),
    MANAGER_ID INTEGER,
    ROLE VARCHAR(50) DEFAULT 'Field Sales',
    HOME_ADDRESS VARCHAR(300)
);

INSERT INTO FIELD_SALES (REP_ID, REP_NAME, REGION, MANAGER_ID, ROLE, HOME_ADDRESS) VALUES
(1, 'Eric Sarr', 'Paris Ouest', 101, 'Field Sales', '6 Av. le Corbeiller, 92190 Meudon'),
(2, 'Clara Fontaine', 'Paris Sud', 101, 'Field Sales', NULL),
(3, 'Thomas Lefèvre', 'Paris Nord', 101, 'Field Sales', NULL),
(4, 'Léa Deschamps', 'Paris Est', 101, 'Field Sales', NULL),
(5, 'Maxime Roussel', 'Hauts-de-Seine', 101, 'Field Sales', NULL),
(6, 'Sofia Benali', 'Yvelines', 101, 'Field Sales', NULL),
(7, 'Julien Moreau', 'Val-de-Marne', 101, 'Field Sales', NULL),
(8, 'Amira Khelifi', 'Seine-Saint-Denis', 101, 'Field Sales', NULL),
(9, 'Romain Perrin', 'Essonne', 101, 'Field Sales', NULL),
(10, 'Chloé Martin', 'Val-d''Oise', 101, 'Field Sales', NULL),
(11, 'Lucas Bernard', 'Lyon Centre', 102, 'Field Sales', NULL),
(12, 'Inès Dupont', 'Lyon Périphérie', 102, 'Field Sales', NULL),
(13, 'Hugo Mercier', 'Rhône-Alpes Nord', 102, 'Field Sales', NULL),
(14, 'Manon Girard', 'Rhône-Alpes Sud', 102, 'Field Sales', NULL),
(15, 'Théo Lambert', 'Auvergne', 102, 'Field Sales', NULL),
(16, 'Sarah Leroy', 'Marseille', 103, 'Field Sales', NULL),
(17, 'Nathan Roux', 'Côte d''Azur', 103, 'Field Sales', NULL),
(18, 'Emma Fournier', 'Provence', 103, 'Field Sales', NULL),
(19, 'Mathis Bonnet', 'Languedoc', 103, 'Field Sales', NULL),
(20, 'Jade Duval', 'Occitanie Ouest', 103, 'Field Sales', NULL),
(21, 'Gabriel Simon', 'Bordeaux', 104, 'Field Sales', NULL),
(22, 'Lina Petit', 'Nantes', 104, 'Field Sales', NULL),
(23, 'Louis Morel', 'Bretagne', 104, 'Field Sales', NULL),
(24, 'Zoé Garnier', 'Poitou', 104, 'Field Sales', NULL),
(25, 'Adam Laurent', 'Normandie', 104, 'Field Sales', NULL),
(26, 'Camille Robin', 'Lille', 105, 'Field Sales', NULL),
(27, 'Raphaël Henry', 'Picardie', 105, 'Field Sales', NULL),
(28, 'Léonie Blanc', 'Alsace', 105, 'Field Sales', NULL),
(29, 'Arthur Muller', 'Lorraine', 105, 'Field Sales', NULL),
(30, 'Alice Faure', 'Champagne', 105, 'Field Sales', NULL),
(101, 'Philippe Cartier', 'Île-de-France', NULL, 'Manager', NULL),
(102, 'Isabelle Morin', 'Rhône-Alpes', NULL, 'Manager', NULL),
(103, 'David Nguyen', 'Sud-Est', NULL, 'Manager', NULL),
(104, 'Christine Gauthier', 'Grand Ouest', NULL, 'Manager', NULL),
(105, 'Marc Dubois', 'Nord-Est', NULL, 'Manager', NULL),
(106, 'Catherine Brun', 'National', NULL, 'Director', NULL);

-- ============================================================
-- STORES (~1500+ stores across France, assigned to reps)
-- ============================================================
CREATE OR REPLACE TABLE STORES (
    STORE_ID INTEGER AUTOINCREMENT,
    RETAILER_NAME VARCHAR(100),
    STORE_NAME VARCHAR(200),
    STORE_TYPE VARCHAR(100),
    LOCATION_LAT FLOAT,
    LOCATION_LONG FLOAT,
    ADDRESS VARCHAR(300),
    REGION VARCHAR(100),
    STORE_MANAGER_NAME VARCHAR(200),
    REP_ID INTEGER
);

-- Generate stores programmatically using Snowflake SQL
-- Cities for each rep territory
CREATE OR REPLACE TEMPORARY TABLE TEMP_CITIES (
    CITY VARCHAR(100),
    REGION VARCHAR(100),
    BASE_LAT FLOAT,
    BASE_LNG FLOAT,
    REP_ID INTEGER
);

INSERT INTO TEMP_CITIES VALUES
-- Eric Sarr (REP_ID 1) - Paris Ouest
('Clamart', 'Île-de-France', 48.800, 2.260, 1),
('Meudon', 'Île-de-France', 48.813, 2.235, 1),
('Sèvres', 'Île-de-France', 48.824, 2.211, 1),
('Saint-Cloud', 'Île-de-France', 48.848, 2.219, 1),
('Boulogne', 'Île-de-France', 48.834, 2.248, 1),
('Issy', 'Île-de-France', 48.822, 2.265, 1),
('Vanves', 'Île-de-France', 48.819, 2.290, 1),
('Paris 16ème', 'Île-de-France', 48.863, 2.276, 1),
('Paris 15ème', 'Île-de-France', 48.842, 2.295, 1),
('Paris 8ème', 'Île-de-France', 48.874, 2.309, 1),
('Paris 1er', 'Île-de-France', 48.860, 2.347, 1),
-- Clara Fontaine (REP_ID 2) - Paris Sud
('Paris 13ème', 'Île-de-France', 48.832, 2.362, 2),
('Paris 14ème', 'Île-de-France', 48.833, 2.326, 2),
('Montrouge', 'Île-de-France', 48.818, 2.320, 2),
('Malakoff', 'Île-de-France', 48.819, 2.299, 2),
('Châtillon', 'Île-de-France', 48.804, 2.291, 2),
('Arcueil', 'Île-de-France', 48.802, 2.332, 2),
('Kremlin-Bicêtre', 'Île-de-France', 48.811, 2.358, 2),
('Villejuif', 'Île-de-France', 48.792, 2.362, 2),
('Ivry', 'Île-de-France', 48.813, 2.388, 2),
-- Thomas Lefèvre (REP_ID 3) - Paris Nord
('Paris 9ème', 'Île-de-France', 48.877, 2.338, 3),
('Paris 10ème', 'Île-de-France', 48.876, 2.361, 3),
('Paris 18ème', 'Île-de-France', 48.892, 2.348, 3),
('Paris 19ème', 'Île-de-France', 48.884, 2.381, 3),
('Saint-Ouen', 'Île-de-France', 48.907, 2.334, 3),
('Clichy', 'Île-de-France', 48.905, 2.306, 3),
('Saint-Denis', 'Île-de-France', 48.936, 2.357, 3),
('Aubervilliers', 'Île-de-France', 48.917, 2.383, 3),
('Pantin', 'Île-de-France', 48.893, 2.402, 3),
-- Others get fewer cities (they exist but are less critical for demo)
('Paris 12ème', 'Île-de-France', 48.841, 2.388, 4),
('Créteil', 'Île-de-France', 48.791, 2.462, 4),
('Vincennes', 'Île-de-France', 48.847, 2.435, 4),
('Neuilly', 'Île-de-France', 48.885, 2.270, 5),
('Rueil', 'Île-de-France', 48.876, 2.189, 5),
('Nanterre', 'Île-de-France', 48.892, 2.207, 5),
('Versailles', 'Île-de-France', 48.801, 2.130, 6),
('Le Chesnay', 'Île-de-France', 48.823, 2.132, 6),
('Lyon 2ème', 'Auvergne-Rhône-Alpes', 45.757, 4.832, 11),
('Lyon 6ème', 'Auvergne-Rhône-Alpes', 45.771, 4.850, 11),
('Marseille 1er', 'Provence-Alpes-Côte d''Azur', 43.296, 5.370, 16),
('Marseille 6ème', 'Provence-Alpes-Côte d''Azur', 43.288, 5.382, 16),
('Nice Centre', 'Provence-Alpes-Côte d''Azur', 43.710, 7.262, 17),
('Bordeaux Centre', 'Nouvelle-Aquitaine', 44.838, -0.579, 21),
('Nantes Centre', 'Pays de la Loire', 47.218, -1.554, 22),
('Lille Centre', 'Hauts-de-France', 50.637, 3.063, 26),
('Strasbourg Centre', 'Grand Est', 48.573, 7.752, 28),
('Toulouse Centre', 'Occitanie', 43.605, 1.444, 19),
('Rennes Centre', 'Bretagne', 48.117, -1.678, 23);

-- Generate stores: for each city × retailer combination
CREATE OR REPLACE TEMPORARY TABLE TEMP_MANAGERS AS
SELECT ROW_NUMBER() OVER (ORDER BY RANDOM()) AS RN, NAME FROM (
    SELECT 'Julie Roux' AS NAME UNION ALL SELECT 'Marie Dupont' UNION ALL SELECT 'Émilie Fournier'
    UNION ALL SELECT 'Sophie Martin' UNION ALL SELECT 'Lucie Bernard' UNION ALL SELECT 'Céline Garcia'
    UNION ALL SELECT 'Camille Laurent' UNION ALL SELECT 'Nathalie Petit' UNION ALL SELECT 'Isabelle Moreau'
    UNION ALL SELECT 'Aurélie Blanc' UNION ALL SELECT 'Pauline Girard' UNION ALL SELECT 'Marion Chevalier'
    UNION ALL SELECT 'Hélène Faure' UNION ALL SELECT 'Caroline Gauthier' UNION ALL SELECT 'Florence Mercier'
    UNION ALL SELECT 'Stéphanie Robin' UNION ALL SELECT 'Christine Duval' UNION ALL SELECT 'Anne-Sophie Lemaire'
    UNION ALL SELECT 'Véronique Morel' UNION ALL SELECT 'Manon Leroy'
);

CREATE OR REPLACE TEMPORARY TABLE TEMP_SUFFIXES AS
SELECT ROW_NUMBER() OVER (ORDER BY RANDOM()) AS RN, SUFFIX FROM (
    SELECT '' AS SUFFIX UNION ALL SELECT ' Centre' UNION ALL SELECT ' Gare'
    UNION ALL SELECT ' Forum' UNION ALL SELECT ' Les Halles' UNION ALL SELECT ' Beaugrenelle'
    UNION ALL SELECT ' Centre Ville' UNION ALL SELECT ' Galerie' UNION ALL SELECT ' Village'
    UNION ALL SELECT ' Rivoli' UNION ALL SELECT ' Grand Place' UNION ALL SELECT ' Avenue'
    UNION ALL SELECT ' Passage' UNION ALL SELECT ' Marché' UNION ALL SELECT ' Résidence'
    UNION ALL SELECT ' Outlet' UNION ALL SELECT ' Nord'
);

CREATE OR REPLACE TEMPORARY TABLE TEMP_STREETS AS
SELECT ROW_NUMBER() OVER (ORDER BY RANDOM()) AS RN, STREET FROM (
    SELECT 'Rue Commerce' AS STREET UNION ALL SELECT 'Rue' UNION ALL SELECT 'Avenue'
    UNION ALL SELECT 'Allée' UNION ALL SELECT 'Boulevard' UNION ALL SELECT 'Place'
);

-- Insert stores for main retailers
INSERT INTO STORES (RETAILER_NAME, STORE_NAME, STORE_TYPE, LOCATION_LAT, LOCATION_LONG, ADDRESS, REGION, STORE_MANAGER_NAME, REP_ID)
SELECT
    r.RETAILER_NAME,
    r.RETAILER_NAME || ' ' || c.CITY || COALESCE(s.SUFFIX, '') AS STORE_NAME,
    CASE WHEN UNIFORM(1, 10, RANDOM()) <= 1 THEN 'Indépendant' ELSE 'National Grand' END AS STORE_TYPE,
    c.BASE_LAT + (UNIFORM(-50, 50, RANDOM()) / 10000.0) AS LOCATION_LAT,
    c.BASE_LNG + (UNIFORM(-50, 50, RANDOM()) / 10000.0) AS LOCATION_LONG,
    UNIFORM(1, 350, RANDOM()) || ' ' ||
        (CASE MOD(UNIFORM(1,6,RANDOM()), 6)
            WHEN 0 THEN 'Rue Commerce'
            WHEN 1 THEN 'Rue'
            WHEN 2 THEN 'Avenue'
            WHEN 3 THEN 'Allée'
            WHEN 4 THEN 'Boulevard'
            ELSE 'Place'
        END) || ', ' || c.CITY || COALESCE(s.SUFFIX, '') AS ADDRESS,
    c.REGION,
    m.NAME AS STORE_MANAGER_NAME,
    c.REP_ID
FROM TEMP_CITIES c
CROSS JOIN (
    SELECT 'Sephora' AS RETAILER_NAME UNION ALL
    SELECT 'Marionnaud' UNION ALL
    SELECT 'Nocibé' UNION ALL
    SELECT 'Beauty Success' UNION ALL
    SELECT 'Galeries Lafayette' UNION ALL
    SELECT 'Printemps'
) r
CROSS JOIN TEMP_SUFFIXES s
CROSS JOIN TEMP_MANAGERS m
WHERE
    -- Limit combinations to get realistic store counts
    (r.RETAILER_NAME IN ('Sephora', 'Marionnaud', 'Nocibé') AND s.RN <= 4)
    OR (r.RETAILER_NAME = 'Beauty Success' AND s.RN <= 3)
    OR (r.RETAILER_NAME = 'Galeries Lafayette' AND s.RN = 1)
    OR (r.RETAILER_NAME = 'Printemps' AND s.RN = 1 AND c.REP_ID <= 5)
AND m.RN = MOD(ABS(HASH(c.CITY || r.RETAILER_NAME || s.SUFFIX)), 20) + 1
;

-- Drop temp tables
DROP TABLE IF EXISTS TEMP_CITIES;
DROP TABLE IF EXISTS TEMP_MANAGERS;
DROP TABLE IF EXISTS TEMP_SUFFIXES;
DROP TABLE IF EXISTS TEMP_STREETS;

-- ============================================================
-- STORE_PERFORMANCE (weekly KPI data, 26 weeks history)
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

-- Populate for hero rep (REP_ID=1) with retailer-specific ranges
INSERT INTO STORE_PERFORMANCE (STORE_ID, PRODUCT_ID, DATE, SELL_IN_UNITS, SELL_OUT_UNITS, SHELF_SHARE_PERCENT, NUMERICAL_DISTRIBUTION_STATUS, PROMO_EFFICIENCY_SCORE, MARKET_SHARE_PERCENT)
SELECT
  s.STORE_ID,
  p.PRODUCT_ID,
  DATEADD('day', -seq.seq * 7, CURRENT_DATE()) AS DATE,
  CASE
    WHEN s.RETAILER_NAME = 'Sephora' THEN UNIFORM(15, 45, RANDOM())
    WHEN s.RETAILER_NAME = 'Marionnaud' THEN UNIFORM(10, 35, RANDOM())
    WHEN s.RETAILER_NAME = 'Nocibé' THEN UNIFORM(8, 30, RANDOM())
    ELSE UNIFORM(5, 25, RANDOM())
  END AS SELL_IN_UNITS,
  CASE
    WHEN s.RETAILER_NAME = 'Sephora' THEN UNIFORM(12, 40, RANDOM())
    WHEN s.RETAILER_NAME = 'Marionnaud' THEN UNIFORM(8, 30, RANDOM())
    WHEN s.RETAILER_NAME = 'Nocibé' THEN UNIFORM(6, 25, RANDOM())
    ELSE UNIFORM(4, 20, RANDOM())
  END AS SELL_OUT_UNITS,
  CASE
    WHEN s.RETAILER_NAME = 'Sephora' THEN UNIFORM(120, 220, RANDOM()) / 10.0
    WHEN s.RETAILER_NAME = 'Marionnaud' THEN UNIFORM(100, 180, RANDOM()) / 10.0
    ELSE UNIFORM(80, 160, RANDOM()) / 10.0
  END AS SHELF_SHARE_PERCENT,
  CASE WHEN UNIFORM(1, 100, RANDOM()) <=
    CASE WHEN s.RETAILER_NAME = 'Sephora' THEN 85 WHEN s.RETAILER_NAME = 'Marionnaud' THEN 78 ELSE 72 END
    THEN TRUE ELSE FALSE
  END AS NUMERICAL_DISTRIBUTION_STATUS,
  UNIFORM(50, 92, RANDOM()) / 10.0 AS PROMO_EFFICIENCY_SCORE,
  CASE
    WHEN s.RETAILER_NAME = 'Sephora' THEN UNIFORM(100, 185, RANDOM()) / 10.0
    WHEN s.RETAILER_NAME = 'Marionnaud' THEN UNIFORM(80, 150, RANDOM()) / 10.0
    ELSE UNIFORM(60, 130, RANDOM()) / 10.0
  END AS MARKET_SHARE_PERCENT
FROM STORES s
CROSS JOIN PRODUCTS p
CROSS JOIN (SELECT SEQ4() AS seq FROM TABLE(GENERATOR(ROWCOUNT => 26))) seq
WHERE s.REP_ID = 1
  AND seq.seq BETWEEN 0 AND 25;

-- Also populate for a sample of other stores (for cross-retailer analytics)
INSERT INTO STORE_PERFORMANCE (STORE_ID, PRODUCT_ID, DATE, SELL_IN_UNITS, SELL_OUT_UNITS, SHELF_SHARE_PERCENT, NUMERICAL_DISTRIBUTION_STATUS, PROMO_EFFICIENCY_SCORE, MARKET_SHARE_PERCENT)
SELECT
  s.STORE_ID,
  p.PRODUCT_ID,
  DATEADD('day', -seq.seq * 7, CURRENT_DATE()) AS DATE,
  UNIFORM(5, 40, RANDOM()),
  UNIFORM(3, 35, RANDOM()),
  UNIFORM(80, 200, RANDOM()) / 10.0,
  CASE WHEN UNIFORM(1, 100, RANDOM()) <= 75 THEN TRUE ELSE FALSE END,
  UNIFORM(40, 90, RANDOM()) / 10.0,
  UNIFORM(50, 180, RANDOM()) / 10.0
FROM STORES s
CROSS JOIN PRODUCTS p
CROSS JOIN (SELECT SEQ4() AS seq FROM TABLE(GENERATOR(ROWCOUNT => 26))) seq
WHERE s.REP_ID IN (2, 3, 4, 5)
  AND seq.seq BETWEEN 0 AND 25
  AND MOD(HASH(s.STORE_ID), 3) = 0;  -- sample ~1/3 of stores for other reps

-- ============================================================
-- VISITS (empty — populated by demo reset endpoint)
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

-- ============================================================
-- STORE_AUDITS (audit history with multi-dimensional scoring)
-- ============================================================
CREATE OR REPLACE TABLE STORE_AUDITS (
    AUDIT_ID INTEGER AUTOINCREMENT,
    STORE_ID INTEGER,
    REP_ID INTEGER,
    AUDIT_DATE DATE,
    PLANOGRAM_COMPLIANCE_SCORE FLOAT,
    PRICE_COMPLIANCE_SCORE FLOAT,
    STOCK_AVAILABILITY_SCORE FLOAT,
    VISIBILITY_SCORE FLOAT,
    OVERALL_SCORE FLOAT,
    NOTES VARCHAR(2000)
);

-- Insert audits for hero rep stores (using subquery to get store IDs dynamically)
INSERT INTO STORE_AUDITS (STORE_ID, REP_ID, AUDIT_DATE, PLANOGRAM_COMPLIANCE_SCORE, PRICE_COMPLIANCE_SCORE, STOCK_AVAILABILITY_SCORE, VISIBILITY_SCORE, OVERALL_SCORE, NOTES)
SELECT s.STORE_ID, 1, d.AUDIT_DATE, d.PLANOGRAM, d.PRICE, d.STOCK, d.VISIBILITY, d.OVERALL, d.NOTES
FROM STORES s
JOIN (
    SELECT 'Sephora Clamart' AS MATCH_NAME, '2026-05-28'::DATE AS AUDIT_DATE, 8.5 AS PLANOGRAM, 9.0 AS PRICE, 7.5 AS STOCK, 8.0 AS VISIBILITY, 8.3 AS OVERALL, 'Good planogram compliance. Missing 2 Skincare references on shelf. Oud Mystique well positioned.' AS NOTES UNION ALL
    SELECT 'Sephora Clamart', '2026-05-14', 7.2, 8.5, 6.0, 7.0, 7.2, 'Stock issue on Velours Noir — 3 days out of stock. Corrective order placed.' UNION ALL
    SELECT 'Sephora Clamart', '2026-04-30', 9.0, 9.5, 9.0, 9.0, 9.1, 'Excellent execution. Full range distributed. End-cap activated for spring campaign.' UNION ALL
    SELECT 'Sephora Clamart Gare', '2026-05-25', 7.0, 8.0, 8.5, 6.5, 7.5, 'Visibility could be improved — competitor gained 1 facing. Stock OK.' UNION ALL
    SELECT 'Sephora Clamart Gare', '2026-05-10', 8.0, 9.0, 8.0, 8.0, 8.3, 'Good overall. New gondola head for summer confirmed.' UNION ALL
    SELECT 'Sephora Paris 16ème', '2026-05-20', 6.5, 7.0, 5.5, 6.0, 6.3, 'Multiple out-of-stocks. Store team confirmed delivery delays from warehouse.' UNION ALL
    SELECT 'Sephora Paris 16ème', '2026-05-05', 8.5, 8.5, 8.0, 8.5, 8.4, 'Strong execution. Sephora 16ème remains a top performer.' UNION ALL
    SELECT 'Sephora Paris 8ème', '2026-05-22', 9.0, 9.5, 9.0, 9.5, 9.3, 'Flagship execution. Perfect compliance. Strong summer setup.' UNION ALL
    SELECT 'Marionnaud Clamart', '2026-05-18', 7.5, 8.0, 7.0, 7.5, 7.5, 'Average compliance. Discussed planogram reset with store manager.' UNION ALL
    SELECT 'Nocibé Clamart', '2026-05-15', 6.0, 7.0, 5.0, 6.5, 6.1, 'Poor stock situation. 5 references out of stock. Case opened with logistics.'
) d ON s.STORE_NAME LIKE d.MATCH_NAME || '%'
WHERE s.REP_ID = 1
QUALIFY ROW_NUMBER() OVER (PARTITION BY d.MATCH_NAME, d.AUDIT_DATE ORDER BY s.STORE_ID) = 1;

-- ============================================================
-- STORE_CASES (issues/incidents tracking)
-- ============================================================
CREATE OR REPLACE TABLE STORE_CASES (
    CASE_ID INTEGER AUTOINCREMENT,
    STORE_ID INTEGER,
    REP_ID INTEGER,
    CASE_DATE DATE,
    CASE_TYPE VARCHAR(100),
    SEVERITY VARCHAR(20),
    STATUS VARCHAR(50),
    SUBJECT VARCHAR(500),
    DESCRIPTION VARCHAR(2000),
    RESOLUTION VARCHAR(2000),
    RESOLVED_DATE DATE
);

INSERT INTO STORE_CASES (STORE_ID, REP_ID, CASE_DATE, CASE_TYPE, SEVERITY, STATUS, SUBJECT, DESCRIPTION, RESOLUTION, RESOLVED_DATE)
SELECT s.STORE_ID, 1, d.CASE_DATE, d.CASE_TYPE, d.SEVERITY, d.STATUS, d.SUBJECT, d.DESCRIPTION, d.RESOLUTION, d.RESOLVED_DATE
FROM STORES s
JOIN (
    SELECT 'Sephora Clamart' AS MATCH_NAME, '2026-05-25'::DATE AS CASE_DATE, 'Delivery Issue' AS CASE_TYPE, 'Medium' AS SEVERITY, 'Open' AS STATUS, 'Late delivery — Skincare batch' AS SUBJECT, 'Delivery for 12 units of Crème Absolue and 8 units Sérum Lumière was 4 days late. Store ran out of stock during weekend peak.' AS DESCRIPTION, NULL AS RESOLUTION, NULL::DATE AS RESOLVED_DATE UNION ALL
    SELECT 'Sephora Clamart', '2026-05-10', 'Planogram Non-Compliance', 'Low', 'Resolved', 'Competitor product placed in Velvet bay', 'Store team accidentally placed competitor testers in the Velvet F&B gondola.', 'Removed competitor product. Reinforced planogram with store manager.', '2026-05-10' UNION ALL
    SELECT 'Sephora Clamart', '2026-04-20', 'Stock Issue', 'High', 'Resolved', 'Oud Mystique rupture — 2 weeks', 'Oud Mystique completely out of stock for 2 weeks due to warehouse allocation error.', 'Emergency replenishment ordered. Store received 24 units within 48h.', '2026-04-22' UNION ALL
    SELECT 'Sephora Paris 16ème', '2026-05-18', 'Delivery Issue', 'High', 'Open', 'Repeated delivery delays', 'Third consecutive delivery delayed by 3+ days. Impacting DN and sell-out. Store manager threatening to reduce facing.', NULL, NULL UNION ALL
    SELECT 'Sephora Paris 8ème', '2026-05-30', 'Stock Issue', 'Low', 'Open', 'Low stock alert — Velours Noir', 'Only 3 units remaining. Projected to sell out by Friday.', NULL, NULL UNION ALL
    SELECT 'Marionnaud Clamart', '2026-05-20', 'Planogram Non-Compliance', 'Medium', 'Open', 'Reduced facing after store renovation', 'After Marionnaud Clamart renovation, Velvet F&B went from 4 facings to 2. Negotiation needed.', NULL, NULL UNION ALL
    SELECT 'Nocibé Clamart', '2026-05-14', 'Delivery Issue', 'High', 'Open', 'Missing 5 references from delivery', '5 SKUs missing from last delivery. Warehouse confirms shipping error. Re-delivery pending.', NULL, NULL
) d ON s.STORE_NAME = d.MATCH_NAME
WHERE s.REP_ID = 1
QUALIFY ROW_NUMBER() OVER (PARTITION BY d.MATCH_NAME, d.CASE_DATE ORDER BY s.STORE_ID) = 1;

-- ============================================================
-- RETAILER_NEWS (organizational changes & commercial news)
-- ============================================================
CREATE OR REPLACE TABLE RETAILER_NEWS (
    NEWS_ID INTEGER AUTOINCREMENT,
    RETAILER_NAME VARCHAR(100),
    NEWS_DATE DATE,
    NEWS_TYPE VARCHAR(50),
    TITLE VARCHAR(500),
    DESCRIPTION VARCHAR(2000),
    IMPACT_LEVEL VARCHAR(20)
);

INSERT INTO RETAILER_NEWS (RETAILER_NAME, NEWS_DATE, NEWS_TYPE, TITLE, DESCRIPTION, IMPACT_LEVEL) VALUES
('Sephora', DATEADD('day', -8, CURRENT_DATE()), 'Organization Change', 'New Zone Director — Île-de-France West', 'Marie Dupont replaces Jean-Luc Moreau as Zone Director for Île-de-France West (incl. Clamart, Sèvres, Saint-Cloud). Marie comes from Sephora Bordeaux region.', 'High'),
('Sephora', DATEADD('day', -4, CURRENT_DATE()), 'Commercial', 'Summer Campaign — 15% extra facing available', 'Sephora offering premium brands opportunity for 15% extra facing during June-August summer campaign. Application deadline in 10 days.', 'High'),
('Marionnaud', DATEADD('day', -16, CURRENT_DATE()), 'Organization Change', 'Store renovation program — Wave 2', 'Marionnaud accelerating renovation program. Clamart and Paris 8ème stores scheduled for Q3. May impact shelf allocation during works.', 'Medium'),
('Marionnaud', DATEADD('day', -21, CURRENT_DATE()), 'Commercial', 'New loyalty program mechanics', 'Marionnaud launching enhanced loyalty program in September. Brands can opt-in for extra visibility. Early bird registration open.', 'Low'),
('Nocibé', DATEADD('day', -3, CURRENT_DATE()), 'Organization Change', 'New Regional Manager — Paris Region', 'Sophie Martin appointed as new Regional Manager Paris. Previously at Douglas Germany. First store visits planned for mid-month.', 'High'),
('Nocibé', DATEADD('day', -11, CURRENT_DATE()), 'Commercial', 'Back-to-school premium push', 'Nocibé planning premium fragrance push for September back-to-school. Looking for exclusive sets and coffrets.', 'Medium'),
('Beauty Success', DATEADD('day', -18, CURRENT_DATE()), 'Organization Change', 'Franchise owner change — Clamart', 'Beauty Success Clamart has a new franchise owner. Transition period through end of month.', 'Medium'),
('Sephora', DATEADD('day', -26, CURRENT_DATE()), 'Performance', 'Q1 results — Fragrance +12% YoY', 'Sephora France Q1 results show fragrance category up 12% YoY. Premium niche brands outperforming mainstream. Positive signal for Velvet F&B positioning.', 'Low');

-- ============================================================
-- PRODUCT CATALOG (Sellable, Pack, Non-sellable)
-- ============================================================
CREATE OR REPLACE TABLE PRODUCT_CATALOG (
    CATALOG_ID INTEGER AUTOINCREMENT,
    PRODUCT_ID INTEGER,
    PRODUCT_NAME VARCHAR(200),
    CATEGORY VARCHAR(50),
    PRODUCT_TYPE VARCHAR(50),
    SKU VARCHAR(50),
    EAN VARCHAR(20),
    PRICE FLOAT,
    DESCRIPTION VARCHAR(500),
    IMAGE_URL VARCHAR(500),
    IS_ACTIVE BOOLEAN DEFAULT TRUE,
    PACK_CONTENTS VARCHAR(1000),
    SEASON VARCHAR(50)
);

INSERT INTO PRODUCT_CATALOG (PRODUCT_ID, PRODUCT_NAME, CATEGORY, PRODUCT_TYPE, SKU, EAN, PRICE, DESCRIPTION, IMAGE_URL, IS_ACTIVE, PACK_CONTENTS, SEASON) VALUES
(1, 'Oud Mystique EDP 100ml', 'Fragrance', 'Sellable', 'VFB-FR-001', '3614273000011', 185.00, 'Opulent oriental fragrance', '/images/oud_mystique.jpg', TRUE, NULL, NULL),
(2, 'Lumière de Soie EDP 75ml', 'Fragrance', 'Sellable', 'VFB-FR-002', '3614273000028', 145.00, 'Luminous floral', '/images/lumiere_soie.jpg', TRUE, NULL, NULL),
(3, 'Noir Absolu EDP 100ml', 'Fragrance', 'Sellable', 'VFB-FR-003', '3614273000035', 165.00, 'Dark magnetic', '/images/noir_absolu.jpg', TRUE, NULL, NULL),
(4, 'Jardin Éphémère EDT 50ml', 'Fragrance', 'Sellable', 'VFB-FR-004', '3614273000042', 95.00, 'Fresh green', '/images/jardin_ephemere.jpg', TRUE, NULL, NULL),
(5, 'Ambre Céleste EDP 75ml', 'Fragrance', 'Sellable', 'VFB-FR-005', '3614273000059', 155.00, 'Solar warmth', '/images/ambre_celeste.jpg', TRUE, NULL, NULL),
(6, 'Éclat Suprême Sérum 30ml', 'Skincare', 'Sellable', 'VFB-SK-001', '3614273000066', 92.00, 'Vitamin C + hyaluronic acid', '/images/eclat_serum.jpg', TRUE, NULL, NULL),
(7, 'Crème Nuit Régénérante 50ml', 'Skincare', 'Sellable', 'VFB-SK-002', '3614273000073', 78.00, 'Overnight regenerating cream', '/images/creme_nuit.jpg', TRUE, NULL, NULL),
(8, 'Masque Or 24K', 'Skincare', 'Sellable', 'VFB-SK-003', '3614273000080', 65.00, 'Peel-off mask with gold', '/images/masque_or.jpg', TRUE, NULL, NULL),
(9, 'Contour des Yeux Précieux 15ml', 'Skincare', 'Sellable', 'VFB-SK-004', '3614273000097', 58.00, 'Eye treatment', '/images/contour_yeux.jpg', TRUE, NULL, NULL),
(10, 'Huile Royale Visage 30ml', 'Skincare', 'Sellable', 'VFB-SK-005', '3614273000103', 72.00, 'Facial oil', '/images/huile_royale.jpg', TRUE, NULL, NULL),
(11, 'Rouge Velours Éternel', 'Makeup', 'Sellable', 'VFB-MK-001', '3614273000110', 42.00, 'Long-wear matte lipstick', '/images/rouge_velours.jpg', TRUE, NULL, NULL),
(12, 'Palette Regard Opéra', 'Makeup', 'Sellable', 'VFB-MK-002', '3614273000127', 68.00, '12-shade eyeshadow palette', '/images/palette_opera.jpg', TRUE, NULL, NULL),
(13, 'Fond de Teint Perfection', 'Makeup', 'Sellable', 'VFB-MK-003', '3614273000134', 52.00, 'Buildable coverage foundation', '/images/fond_teint.jpg', TRUE, NULL, NULL),
(14, 'Mascara Volume Infini', 'Makeup', 'Sellable', 'VFB-MK-004', '3614273000141', 38.00, 'Volumizing mascara', '/images/mascara_infini.jpg', TRUE, NULL, NULL),
(15, 'Poudre Lumière Haute', 'Makeup', 'Sellable', 'VFB-MK-005', '3614273000158', 48.00, 'Baked highlighting powder', '/images/poudre_lumiere.jpg', TRUE, NULL, NULL),
(101, 'Coffret Fête des Mères — Oud Mystique', 'Fragrance', 'Pack', 'VFB-PK-001', '3614273001018', 215.00, 'EDP 100ml + Body Lotion 75ml + Miniature 10ml', '/images/pack_mothers_oud.jpg', TRUE, 'Oud Mystique EDP 100ml, Body Lotion Oud 75ml, Mini Oud 10ml', 'Fête des Mères'),
(102, 'Coffret Noël Lumière', 'Fragrance', 'Pack', 'VFB-PK-002', '3614273001025', 175.00, 'EDP 75ml + Candle + Travel Spray 15ml', '/images/pack_noel_lumiere.jpg', TRUE, 'Lumière de Soie EDP 75ml, Bougie Parfumée, Vaporisateur Voyage 15ml', 'Noël'),
(103, 'Coffret Saint-Valentin Noir', 'Fragrance', 'Pack', 'VFB-PK-003', '3614273001032', 195.00, 'EDP 100ml + Shower Gel 100ml + Pouch', '/images/pack_valentine_noir.jpg', TRUE, 'Noir Absolu EDP 100ml, Gel Douche 100ml, Pochette Cuir', 'Saint-Valentin'),
(104, 'Ritual Skincare Coffret', 'Skincare', 'Pack', 'VFB-PK-004', '3614273001049', 165.00, 'Sérum + Crème Nuit + Masque Or (mini sizes)', '/images/pack_skincare_ritual.jpg', TRUE, 'Éclat Suprême Sérum 15ml, Crème Nuit 25ml, Masque Or mini', 'Toute saison'),
(105, 'Coffret Été Jardin', 'Fragrance', 'Pack', 'VFB-PK-005', '3614273001056', 125.00, 'EDT 50ml + After-sun Mist 100ml', '/images/pack_summer_jardin.jpg', TRUE, 'Jardin Éphémère EDT 50ml, Brume Après-Soleil 100ml', 'Été'),
(106, 'Coffret Makeup Opéra', 'Makeup', 'Pack', 'VFB-PK-006', '3614273001063', 98.00, 'Palette + Mascara + Rouge Velours', '/images/pack_makeup_opera.jpg', TRUE, 'Palette Regard Opéra, Mascara Volume Infini, Rouge Velours Éternel', 'Noël'),
(201, 'Testeur Oud Mystique', 'Fragrance', 'Non-sellable', 'VFB-NS-001', NULL, 0, 'Testeur magasin', '/images/tester_oud.jpg', TRUE, NULL, NULL),
(202, 'Testeur Lumière de Soie', 'Fragrance', 'Non-sellable', 'VFB-NS-002', NULL, 0, 'Testeur magasin', '/images/tester_lumiere.jpg', TRUE, NULL, NULL),
(203, 'Testeur Noir Absolu', 'Fragrance', 'Non-sellable', 'VFB-NS-003', NULL, 0, 'Testeur magasin', '/images/tester_noir.jpg', TRUE, NULL, NULL),
(204, 'Échantillon Éclat Suprême 5ml (x50)', 'Skincare', 'Non-sellable', 'VFB-NS-004', NULL, 0, 'Boîte de 50 échantillons sérum 5ml', '/images/sample_eclat.jpg', TRUE, NULL, NULL),
(205, 'Échantillon Crème Nuit 5ml (x50)', 'Skincare', 'Non-sellable', 'VFB-NS-005', NULL, 0, 'Boîte de 50 échantillons crème nuit', '/images/sample_creme.jpg', TRUE, NULL, NULL),
(206, 'Podium Display Fragrance', 'Display', 'Non-sellable', 'VFB-NS-006', NULL, 0, 'Podium display bois et verre 60x40cm', '/images/display_fragrance.jpg', TRUE, NULL, NULL),
(207, 'Podium Display Skincare', 'Display', 'Non-sellable', 'VFB-NS-007', NULL, 0, 'Podium display métal doré 50x35cm', '/images/display_skincare.jpg', TRUE, NULL, NULL),
(208, 'Back Wall Velvet F&B', 'Display', 'Non-sellable', 'VFB-NS-008', NULL, 0, 'Panneau mural marque 120x80cm', '/images/backwall.jpg', TRUE, NULL, NULL),
(209, 'Glorifier Oud Mystique', 'Display', 'Non-sellable', 'VFB-NS-009', NULL, 0, 'Glorifier premium', '/images/glorifier_oud.jpg', TRUE, NULL, NULL),
(210, 'Kit Touche à Essayer (x100)', 'Fragrance', 'Non-sellable', 'VFB-NS-010', NULL, 0, 'Lot de 100 touches à parfum', '/images/blotters.jpg', TRUE, NULL, NULL);

-- ============================================================
-- PLANOGRAMS (theoretical per retailer/store_type)
-- ============================================================
CREATE OR REPLACE TABLE PLANOGRAMS (
    PLANOGRAM_ID INTEGER AUTOINCREMENT,
    RETAILER_NAME VARCHAR(100),
    STORE_TYPE VARCHAR(100),
    CATALOG_ID INTEGER,
    PRODUCT_NAME VARCHAR(200),
    SHELF_POSITION VARCHAR(20),
    FACING_COUNT INTEGER,
    SHELF_NUMBER INTEGER
);

INSERT INTO PLANOGRAMS (RETAILER_NAME, STORE_TYPE, CATALOG_ID, PRODUCT_NAME, SHELF_POSITION, FACING_COUNT, SHELF_NUMBER) VALUES
('Sephora', 'National Grand', 1, 'Oud Mystique EDP 100ml', 'Middle', 3, 2),
('Sephora', 'National Grand', 2, 'Lumière de Soie EDP 75ml', 'Middle', 2, 2),
('Sephora', 'National Grand', 3, 'Noir Absolu EDP 100ml', 'Middle', 2, 2),
('Sephora', 'National Grand', 4, 'Jardin Éphémère EDT 50ml', 'High', 2, 1),
('Sephora', 'National Grand', 5, 'Ambre Céleste EDP 75ml', 'High', 2, 1),
('Sephora', 'National Grand', 6, 'Éclat Suprême Sérum 30ml', 'Middle', 2, 3),
('Sephora', 'National Grand', 7, 'Crème Nuit Régénérante 50ml', 'Middle', 2, 3),
('Sephora', 'National Grand', 8, 'Masque Or 24K', 'Low', 1, 4),
('Sephora', 'National Grand', 9, 'Contour des Yeux Précieux 15ml', 'High', 2, 3),
('Sephora', 'National Grand', 10, 'Huile Royale Visage 30ml', 'Low', 1, 4),
('Sephora', 'National Grand', 11, 'Rouge Velours Éternel', 'Middle', 3, 5),
('Sephora', 'National Grand', 12, 'Palette Regard Opéra', 'Middle', 2, 5),
('Sephora', 'National Grand', 13, 'Fond de Teint Perfection', 'Low', 2, 6),
('Sephora', 'National Grand', 14, 'Mascara Volume Infini', 'High', 3, 5),
('Sephora', 'National Grand', 15, 'Poudre Lumière Haute', 'High', 2, 5),
('Marionnaud', 'National Grand', 1, 'Oud Mystique EDP 100ml', 'Middle', 2, 2),
('Marionnaud', 'National Grand', 2, 'Lumière de Soie EDP 75ml', 'Middle', 2, 2),
('Marionnaud', 'National Grand', 3, 'Noir Absolu EDP 100ml', 'High', 1, 1),
('Marionnaud', 'National Grand', 5, 'Ambre Céleste EDP 75ml', 'High', 1, 1),
('Marionnaud', 'National Grand', 6, 'Éclat Suprême Sérum 30ml', 'Middle', 2, 3),
('Marionnaud', 'National Grand', 7, 'Crème Nuit Régénérante 50ml', 'Middle', 1, 3),
('Marionnaud', 'National Grand', 11, 'Rouge Velours Éternel', 'Middle', 2, 4),
('Marionnaud', 'National Grand', 14, 'Mascara Volume Infini', 'High', 2, 4),
('Nocibé', 'National Grand', 1, 'Oud Mystique EDP 100ml', 'Middle', 2, 2),
('Nocibé', 'National Grand', 2, 'Lumière de Soie EDP 75ml', 'Middle', 1, 2),
('Nocibé', 'National Grand', 3, 'Noir Absolu EDP 100ml', 'Middle', 1, 2),
('Nocibé', 'National Grand', 6, 'Éclat Suprême Sérum 30ml', 'Middle', 1, 3),
('Nocibé', 'National Grand', 11, 'Rouge Velours Éternel', 'Middle', 2, 4),
('Nocibé', 'National Grand', 12, 'Palette Regard Opéra', 'Low', 1, 4),
('Nocibé', 'National Grand', 14, 'Mascara Volume Infini', 'High', 2, 4);

-- ============================================================
-- VISIT PHOTOS (stage + table)
-- ============================================================
CREATE STAGE IF NOT EXISTS VISIT_PHOTOS ENCRYPTION = (TYPE = 'SNOWFLAKE_SSE');

CREATE OR REPLACE TABLE VISIT_PHOTOS (
    PHOTO_ID INTEGER AUTOINCREMENT,
    VISIT_ID INTEGER,
    STORE_ID INTEGER,
    REP_ID INTEGER,
    PHOTO_TYPE VARCHAR(50),
    FILE_PATH VARCHAR(500),
    NOTES VARCHAR(500),
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- ============================================================
-- VISIT MERCHANDISING (store check data)
-- ============================================================
CREATE OR REPLACE TABLE VISIT_MERCHANDISING (
    RECORD_ID INTEGER AUTOINCREMENT,
    VISIT_ID INTEGER,
    STORE_ID INTEGER,
    CATALOG_ID INTEGER,
    SHELF_POSITION VARCHAR(20),
    FACING_COUNT INTEGER,
    IS_OUT_OF_STOCK BOOLEAN DEFAULT FALSE,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- ============================================================
-- STORE_ASSORTMENT (products listed per store)
-- ============================================================
CREATE OR REPLACE TABLE STORE_ASSORTMENT (
    ASSORTMENT_ID INTEGER AUTOINCREMENT,
    STORE_ID INTEGER,
    CATALOG_ID INTEGER,
    IS_LISTED BOOLEAN DEFAULT TRUE,
    LISTED_DATE DATE
);

INSERT INTO STORE_ASSORTMENT (STORE_ID, CATALOG_ID, IS_LISTED, LISTED_DATE)
SELECT 65, CATALOG_ID, TRUE, DATEADD(MONTH, -3, CURRENT_DATE())
FROM PRODUCT_CATALOG
WHERE PRODUCT_TYPE = 'Sellable';

INSERT INTO STORE_ASSORTMENT (STORE_ID, CATALOG_ID, IS_LISTED, LISTED_DATE)
SELECT s.STORE_ID, c.CATALOG_ID, TRUE, DATEADD(MONTH, -3, CURRENT_DATE())
FROM STORES s
CROSS JOIN PRODUCT_CATALOG c
WHERE s.REP_ID = 1 AND s.STORE_ID != 65
AND c.PRODUCT_TYPE = 'Sellable'
AND UNIFORM(0, 100, RANDOM()) < 70
LIMIT 500;

-- ============================================================
-- PROMOTIONS (activatable in-store promotions)
-- ============================================================
CREATE OR REPLACE TABLE PROMOTIONS (
    PROMO_ID INTEGER AUTOINCREMENT,
    PROMO_NAME VARCHAR(200),
    PROMO_TYPE VARCHAR(50),
    DESCRIPTION VARCHAR(500),
    DISCOUNT_VALUE FLOAT,
    APPLICABLE_CATEGORIES VARCHAR(200),
    START_DATE DATE,
    END_DATE DATE,
    IS_ACTIVE BOOLEAN DEFAULT TRUE
);

INSERT INTO PROMOTIONS (PROMO_NAME, PROMO_TYPE, DESCRIPTION, DISCOUNT_VALUE, APPLICABLE_CATEGORIES, START_DATE, END_DATE, IS_ACTIVE) VALUES
('BOGOF Fragrance', 'BOGOF', 'Buy One Get One Free on selected fragrances', 100, 'Fragrance', DATEADD(DAY, -15, CURRENT_DATE()), DATEADD(DAY, 45, CURRENT_DATE()), TRUE),
('-30% 2nd Product Skincare', 'PERCENT_2ND', '-30% on second skincare product purchased', 30, 'Skincare', DATEADD(DAY, -10, CURRENT_DATE()), DATEADD(DAY, 50, CURRENT_DATE()), TRUE),
('-20% Palette + Mascara Bundle', 'BUNDLE', '-20% when buying Palette Regard Opéra + Mascara Volume Infini', 20, 'Makeup', DATEADD(DAY, -5, CURRENT_DATE()), DATEADD(DAY, 60, CURRENT_DATE()), TRUE),
('3 for 2 Skincare Minis', '3FOR2', 'Buy 3 skincare products, cheapest free', 33, 'Skincare', DATEADD(DAY, -20, CURRENT_DATE()), DATEADD(DAY, 40, CURRENT_DATE()), TRUE),
('Coffret Offert dès 120€', 'GWP', 'Free mini coffret with purchases over €120', 0, 'All', DATEADD(DAY, -7, CURRENT_DATE()), DATEADD(DAY, 30, CURRENT_DATE()), TRUE),
('-15% Lancement Ambre Céleste', 'PERCENT_OFF', '-15% introductory offer on Ambre Céleste EDP', 15, 'Fragrance', DATEADD(DAY, -3, CURRENT_DATE()), DATEADD(DAY, 25, CURRENT_DATE()), TRUE),
('Duo Maquillage -25%', 'PERCENT_OFF', '-25% on any 2 makeup products', 25, 'Makeup', DATEADD(DAY, -12, CURRENT_DATE()), DATEADD(DAY, 35, CURRENT_DATE()), TRUE),
('Échantillons Offerts x3', 'SAMPLING', '3 free samples with any fragrance purchase', 0, 'Fragrance', DATEADD(DAY, -30, CURRENT_DATE()), DATEADD(DAY, 60, CURRENT_DATE()), TRUE);

-- ============================================================
-- QUOTAS (quarterly territory quotas for non-sellable items)
-- ============================================================
CREATE OR REPLACE TABLE QUOTAS (
    QUOTA_ID INTEGER AUTOINCREMENT,
    REP_ID INTEGER,
    CATALOG_ID INTEGER,
    PRODUCT_NAME VARCHAR(200),
    QUARTER VARCHAR(10),
    YEAR INTEGER,
    QUOTA_QTY INTEGER,
    USED_QTY INTEGER DEFAULT 0
);

INSERT INTO QUOTAS (REP_ID, CATALOG_ID, PRODUCT_NAME, QUARTER, YEAR, QUOTA_QTY, USED_QTY)
SELECT 1, CATALOG_ID, PRODUCT_NAME,
  'Q' || CEIL(MONTH(CURRENT_DATE()) / 3),
  YEAR(CURRENT_DATE()),
  CASE WHEN PRODUCT_NAME LIKE '%Kit%' OR PRODUCT_NAME LIKE '%chantillon%' THEN UNIFORM(10, 15, RANDOM())
       WHEN PRODUCT_NAME LIKE '%Testeur%' THEN UNIFORM(6, 8, RANDOM())
       ELSE UNIFORM(2, 4, RANDOM()) END,
  UNIFORM(0, 5, RANDOM())
FROM PRODUCT_CATALOG
WHERE PRODUCT_TYPE = 'Non-sellable';

-- ============================================================
-- VERIFY SETUP
-- ============================================================
SELECT 'Setup complete!' AS STATUS,
    (SELECT COUNT(*) FROM PRODUCTS) AS PRODUCTS,
    (SELECT COUNT(*) FROM STORES) AS STORES,
    (SELECT COUNT(*) FROM FIELD_SALES) AS REPS,
    (SELECT COUNT(*) FROM STORE_PERFORMANCE) AS PERF_RECORDS,
    (SELECT COUNT(*) FROM STORE_AUDITS) AS AUDITS,
    (SELECT COUNT(*) FROM STORE_CASES) AS CASES,
    (SELECT COUNT(*) FROM RETAILER_NEWS) AS NEWS,
    (SELECT COUNT(*) FROM PRODUCT_CATALOG) AS CATALOG,
    (SELECT COUNT(*) FROM PLANOGRAMS) AS PLANOGRAMS,
    (SELECT COUNT(*) FROM STORE_ASSORTMENT) AS ASSORTMENT,
    (SELECT COUNT(*) FROM PROMOTIONS) AS PROMOTIONS,
    (SELECT COUNT(*) FROM QUOTAS) AS QUOTAS;
