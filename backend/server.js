const express = require('express');
const cors = require('cors');
const snowflake = require('snowflake-sdk');
const pptxgen = require('pptxgenjs');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 8080;

const SF_CONFIG = {
  account: process.env.SNOWFLAKE_ACCOUNT || 'SFSEEUROPE-BKANE_AWS3',
  username: process.env.SNOWFLAKE_USER || 'BKANE',
  password: process.env.SNOWFLAKE_PASSWORD || undefined,
  authenticator: process.env.SNOWFLAKE_AUTHENTICATOR || undefined,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH',
  database: 'VELVET_FB_DEMO',
  schema: 'WHOLESALE_APP',
  role: process.env.SNOWFLAKE_ROLE || 'ACCOUNTADMIN'
};

const AZURE_STT_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_STT_REGION = process.env.AZURE_SPEECH_REGION || 'westeurope';

let sfConnection = null;

function getConnection() {
  return new Promise((resolve, reject) => {
    if (sfConnection && sfConnection.isUp()) {
      return resolve(sfConnection);
    }
    const conn = snowflake.createConnection(SF_CONFIG);
    conn.connect((err, conn) => {
      if (err) return reject(err);
      sfConnection = conn;
      resolve(conn);
    });
  });
}

function executeQuery(sql, binds = []) {
  return new Promise(async (resolve, reject) => {
    const conn = await getConnection();
    conn.execute({
      sqlText: sql,
      binds,
      complete: (err, stmt, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    });
  });
}

// ============================================================
// PRODUCTS
// ============================================================
app.get('/api/products', async (req, res) => {
  try {
    const rows = await executeQuery('SELECT * FROM PRODUCTS ORDER BY CATEGORY, PRODUCT_NAME');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// STORES
// ============================================================
app.get('/api/stores', async (req, res) => {
  try {
    const rows = await executeQuery('SELECT * FROM STORES ORDER BY RETAILER_NAME, REGION');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/stores/:id', async (req, res) => {
  try {
    const rows = await executeQuery('SELECT * FROM STORES WHERE STORE_ID = ?', [req.params.id]);
    res.json(rows[0] || {});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// STORE PERFORMANCE / KPIs
// ============================================================
app.get('/api/stores/:id/performance', async (req, res) => {
  try {
    const sql = `
      SELECT sp.*, p.PRODUCT_NAME, p.CATEGORY
      FROM STORE_PERFORMANCE sp
      JOIN PRODUCTS p ON sp.PRODUCT_ID = p.PRODUCT_ID
      WHERE sp.STORE_ID = ?
      ORDER BY sp.DATE DESC
      LIMIT 500
    `;
    const rows = await executeQuery(sql, [req.params.id]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/stores/:id/kpis', async (req, res) => {
  try {
    const sql = `
      SELECT 
        ROUND(AVG(SELL_IN_UNITS), 1) AS AVG_SELL_IN,
        ROUND(AVG(SELL_OUT_UNITS), 1) AS AVG_SELL_OUT,
        ROUND(AVG(SHELF_SHARE_PERCENT), 1) AS AVG_SHELF_SHARE,
        ROUND(SUM(CASE WHEN NUMERICAL_DISTRIBUTION_STATUS THEN 1 ELSE 0 END)::FLOAT / COUNT(*) * 100, 1) AS DISTRIBUTION_RATE,
        ROUND(AVG(PROMO_EFFICIENCY_SCORE), 1) AS AVG_PROMO_EFFICIENCY,
        ROUND(AVG(MARKET_SHARE_PERCENT), 1) AS AVG_MARKET_SHARE,
        COUNT(*) AS DATA_POINTS
      FROM STORE_PERFORMANCE
      WHERE STORE_ID = ?
        AND DATE >= DATEADD('day', -30, CURRENT_DATE())
    `;
    const rows = await executeQuery(sql, [req.params.id]);
    res.json(rows[0] || {});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// VISITS
// ============================================================
app.get('/api/visits', async (req, res) => {
  try {
    const { rep_id } = req.query;
    let sql = `
      SELECT v.*, s.RETAILER_NAME, s.STORE_NAME, s.STORE_TYPE, s.ADDRESS, s.REGION, s.STORE_MANAGER_NAME
      FROM VISITS v
      JOIN STORES s ON v.STORE_ID = s.STORE_ID
    `;
    const binds = [];
    if (rep_id) {
      sql += ' WHERE v.REP_ID = ?';
      binds.push(rep_id);
    }
    sql += ' ORDER BY v.SCHEDULED_DATETIME';
    const rows = await executeQuery(sql, binds);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/visits/urgent', async (req, res) => {
  try {
    const { rep_id, store_id, notes } = req.body;
    const sql = `
      INSERT INTO VISITS (REP_ID, STORE_ID, SCHEDULED_DATETIME, STATUS, AI_RECOMMENDATION_NOTES)
      VALUES (?, ?, CURRENT_TIMESTAMP(), 'Urgent', ?)
    `;
    await executeQuery(sql, [rep_id, store_id, notes || 'Urgent waypoint added by manager']);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/visits', async (req, res) => {
  try {
    const { rep_id, store_id, scheduled_datetime, status, notes } = req.body;
    const sql = `
      INSERT INTO VISITS (REP_ID, STORE_ID, SCHEDULED_DATETIME, STATUS, AI_RECOMMENDATION_NOTES)
      VALUES (?, ?, ?, ?, ?)
    `;
    await executeQuery(sql, [
      rep_id || 1,
      store_id,
      scheduled_datetime,
      status || 'Planned',
      notes || ''
    ]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// FIELD SALES
// ============================================================
app.get('/api/reps', async (req, res) => {
  try {
    const rows = await executeQuery('SELECT * FROM FIELD_SALES ORDER BY REP_ID');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// AI AGENT - Cortex Complete + Azure Voice
// ============================================================
app.post('/api/agent/interact', async (req, res) => {
  try {
    const { message, store_id, mode } = req.body;
    
    let contextData = '';
    if (store_id) {
      const kpis = await executeQuery(`
        SELECT 
          s.RETAILER_NAME, s.ADDRESS,
          ROUND(AVG(sp.SELL_IN_UNITS), 1) AS AVG_SELL_IN,
          ROUND(AVG(sp.SELL_OUT_UNITS), 1) AS AVG_SELL_OUT,
          ROUND(AVG(sp.SHELF_SHARE_PERCENT), 1) AS AVG_SHELF_SHARE,
          ROUND(AVG(sp.MARKET_SHARE_PERCENT), 1) AS AVG_MARKET_SHARE,
          ROUND(AVG(sp.PROMO_EFFICIENCY_SCORE), 1) AS AVG_PROMO_SCORE
        FROM STORE_PERFORMANCE sp
        JOIN STORES s ON sp.STORE_ID = s.STORE_ID
        WHERE sp.STORE_ID = ?
          AND sp.DATE >= DATEADD('day', -30, CURRENT_DATE())
        GROUP BY s.RETAILER_NAME, s.ADDRESS
      `, [store_id]);
      contextData = JSON.stringify(kpis[0] || {});
    }

    const systemPrompt = `You are the Velvet F&B AI Retail Coach — an elite sales advisor for premium fragrance and beauty wholesale. 
You provide data-driven negotiation strategies, promotional recommendations, and retail execution guidance.
Always reference specific KPIs and provide actionable recommendations.
Be concise, confident, and strategic. Speak like a luxury brand consultant.
${contextData ? `\nCurrent store context: ${contextData}` : ''}`;

    const cortexSql = `
      SELECT SNOWFLAKE.CORTEX.COMPLETE(
        'mistral-large',
        [
          {'role': 'system', 'content': '${systemPrompt.replace(/'/g, "''")}'},
          {'role': 'user', 'content': '${message.replace(/'/g, "''")}'}
        ],
        {'temperature': 0.7, 'max_tokens': 800}
      ) AS RESPONSE
    `;

    const result = await executeQuery(cortexSql);
    const response = JSON.parse(result[0].RESPONSE);
    const aiText = response.choices[0].messages || response.choices[0].message?.content || '';

    res.json({ response: aiText, context: contextData ? JSON.parse(contextData) : null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/agent/speech-to-text', async (req, res) => {
  try {
    const audioBuffer = Buffer.from(req.body.audio, 'base64');
    const sttUrl = `https://${AZURE_STT_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`;
    
    const response = await axios.post(sttUrl, audioBuffer, {
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_STT_KEY,
        'Content-Type': 'audio/wav'
      }
    });
    
    res.json({ text: response.data.DisplayText || '' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/agent/text-to-speech', async (req, res) => {
  try {
    const { text } = req.body;
    const ttsUrl = `https://${AZURE_STT_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
    
    const ssml = `<speak version='1.0' xml:lang='en-US'>
      <voice name='en-US-JennyNeural'>${text}</voice>
    </speak>`;
    
    const response = await axios.post(ttsUrl, ssml, {
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_STT_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
      },
      responseType: 'arraybuffer'
    });
    
    res.json({ audio: Buffer.from(response.data).toString('base64') });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// PPT GENERATION
// ============================================================
app.post('/api/reports/generate-ppt', async (req, res) => {
  try {
    const performanceSql = `
      SELECT 
        p.CATEGORY,
        ROUND(AVG(sp.SELL_OUT_UNITS), 1) AS AVG_SELL_OUT,
        ROUND(AVG(sp.MARKET_SHARE_PERCENT), 1) AS AVG_MARKET_SHARE,
        ROUND(AVG(sp.SHELF_SHARE_PERCENT), 1) AS AVG_SHELF_SHARE
      FROM STORE_PERFORMANCE sp
      JOIN PRODUCTS p ON sp.PRODUCT_ID = p.PRODUCT_ID
      WHERE sp.DATE >= DATEADD('day', -30, CURRENT_DATE())
      GROUP BY p.CATEGORY
      ORDER BY AVG_SELL_OUT DESC
    `;
    const perfData = await executeQuery(performanceSql);

    const topStoresSql = `
      SELECT s.RETAILER_NAME, s.ADDRESS,
        ROUND(AVG(sp.SELL_OUT_UNITS), 1) AS AVG_SELL_OUT,
        ROUND(AVG(sp.MARKET_SHARE_PERCENT), 1) AS MARKET_SHARE
      FROM STORE_PERFORMANCE sp
      JOIN STORES s ON sp.STORE_ID = s.STORE_ID
      WHERE sp.DATE >= DATEADD('day', -30, CURRENT_DATE())
      GROUP BY s.RETAILER_NAME, s.ADDRESS
      ORDER BY AVG_SELL_OUT DESC
      LIMIT 10
    `;
    const topStores = await executeQuery(topStoresSql);

    const cortexSql = `
      SELECT SNOWFLAKE.CORTEX.COMPLETE(
        'mistral-large',
        [
          {'role': 'system', 'content': 'You are a luxury beauty brand analyst. Generate 3 concise executive talking points based on the performance data. Be strategic and data-driven.'},
          {'role': 'user', 'content': 'Performance by category: ${JSON.stringify(perfData).replace(/'/g, "''")}. Top stores: ${JSON.stringify(topStores).replace(/'/g, "''")}'}
        ],
        {'temperature': 0.5, 'max_tokens': 500}
      ) AS RESPONSE
    `;
    const aiResult = await executeQuery(cortexSql);
    const aiResponse = JSON.parse(aiResult[0].RESPONSE);
    const talkingPoints = aiResponse.choices[0].message?.content || '';

    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_WIDE';

    const slideMaster = {
      background: { color: '1a1a2e' },
    };

    let slide = pptx.addSlide();
    slide.background = { color: '1a1a2e' };
    slide.addText('Velvet F&B', { x: 0.5, y: 1.5, w: '90%', fontSize: 44, color: 'e6c87a', fontFace: 'Georgia', bold: true });
    slide.addText('Leadership Performance Review', { x: 0.5, y: 2.5, w: '90%', fontSize: 24, color: 'ffffff', fontFace: 'Arial' });
    slide.addText(new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' }), { x: 0.5, y: 3.5, w: '90%', fontSize: 16, color: 'aaaaaa' });

    slide = pptx.addSlide();
    slide.background = { color: 'ffffff' };
    slide.addText('Category Performance (Last 30 Days)', { x: 0.5, y: 0.3, w: '90%', fontSize: 22, color: '1a1a2e', bold: true });
    const tableRows = [
      [{ text: 'Category', options: { bold: true, fill: '1a1a2e', color: 'ffffff' } },
       { text: 'Avg Sell-Out', options: { bold: true, fill: '1a1a2e', color: 'ffffff' } },
       { text: 'Market Share %', options: { bold: true, fill: '1a1a2e', color: 'ffffff' } },
       { text: 'Shelf Share %', options: { bold: true, fill: '1a1a2e', color: 'ffffff' } }],
      ...perfData.map(r => [r.CATEGORY, String(r.AVG_SELL_OUT), String(r.AVG_MARKET_SHARE), String(r.AVG_SHELF_SHARE)])
    ];
    slide.addTable(tableRows, { x: 0.5, y: 1.2, w: 9, fontSize: 14, border: { color: 'cccccc' } });

    slide = pptx.addSlide();
    slide.background = { color: 'ffffff' };
    slide.addText('Top 10 Performing Stores', { x: 0.5, y: 0.3, w: '90%', fontSize: 22, color: '1a1a2e', bold: true });
    const storeRows = [
      [{ text: 'Retailer', options: { bold: true, fill: '1a1a2e', color: 'ffffff' } },
       { text: 'Location', options: { bold: true, fill: '1a1a2e', color: 'ffffff' } },
       { text: 'Sell-Out', options: { bold: true, fill: '1a1a2e', color: 'ffffff' } },
       { text: 'Mkt Share %', options: { bold: true, fill: '1a1a2e', color: 'ffffff' } }],
      ...topStores.map(r => [r.RETAILER_NAME, r.ADDRESS.substring(0, 40), String(r.AVG_SELL_OUT), String(r.MARKET_SHARE)])
    ];
    slide.addTable(storeRows, { x: 0.5, y: 1.2, w: 12, fontSize: 11, border: { color: 'cccccc' } });

    slide = pptx.addSlide();
    slide.background = { color: '1a1a2e' };
    slide.addText('AI-Generated Executive Talking Points', { x: 0.5, y: 0.3, w: '90%', fontSize: 22, color: 'e6c87a', bold: true });
    slide.addText(talkingPoints, { x: 0.5, y: 1.2, w: '90%', h: 4, fontSize: 14, color: 'ffffff', valign: 'top', wrap: true });

    const buffer = await pptx.write({ outputType: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', 'attachment; filename=Velvet_FB_Review.pptx');
    res.send(buffer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// PROMO ROI SIMULATOR
// ============================================================
app.post('/api/analytics/promo-simulator', async (req, res) => {
  try {
    const { promotion_description, category } = req.body;
    
    const historicalSql = `
      SELECT 
        ROUND(AVG(PROMO_EFFICIENCY_SCORE), 2) AS AVG_EFFICIENCY,
        ROUND(AVG(SELL_OUT_UNITS), 1) AS BASELINE_SELL_OUT,
        ROUND(STDDEV(SELL_OUT_UNITS), 1) AS SELL_OUT_STDDEV
      FROM STORE_PERFORMANCE sp
      JOIN PRODUCTS p ON sp.PRODUCT_ID = p.PRODUCT_ID
      WHERE p.CATEGORY = '${category || 'Fragrance'}'
        AND sp.DATE >= DATEADD('day', -90, CURRENT_DATE())
    `;
    const historical = await executeQuery(historicalSql);

    const cortexSql = `
      SELECT SNOWFLAKE.CORTEX.COMPLETE(
        'mistral-large',
        [
          {'role': 'system', 'content': 'You are a promotional analytics expert for premium beauty brands. Based on historical performance data, predict the volume lift for the proposed promotion. Respond with JSON: {"predicted_lift_percent": number, "confidence": "high"|"medium"|"low", "reasoning": "string", "recommended_duration_weeks": number}'},
          {'role': 'user', 'content': 'Historical baseline: ${JSON.stringify(historical[0]).replace(/'/g, "''")}. Proposed promotion: ${promotion_description.replace(/'/g, "''")} for category: ${category || "Fragrance"}'}
        ],
        {'temperature': 0.3, 'max_tokens': 300}
      ) AS RESPONSE
    `;
    const result = await executeQuery(cortexSql);
    const aiResponse = JSON.parse(result[0].RESPONSE);
    const prediction = aiResponse.choices[0].message?.content || '{}';

    res.json({ 
      prediction: JSON.parse(prediction),
      historical_context: historical[0]
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// CROSS-RETAILER ANALYTICS
// ============================================================
app.get('/api/analytics/cross-retailer', async (req, res) => {
  try {
    const sql = `
      SELECT 
        s.RETAILER_NAME,
        p.CATEGORY,
        ROUND(AVG(sp.SELL_OUT_UNITS), 1) AS AVG_SELL_OUT,
        ROUND(AVG(sp.MARKET_SHARE_PERCENT), 1) AS AVG_MARKET_SHARE,
        ROUND(AVG(sp.SHELF_SHARE_PERCENT), 1) AS AVG_SHELF_SHARE,
        ROUND(AVG(sp.PROMO_EFFICIENCY_SCORE), 1) AS AVG_PROMO_SCORE
      FROM STORE_PERFORMANCE sp
      JOIN STORES s ON sp.STORE_ID = s.STORE_ID
      JOIN PRODUCTS p ON sp.PRODUCT_ID = p.PRODUCT_ID
      WHERE sp.DATE >= DATEADD('day', -30, CURRENT_DATE())
      GROUP BY s.RETAILER_NAME, p.CATEGORY
      ORDER BY s.RETAILER_NAME, p.CATEGORY
    `;
    const rows = await executeQuery(sql);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// NPD TRACKER
// ============================================================
app.get('/api/analytics/npd-tracker', async (req, res) => {
  try {
    const sql = `
      SELECT 
        p.PRODUCT_NAME,
        sp.DATE,
        ROUND(SUM(CASE WHEN sp.NUMERICAL_DISTRIBUTION_STATUS THEN 1 ELSE 0 END)::FLOAT / COUNT(*) * 100, 1) AS DISTRIBUTION_PERCENT
      FROM STORE_PERFORMANCE sp
      JOIN PRODUCTS p ON sp.PRODUCT_ID = p.PRODUCT_ID
      WHERE p.LAUNCH_DATE >= DATEADD('day', -60, CURRENT_DATE())
      GROUP BY p.PRODUCT_NAME, sp.DATE
      ORDER BY sp.DATE
    `;
    const rows = await executeQuery(sql);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// RETAIL EXECUTION
// ============================================================
app.post('/api/visits/:id/audit', async (req, res) => {
  try {
    const { compliance_score } = req.body;
    await executeQuery(
      'UPDATE VISITS SET AUDIT_PLANOGRAM_COMPLIANCE_SCORE = ?, STATUS = ? WHERE VISIT_ID = ?',
      [compliance_score, 'Completed', req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    res.json({ success: true, message: 'Order submitted (mock)' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Serve static frontend in production
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Velvet F&B API running on port ${PORT}`);
});
