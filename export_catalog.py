import openpyxl

wb = openpyxl.Workbook()
ws = wb.active
ws.title = 'Product Catalog'

headers = ['CATALOG_ID', 'PRODUCT_NAME', 'CATEGORY', 'PRODUCT_TYPE', 'DESCRIPTION', 'IMAGE_FILENAME']
ws.append(headers)

data = [
    (1, 'Oud Mystique EDP 100ml', 'Fragrance', 'Sellable', 'Opulent oriental fragrance — oud, saffron, amber', 'oud_mystique.jpg'),
    (2, 'Lumière de Soie EDP 75ml', 'Fragrance', 'Sellable', 'Luminous floral — white gardenia, silk musk, bergamot', 'lumiere_soie.jpg'),
    (3, 'Noir Absolu EDP 100ml', 'Fragrance', 'Sellable', 'Dark magnetic — black orchid, leather, tonka bean', 'noir_absolu.jpg'),
    (4, 'Jardin Éphémère EDT 50ml', 'Fragrance', 'Sellable', 'Fresh green — fig leaves, peony, white cedar', 'jardin_ephemere.jpg'),
    (5, 'Ambre Céleste EDP 75ml', 'Fragrance', 'Sellable', 'Solar warmth — amber, labdanum, golden vanilla', 'ambre_celeste.jpg'),
    (6, 'Éclat Suprême Sérum 30ml', 'Skincare', 'Sellable', 'Vitamin C + hyaluronic acid with 24K gold microparticles', 'eclat_serum.jpg'),
    (7, 'Crème Nuit Régénérante 50ml', 'Skincare', 'Sellable', 'Overnight regenerating cream with retinol microspheres', 'creme_nuit.jpg'),
    (8, 'Masque Or 24K', 'Skincare', 'Sellable', 'Peel-off mask with colloidal gold and marine collagen', 'masque_or.jpg'),
    (9, 'Contour des Yeux Précieux 15ml', 'Skincare', 'Sellable', 'Eye treatment — peptides, caffeine, diamond powder', 'contour_yeux.jpg'),
    (10, 'Huile Royale Visage 30ml', 'Skincare', 'Sellable', 'Facial oil — argan, rosehip, Damask rose', 'huile_royale.jpg'),
    (11, 'Rouge Velours Éternel', 'Makeup', 'Sellable', 'Long-wear matte lipstick — burgundy cashmere finish', 'rouge_velours.jpg'),
    (12, 'Palette Regard Opéra', 'Makeup', 'Sellable', '12-shade eyeshadow palette — golds to mahoganies', 'palette_opera.jpg'),
    (13, 'Fond de Teint Perfection', 'Makeup', 'Sellable', 'Buildable coverage foundation SPF 30', 'fond_teint.jpg'),
    (14, 'Mascara Volume Infini', 'Makeup', 'Sellable', 'Volumizing mascara with fiber-extension complex', 'mascara_infini.jpg'),
    (15, 'Poudre Lumière Haute', 'Makeup', 'Sellable', 'Baked highlighting powder with light-reflecting pearls', 'poudre_lumiere.jpg'),
    (16, 'Coffret Fête des Mères — Oud Mystique', 'Fragrance', 'Pack', 'EDP 100ml + Body Lotion 75ml + Miniature 10ml', 'pack_mothers_oud.jpg'),
    (17, 'Coffret Noël Lumière', 'Fragrance', 'Pack', 'EDP 75ml + Candle + Travel Spray 15ml', 'pack_noel_lumiere.jpg'),
    (18, 'Coffret Saint-Valentin Noir', 'Fragrance', 'Pack', 'EDP 100ml + Shower Gel 100ml + Pouch', 'pack_valentine_noir.jpg'),
    (19, 'Ritual Skincare Coffret', 'Skincare', 'Pack', 'Sérum + Crème Nuit + Masque Or (mini sizes)', 'pack_skincare_ritual.jpg'),
    (20, 'Coffret Été Jardin', 'Fragrance', 'Pack', 'EDT 50ml + After-sun Mist 100ml', 'pack_summer_jardin.jpg'),
    (21, 'Coffret Makeup Opéra', 'Makeup', 'Pack', 'Palette + Mascara + Rouge Velours', 'pack_makeup_opera.jpg'),
    (22, 'Testeur Oud Mystique', 'Fragrance', 'Non-sellable', 'Testeur magasin — flacon standard sans packaging', 'tester_oud.jpg'),
    (23, 'Testeur Lumière de Soie', 'Fragrance', 'Non-sellable', 'Testeur magasin', 'tester_lumiere.jpg'),
    (24, 'Testeur Noir Absolu', 'Fragrance', 'Non-sellable', 'Testeur magasin', 'tester_noir.jpg'),
    (25, 'Échantillon Éclat Suprême 5ml (x50)', 'Skincare', 'Non-sellable', 'Boîte de 50 échantillons sérum 5ml', 'sample_eclat.jpg'),
    (26, 'Échantillon Crème Nuit 5ml (x50)', 'Skincare', 'Non-sellable', 'Boîte de 50 échantillons crème nuit', 'sample_creme.jpg'),
    (27, 'Podium Display Fragrance', 'Display', 'Non-sellable', 'Podium display bois et verre — gamme Fragrance (60x40cm)', 'display_fragrance.jpg'),
    (28, 'Podium Display Skincare', 'Display', 'Non-sellable', 'Podium display métal doré — gamme Skincare (50x35cm)', 'display_skincare.jpg'),
    (29, 'Back Wall Velvet F&B', 'Display', 'Non-sellable', 'Panneau mural marque 120x80cm — éclairage LED intégré', 'backwall.jpg'),
    (30, 'Glorifier Oud Mystique', 'Display', 'Non-sellable', 'Glorifier premium pour mise en avant Oud Mystique', 'glorifier_oud.jpg'),
    (31, 'Kit Touche à Essayer (x100)', 'Fragrance', 'Non-sellable', 'Lot de 100 touches à parfum Velvet F&B', 'blotters.jpg'),
]

for row in data:
    ws.append(row)

for col in ws.columns:
    max_len = max(len(str(c.value or '')) for c in col)
    ws.column_dimensions[col[0].column_letter].width = min(max_len + 2, 50)

wb.save('/Users/bkane/Documents/Demos/CG Sales Copilot/product_catalog.xlsx')
print('Exported to product_catalog.xlsx')
