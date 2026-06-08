const express = require('express');
const cors = require('cors');
const snowflake = require('snowflake-sdk');
const pptxgen = require('pptxgenjs');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

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

const SF_ACCOUNT_URL = `https://${(SF_CONFIG.account || '').replace(/-/g, '-')}.snowflakecomputing.com`;

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
    const { rep_id } = req.query;
    let sql = 'SELECT * FROM STORES';
    const binds = [];
    if (rep_id) {
      sql += ' WHERE REP_ID = ?';
      binds.push(rep_id);
    }
    sql += ' ORDER BY STORE_NAME';
    const rows = await executeQuery(sql, binds);
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
      SELECT v.*, s.RETAILER_NAME, s.STORE_NAME, s.STORE_TYPE, s.ADDRESS, s.REGION, s.STORE_MANAGER_NAME, s.LOCATION_LAT, s.LOCATION_LONG
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
    const raw = result[0].RESPONSE;
    const response = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const aiText = response.choices?.[0]?.messages || response.choices?.[0]?.message?.content || '';

    res.json({ response: aiText, context: contextData ? JSON.parse(contextData) : null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// CORTEX AGENT CHAT (powered by Cortex Agents)
// ============================================================
app.post('/api/agent/chat', async (req, res) => {
  try {
    const { message, store_id, history } = req.body;
    const esc = (s) => (s || '').replace(/'/g, "''").replace(/\\/g, '\\\\');

    let storeContext = null;
    let dataContext = '';
    let nearbyContext = '';

    if (store_id) {
      const storeRows = await executeQuery('SELECT STORE_NAME, RETAILER_NAME FROM STORES WHERE STORE_ID = ?', [store_id]);
      const kpis = await executeQuery(`
        SELECT ROUND(AVG(sp.SELL_IN_UNITS),1) AS AVG_SELL_IN, ROUND(AVG(sp.SELL_OUT_UNITS),1) AS AVG_SELL_OUT,
          ROUND(AVG(sp.SHELF_SHARE_PERCENT),1) AS SHELF_SHARE, ROUND(AVG(sp.MARKET_SHARE_PERCENT),1) AS MARKET_SHARE
        FROM STORE_PERFORMANCE sp WHERE sp.STORE_ID = ? AND sp.DATE >= DATEADD('day', -14, CURRENT_DATE())
      `, [store_id]);
      const lastAudit = await executeQuery(`
        SELECT OVERALL_SCORE, PLANOGRAM_COMPLIANCE_SCORE, STOCK_AVAILABILITY_SCORE, NOTES, AUDIT_DATE
        FROM STORE_AUDITS WHERE STORE_ID = ? ORDER BY AUDIT_DATE DESC LIMIT 1
      `, [store_id]);
      const openCases = await executeQuery(`SELECT CASE_TYPE, SEVERITY, SUBJECT FROM STORE_CASES WHERE STORE_ID = ? AND STATUS = 'Open'`, [store_id]);
      const lastVisit = await executeQuery(`
        SELECT STATUS, SCHEDULED_DATETIME, AI_RECOMMENDATION_NOTES FROM VISITS
        WHERE STORE_ID = ? AND STATUS = 'Completed' ORDER BY SCHEDULED_DATETIME DESC LIMIT 1
      `, [store_id]);
      const nextVisit = await executeQuery(`
        SELECT SCHEDULED_DATETIME, AI_RECOMMENDATION_NOTES FROM VISITS
        WHERE STORE_ID = ? AND STATUS = 'Planned' ORDER BY SCHEDULED_DATETIME ASC LIMIT 1
      `, [store_id]);

      storeContext = { kpis: kpis[0], last_audit: lastAudit[0], open_cases: openCases, last_visit: lastVisit[0], next_visit: nextVisit[0] };
      const sn = storeRows[0]?.STORE_NAME || 'Unknown';
      dataContext = `\n\nStore: ${sn} (STORE_ID=${store_id})
KPIs (14d avg): Sell-In ${kpis[0]?.AVG_SELL_IN||'?'}u, Sell-Out ${kpis[0]?.AVG_SELL_OUT||'?'}u, Shelf ${kpis[0]?.SHELF_SHARE||'?'}%, Market ${kpis[0]?.MARKET_SHARE||'?'}%
Last Audit: ${lastAudit[0] ? `Overall ${lastAudit[0].OVERALL_SCORE}/10, Plano ${lastAudit[0].PLANOGRAM_COMPLIANCE_SCORE}/10, Stock ${lastAudit[0].STOCK_AVAILABILITY_SCORE}/10 (${lastAudit[0].AUDIT_DATE}). ${lastAudit[0].NOTES||''}` : 'None'}
Open Cases (${openCases.length}): ${openCases.length>0 ? openCases.map(c=>`[${c.SEVERITY}] ${c.SUBJECT}`).join('; ') : 'None'}
Last Visit: ${lastVisit[0] ? `${lastVisit[0].STATUS} ${lastVisit[0].SCHEDULED_DATETIME}. ${lastVisit[0].AI_RECOMMENDATION_NOTES||''}` : 'None'}
Next Planned: ${nextVisit[0] ? `${nextVisit[0].SCHEDULED_DATETIME}. ${nextVisit[0].AI_RECOMMENDATION_NOTES||''}` : 'None'}`;
    }

    const isNearbyQuery = /nearby|near\s*by|close|around|time|free|available|add.*stop|another.*store|quick.*visit/i.test(message);
    if (isNearbyQuery) {
      const nearbyData = await executeQuery(`
        WITH ref_store AS (SELECT LOCATION_LAT, LOCATION_LONG FROM STORES WHERE STORE_ID = ?),
        nearby AS (
          SELECT s.STORE_ID, s.STORE_NAME, s.RETAILER_NAME, s.STORE_MANAGER_NAME,
            ROUND(HAVERSINE(r.LOCATION_LAT, r.LOCATION_LONG, s.LOCATION_LAT, s.LOCATION_LONG), 2) AS DIST_KM
          FROM STORES s, ref_store r
          WHERE s.REP_ID = 1 AND s.STORE_ID NOT IN (?, 65) AND HAVERSINE(r.LOCATION_LAT, r.LOCATION_LONG, s.LOCATION_LAT, s.LOCATION_LONG) < 2
          ORDER BY DIST_KM LIMIT 10
        )
        SELECT n.*, 
          ROUND((AVG(CASE WHEN sp.DATE >= DATEADD('day',-30,CURRENT_DATE()) THEN sp.SELL_OUT_UNITS END) /
                 NULLIF(AVG(CASE WHEN sp.DATE < DATEADD('day',-30,CURRENT_DATE()) AND sp.DATE >= DATEADD('day',-60,CURRENT_DATE()) THEN sp.SELL_OUT_UNITS END),0) -1)*100, 1) AS SELL_OUT_CHG,
          ROUND(AVG(CASE WHEN sp.DATE >= DATEADD('day',-30,CURRENT_DATE()) THEN sp.MARKET_SHARE_PERCENT END), 1) AS MKT_SHARE_NOW,
          ROUND(AVG(CASE WHEN sp.DATE < DATEADD('day',-30,CURRENT_DATE()) AND sp.DATE >= DATEADD('day',-60,CURRENT_DATE()) THEN sp.MARKET_SHARE_PERCENT END), 1) AS MKT_SHARE_BEFORE
        FROM nearby n
        JOIN STORE_PERFORMANCE sp ON n.STORE_ID = sp.STORE_ID AND sp.DATE >= DATEADD('day',-60,CURRENT_DATE())
        GROUP BY n.STORE_ID, n.STORE_NAME, n.RETAILER_NAME, n.STORE_MANAGER_NAME, n.DIST_KM
        HAVING SELL_OUT_CHG < -3
        ORDER BY SELL_OUT_CHG ASC
      `, [store_id || 65, store_id || 65]);

      if (nearbyData.length > 0) {
        const top = nearbyData[0];
        nearbyContext = `\n\nNEARBY STORES WITH DECLINING PERFORMANCE:`;
        nearbyData.forEach(s => {
          nearbyContext += `\n- ${s.STORE_NAME} (${s.RETAILER_NAME}): ${s.DIST_KM}km away. Sell-out trend: ${s.SELL_OUT_CHG}%. Market share: ${s.MKT_SHARE_NOW}% (was ${s.MKT_SHARE_BEFORE}%, -${(s.MKT_SHARE_BEFORE - s.MKT_SHARE_NOW).toFixed(1)}pts). Store manager: ${s.STORE_MANAGER_NAME}. STORE_ID=${s.STORE_ID}`;
        });
        nearbyContext += `\n\nSTRONGLY RECOMMEND: ${top.STORE_NAME} — it has the biggest decline (${top.SELL_OUT_CHG}% sell-out) and lost ${(top.MKT_SHARE_BEFORE - top.MKT_SHARE_NOW).toFixed(1)}pts market share. It is only ${top.DIST_KM}km away. Store manager is ${top.STORE_MANAGER_NAME}. Include [ROUTE_RECOMMENDATION] ${top.STORE_NAME} | ${top.STORE_ID} | High | ... in your response.`;
      }
    }

    const systemPrompt = `You are the Velvet F&B Field Sales AI Assistant for a luxury cosmetics brand in premium retailers (Sephora, Marionnaud, Nocibe).
You help field sales rep Eric Sarr (REP_ID=1, Paris Ouest) with:
- Preparing visits (KPIs + audit scores + cases + notes)
- Summarizing last visits and recommending priorities
- Identifying nearby POS that need attention (declining sales, market share loss)
- Next best actions for a store
- Creating visit proposals
- Sending email notifications to store managers (announce visits)

RULES:
- Be concise and actionable (under 200 words)
- Use bullet points for findings
- End with 1-3 action items prefixed with arrow symbol
- When suggesting a visit creation, add on its own line: [VISIT_PROPOSAL] store_name | date | objectives | reason
- When recommending a nearby store to add to route, add on its own line: [ROUTE_RECOMMENDATION] store_name | store_id_number | priority | reason
- When the user confirms they want to send an email/notify the store manager, add: [EMAIL_MANAGER] store_name | manager_name | visit_date | message_summary
- Reference specific data and percentages when available
- Mention store manager names when relevant
- For nearby store recommendations, explain WHY (declining metrics) and suggest adding to route`;

    const userContent = message + dataContext + nearbyContext;

    let msgArray = `[{'role':'system','content':'${esc(systemPrompt)}'}`;
    if (history && history.length > 0) {
      const validHistory = history.slice(-4).filter(h => h.role === 'user' || h.role === 'assistant');
      let lastRole = 'system';
      validHistory.forEach(h => {
        const role = h.role === 'user' ? 'user' : 'assistant';
        if ((lastRole === 'system' || lastRole === 'assistant') && role === 'user' ||
            lastRole === 'user' && role === 'assistant') {
          msgArray += `,{'role':'${role}','content':'${esc(h.content).substring(0, 500)}'}`;
          lastRole = role;
        }
      });
    }
    msgArray += `,{'role':'user','content':'${esc(userContent)}'}]`;

    const cortexSql = `SELECT SNOWFLAKE.CORTEX.COMPLETE('mistral-large', ${msgArray}, {'temperature': 0.5, 'max_tokens': 1200}) AS RESPONSE`;

    const result = await executeQuery(cortexSql);
    const raw = result[0].RESPONSE;
    const response = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const aiText = response.choices?.[0]?.messages || response.choices?.[0]?.message?.content || '';

    let visitProposal = null;
    const vpMatch = aiText.match(/\[VISIT_PROPOSAL\]\s*(.+)/);
    if (vpMatch) {
      const parts = vpMatch[1].split('|').map(s => s.trim());
      visitProposal = { store_name: parts[0], date: parts[1], objectives: parts[2], reason: parts[3] };
    }

    let routeRecommendation = null;
    const rrMatch = aiText.match(/\[ROUTE_RECOMMENDATION\]\s*(.+)/);
    if (rrMatch) {
      const parts = rrMatch[1].split('|').map(s => s.trim());
      routeRecommendation = { store_name: parts[0], store_id: parseInt(parts[1]) || null, priority: parts[2], reason: parts[3] };
    }

    let emailAction = null;
    const emMatch = aiText.match(/\[EMAIL_MANAGER\]\s*(.+)/);
    if (emMatch) {
      const parts = emMatch[1].split('|').map(s => s.trim());
      emailAction = { store_name: parts[0], manager_name: parts[1], visit_date: parts[2], message: parts[3] };
    }

    const cleanText = aiText
      .replace(/\[VISIT_PROPOSAL\].+/g, '')
      .replace(/\[ROUTE_RECOMMENDATION\].+/g, '')
      .replace(/\[EMAIL_MANAGER\].+/g, '')
      .trim();

    res.json({ response: cleanText, store_context: storeContext, visit_proposal: visitProposal, route_recommendation: routeRecommendation, email_action: emailAction });
  } catch (e) {
    console.error('Agent chat error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Mock email to store manager
app.post('/api/agent/send-email', async (req, res) => {
  try {
    const { store_name, manager_name, visit_date, message_body } = req.body;
    console.log(`[MOCK EMAIL] To: ${manager_name} (${store_name})`);
    console.log(`  Subject: Visit planned - ${visit_date}`);
    console.log(`  Body: ${message_body}`);
    res.json({
      success: true,
      email: {
        to: `${(manager_name || 'Manager').toLowerCase().replace(/ /g, '.')}@${(store_name || 'store').toLowerCase().replace(/ /g, '')}.com`,
        subject: `Velvet F&B - Visit planned for ${visit_date || 'soon'}`,
        body: message_body || `Bonjour ${manager_name}, I would like to schedule a visit to ${store_name} on ${visit_date}. Please let me know if this works for you. Best regards, Eric Sarr - Velvet F&B`,
        sent_at: new Date().toISOString(),
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/agent/speech-to-text', async (req, res) => {
  try {
    const audioBuffer = Buffer.from(req.body.audio, 'base64');
    const sttUrl = `https://${AZURE_STT_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`;
    
    const response = await axios.post(sttUrl, audioBuffer, {
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_STT_KEY,
        'Content-Type': 'audio/webm;codecs=opus',
        'Accept': 'application/json'
      }
    });
    
    const text = response.data.DisplayText || response.data.NBest?.[0]?.Display || '';
    res.json({ text });
  } catch (e) {
    console.error('STT Error:', e.response?.status, e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data?.Message || e.message });
  }
});

app.post('/api/agent/text-to-speech', async (req, res) => {
  try {
    const { text } = req.body;
    const ttsUrl = `https://${AZURE_STT_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
    
    const ssml = `<speak version='1.0' xml:lang='en-US'>
      <voice name='en-US-GuyNeural'>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</voice>
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
// PRODUCT CATALOG
// ============================================================
app.get('/api/catalog', async (req, res) => {
  try {
    const { type } = req.query;
    let sql = 'SELECT * FROM PRODUCT_CATALOG WHERE IS_ACTIVE = TRUE';
    const binds = [];
    if (type) {
      sql += ' AND PRODUCT_TYPE = ?';
      binds.push(type);
    }
    sql += ' ORDER BY PRODUCT_TYPE, CATEGORY, PRODUCT_NAME';
    const rows = await executeQuery(sql, binds);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// STORE ASSORTMENT
// ============================================================
app.get('/api/stores/:id/assortment', async (req, res) => {
  try {
    const sql = `SELECT pc.*, sa.LISTED_DATE FROM STORE_ASSORTMENT sa JOIN PRODUCT_CATALOG pc ON sa.CATALOG_ID = pc.CATALOG_ID WHERE sa.STORE_ID = ? AND sa.IS_LISTED = TRUE ORDER BY pc.CATEGORY, pc.PRODUCT_NAME`;
    const rows = await executeQuery(sql, [req.params.id]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// PROMOTIONS
// ============================================================
app.get('/api/promotions', async (req, res) => {
  try {
    const rows = await executeQuery('SELECT * FROM PROMOTIONS WHERE IS_ACTIVE = TRUE AND END_DATE >= CURRENT_DATE() ORDER BY END_DATE');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// QUOTAS
// ============================================================
app.get('/api/rep/:repId/quotas', async (req, res) => {
  try {
    const month = new Date().getMonth();
    const quarter = 'Q' + (Math.floor(month / 3) + 1);
    const year = new Date().getFullYear();
    const rows = await executeQuery(
      'SELECT * FROM QUOTAS WHERE REP_ID = ? AND QUARTER = ? AND YEAR = ? ORDER BY PRODUCT_NAME',
      [req.params.repId, quarter, year]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// LAST VISIT MERCHANDISING DATA
// ============================================================
app.get('/api/stores/:id/last-merchandising', async (req, res) => {
  try {
    const sql = `SELECT vm.* FROM VISIT_MERCHANDISING vm
      JOIN VISITS v ON vm.VISIT_ID = v.VISIT_ID
      WHERE vm.STORE_ID = ? AND v.STATUS = 'Completed'
      ORDER BY vm.CREATED_AT DESC`;
    const rows = await executeQuery(sql, [req.params.id]);
    const seen = new Set();
    const latest = [];
    for (const r of rows) {
      if (!seen.has(r.CATALOG_ID)) {
        seen.add(r.CATALOG_ID);
        latest.push(r);
      }
    }
    res.json(latest);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// PLANOGRAMS
// ============================================================
app.get('/api/stores/:id/planogram', async (req, res) => {
  try {
    const store = await executeQuery('SELECT RETAILER_NAME, STORE_TYPE FROM STORES WHERE STORE_ID = ?', [req.params.id]);
    if (!store.length) return res.status(404).json({ error: 'Store not found' });
    const { RETAILER_NAME, STORE_TYPE } = store[0];
    const sql = `SELECT * FROM PLANOGRAMS WHERE RETAILER_NAME = ? AND STORE_TYPE = ? ORDER BY SHELF_NUMBER, SHELF_POSITION`;
    const rows = await executeQuery(sql, [RETAILER_NAME, STORE_TYPE]);
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

app.post('/api/visits/:id/merchandising', async (req, res) => {
  try {
    const { store_id, items } = req.body;
    for (const item of items) {
      await executeQuery(
        `INSERT INTO VISIT_MERCHANDISING (VISIT_ID, STORE_ID, CATALOG_ID, SHELF_POSITION, FACING_COUNT, IS_OUT_OF_STOCK) VALUES (?, ?, ?, ?, ?, ?)`,
        [req.params.id, store_id, item.catalog_id, item.shelf_position, item.facing_count, item.is_out_of_stock || false]
      );
    }
    res.json({ success: true, count: items.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/visits/:id/photos', async (req, res) => {
  try {
    const { store_id, rep_id, photo_type, notes, file_name } = req.body;
    const filePath = `visits/${req.params.id}/${file_name}`;
    await executeQuery(
      `INSERT INTO VISIT_PHOTOS (VISIT_ID, STORE_ID, REP_ID, PHOTO_TYPE, FILE_PATH, NOTES) VALUES (?, ?, ?, ?, ?, ?)`,
      [req.params.id, store_id, rep_id || 1, photo_type, filePath, notes || '']
    );
    res.json({ success: true, file_path: filePath });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/visits/:id/complete', async (req, res) => {
  try {
    const { compliance_score, notes, store_id, rep_id, merch_summary } = req.body;
    let visitId = req.params.id;

    if (visitId === '0' && store_id) {
      const today = new Date().toISOString().split('T')[0];
      const rows = await executeQuery(
        `SELECT VISIT_ID FROM VISITS WHERE STORE_ID = ? AND STATUS = 'Planned' AND SCHEDULED_DATETIME LIKE ? ORDER BY SCHEDULED_DATETIME LIMIT 1`,
        [store_id, `${today}%`]
      );
      if (rows.length > 0) visitId = rows[0].VISIT_ID;
    }

    if (visitId && visitId !== '0') {
      await executeQuery(
        'UPDATE VISITS SET STATUS = ?, AUDIT_PLANOGRAM_COMPLIANCE_SCORE = ?, AI_RECOMMENDATION_NOTES = COALESCE(AI_RECOMMENDATION_NOTES, \'\') || ? WHERE VISIT_ID = ?',
        ['Completed', compliance_score || null, notes ? ` | Report: ${notes}` : '', visitId]
      );
    }

    const oosCount = merch_summary?.oos_count || 0;
    const totalProducts = merch_summary?.total_products || 15;
    const planogramScore = compliance_score ? Math.min(10, Math.round(compliance_score / 10)) : 5;
    const stockScore = totalProducts > 0 ? Math.round(((totalProducts - oosCount) / totalProducts) * 10) : 10;
    const visibilityScore = Math.min(10, Math.round((planogramScore + stockScore) / 2 + (Math.random() * 1)));
    const priceScore = Math.round(7 + Math.random() * 3);
    const overallScore = Math.round((planogramScore + stockScore + visibilityScore + priceScore) / 4 * 10) / 10;

    const sid = store_id || null;
    const rid = rep_id || 1;
    if (sid) {
      await executeQuery(
        `INSERT INTO STORE_AUDITS (STORE_ID, REP_ID, AUDIT_DATE, PLANOGRAM_COMPLIANCE_SCORE, PRICE_COMPLIANCE_SCORE, STOCK_AVAILABILITY_SCORE, VISIBILITY_SCORE, OVERALL_SCORE, NOTES)
         VALUES (?, ?, CURRENT_DATE(), ?, ?, ?, ?, ?, ?)`,
        [sid, rid, planogramScore, priceScore, stockScore, visibilityScore, overallScore, notes || '']
      );
    }

    res.json({
      success: true,
      scores: { planogram: planogramScore, price: priceScore, stock: stockScore, visibility: visibilityScore, overall: overallScore }
    });
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

// ============================================================
// AI VISIT REPORT GENERATION
// ============================================================
app.post('/api/visits/generate-report', async (req, res) => {
  try {
    const { store_name, merch_summary, competition_notes, promotions_activated, orders, photos_count } = req.body;

    const facingChanges = merch_summary.facing_changes || [];
    const facingText = facingChanges.length > 0
      ? `\nFacing changes vs previous visit: ${facingChanges.map(f => `${f.product}: ${f.previous} -> ${f.current} (${f.change > 0 ? '+' : ''}${f.change})`).join('; ')}.`
      : '';

    const dataContext = `
Store: ${store_name}
Merchandising: ${merch_summary.checked_count}/${merch_summary.total_products} products checked, ${merch_summary.total_facings} total facings, ${merch_summary.oos_count} out-of-stock items${merch_summary.oos_items ? ' (' + merch_summary.oos_items + ')' : ''}.
Planogram compliance: ${merch_summary.compliance || 'N/A'}%.${facingText}
Competition notes: ${competition_notes || 'None recorded'}.
Promotions activated: ${promotions_activated.length > 0 ? promotions_activated.join(', ') : 'None'}.
Orders placed: ${orders.length > 0 ? orders.map(o => o.name + ' x' + o.qty).join(', ') : 'None'}.
Photos taken: ${photos_count}.
`.trim();

    const systemPrompt = `You are a senior field sales manager for Velvet F&B, a luxury fragrance and skincare brand sold in premium retailers (Sephora, Marionnaud, Nocibé).
Write a concise, professional visit report based on the data provided. Structure it with:
1. EXECUTIVE SUMMARY (2-3 sentences)
2. KEY FINDINGS (bullet points — HIGHLIGHT any facing decreases as ALERTS requiring attention)
3. ACTIONS FOR BETTER PERFORMANCE (3-5 concrete, actionable recommendations to improve sell-out, visibility, and compliance. If facings have decreased, suggest specific corrective actions.)
4. NEXT STEPS (what to prepare for the next visit)

Be specific, data-driven, and strategic. Use numbers from the data. Write in English. Keep the report under 300 words.`;

    const cortexSql = `
      SELECT SNOWFLAKE.CORTEX.COMPLETE(
        'mistral-large',
        [
          {'role': 'system', 'content': '${systemPrompt.replace(/'/g, "''")}'},
          {'role': 'user', 'content': 'Generate a visit report from this data:\\n${dataContext.replace(/'/g, "''").replace(/\n/g, '\\n')}'}
        ],
        {'temperature': 0.6, 'max_tokens': 1000}
      ) AS RESPONSE
    `;

    const result = await executeQuery(cortexSql);
    const raw = result[0].RESPONSE;
    const response = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const report = response.choices?.[0]?.messages || response.choices?.[0]?.message?.content || '';

    res.json({ report });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// TERRITORY KPIs (aggregated for rep)
// ============================================================
app.get('/api/rep/:id/kpis', async (req, res) => {
  try {
    const sql = `
      SELECT 
        ROUND(SUM(sp.SELL_OUT_UNITS), 0) AS TOTAL_SELL_OUT,
        ROUND(AVG(sp.MARKET_SHARE_PERCENT), 1) AS AVG_MARKET_SHARE,
        ROUND(SUM(CASE WHEN sp.NUMERICAL_DISTRIBUTION_STATUS THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) * 100, 1) AS DISTRIBUTION_RATE,
        COUNT(DISTINCT sp.STORE_ID) AS ACTIVE_STORES
      FROM STORE_PERFORMANCE sp
      JOIN STORES s ON sp.STORE_ID = s.STORE_ID
      WHERE s.REP_ID = ?
        AND sp.DATE >= DATEADD('day', -30, CURRENT_DATE())
    `;
    const rows = await executeQuery(sql, [req.params.id]);
    res.json(rows[0] || {});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/rep/:id/visits-month', async (req, res) => {
  try {
    const sql = `
      SELECT COUNT(*) AS VISITS_THIS_MONTH
      FROM VISITS
      WHERE REP_ID = ?
        AND SCHEDULED_DATETIME >= DATE_TRUNC('month', CURRENT_DATE())
        AND SCHEDULED_DATETIME < DATEADD('month', 1, DATE_TRUNC('month', CURRENT_DATE()))
    `;
    const rows = await executeQuery(sql, [req.params.id]);
    res.json(rows[0] || { VISITS_THIS_MONTH: 0 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// STORE AUDITS
// ============================================================
app.get('/api/stores/:id/audits', async (req, res) => {
  try {
    const sql = `SELECT * FROM STORE_AUDITS WHERE STORE_ID = ? ORDER BY AUDIT_DATE DESC LIMIT 10`;
    const rows = await executeQuery(sql, [req.params.id]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// STORE CASES
// ============================================================
app.get('/api/stores/:id/cases', async (req, res) => {
  try {
    const sql = `SELECT * FROM STORE_CASES WHERE STORE_ID = ? ORDER BY CASE_DATE DESC LIMIT 20`;
    const rows = await executeQuery(sql, [req.params.id]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// STORE VISITS HISTORY
// ============================================================
app.get('/api/stores/:id/visits', async (req, res) => {
  try {
    const sql = `SELECT * FROM VISITS WHERE STORE_ID = ? ORDER BY SCHEDULED_DATETIME DESC LIMIT 10`;
    const rows = await executeQuery(sql, [req.params.id]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// RETAILER NEWS
// ============================================================
app.get('/api/retailer/:name/news', async (req, res) => {
  try {
    const sql = `SELECT * FROM RETAILER_NEWS WHERE RETAILER_NAME = ? ORDER BY NEWS_DATE DESC LIMIT 10`;
    const rows = await executeQuery(sql, [req.params.name]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// PREPARE VISIT (AI summary)
// ============================================================
app.get('/api/stores/:id/prepare', async (req, res) => {
  try {
    const storeRows = await executeQuery('SELECT * FROM STORES WHERE STORE_ID = ?', [req.params.id]);
    const store = storeRows[0];
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const [audits, cases, news, kpis, visits] = await Promise.all([
      executeQuery('SELECT * FROM STORE_AUDITS WHERE STORE_ID = ? ORDER BY AUDIT_DATE DESC LIMIT 3', [req.params.id]),
      executeQuery('SELECT * FROM STORE_CASES WHERE STORE_ID = ? AND STATUS = \'Open\' ORDER BY CASE_DATE DESC', [req.params.id]),
      executeQuery('SELECT * FROM RETAILER_NEWS WHERE RETAILER_NAME = ? AND NEWS_DATE >= DATEADD(\'day\', -30, CURRENT_DATE()) ORDER BY NEWS_DATE DESC', [store.RETAILER_NAME]),
      executeQuery(`SELECT ROUND(AVG(SELL_OUT_UNITS),1) AS AVG_SELL_OUT, ROUND(AVG(MARKET_SHARE_PERCENT),1) AS AVG_MARKET_SHARE, ROUND(SUM(CASE WHEN NUMERICAL_DISTRIBUTION_STATUS THEN 1 ELSE 0 END)::FLOAT/NULLIF(COUNT(*),0)*100,1) AS DN FROM STORE_PERFORMANCE WHERE STORE_ID = ? AND DATE >= DATEADD('day',-30,CURRENT_DATE())`, [req.params.id]),
      executeQuery('SELECT * FROM VISITS WHERE STORE_ID = ? ORDER BY SCHEDULED_DATETIME DESC LIMIT 5', [req.params.id]),
    ]);

    const context = {
      store_name: store.STORE_NAME,
      retailer: store.RETAILER_NAME,
      address: store.ADDRESS,
      manager: store.STORE_MANAGER_NAME,
      kpis: kpis[0] || {},
      recent_audits: audits,
      open_cases: cases,
      retailer_news: news,
      recent_visits: visits,
    };

    const contextStr = JSON.stringify(context).replace(/'/g, "''").replace(/\\/g, '\\\\').substring(0, 3000);

    const cortexSql = `
      SELECT SNOWFLAKE.CORTEX.COMPLETE(
        'mistral-large',
        [
          {'role': 'system', 'content': 'You are a premium beauty brand field sales coach. Prepare a concise visit briefing for a sales rep about to visit a retail partner. Structure: 1) Key Context (2-3 bullets), 2) Organizational Changes (if any), 3) Open Issues, 4) Performance Highlights, 5) Recommended Actions (2-3 steps). Be concise and action-oriented. Use bullet points.'},
          {'role': 'user', 'content': 'Prepare my visit briefing for: ${contextStr}'}
        ],
        {'temperature': 0.4, 'max_tokens': 600}
      ) AS RESPONSE
    `;

    const result = await executeQuery(cortexSql);
    const raw = result[0].RESPONSE;
    const aiResponse = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const briefing = aiResponse.choices?.[0]?.messages || aiResponse.choices?.[0]?.message?.content || '';

    res.json({ briefing, context });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// REP PROFILE
// ============================================================
app.get('/api/rep/:id', async (req, res) => {
  try {
    const rows = await executeQuery('SELECT * FROM FIELD_SALES WHERE REP_ID = ?', [req.params.id]);
    res.json(rows[0] || {});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/rep/:id/home-address', async (req, res) => {
  try {
    const { home_address } = req.body;
    await executeQuery('UPDATE FIELD_SALES SET HOME_ADDRESS = ? WHERE REP_ID = ?', [home_address, req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// ROUTE OPTIMIZATION (OSRM road-based routing)
// ============================================================
app.post('/api/route/optimize', async (req, res) => {
  try {
    const { waypoints, home } = req.body;
    if (!waypoints || waypoints.length === 0) return res.json({ order: [], distance: 0, geometry: [] });

    const allPoints = [];
    if (home) allPoints.push(home);
    waypoints.forEach(w => allPoints.push(w));
    if (home) allPoints.push(home);

    const coords = allPoints.map(p => `${p.lng},${p.lat}`).join(';');
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`;

    const osrmRes = await axios.get(osrmUrl, { timeout: 10000 });
    const route = osrmRes.data.routes?.[0];

    if (!route) {
      return res.json({ order: waypoints.map((_, i) => i), total_distance_km: 0, duration_min: 0, geometry: [] });
    }

    const geometry = route.geometry.coordinates.map(c => [c[1], c[0]]);

    res.json({
      order: waypoints.map((_, i) => i),
      total_distance_km: Math.round(route.distance / 100) / 10,
      duration_min: Math.round(route.duration / 60),
      geometry
    });
  } catch (e) {
    const { waypoints, home } = req.body;
    const haversine = (a, b) => {
      const R = 6371;
      const dLat = (b.lat - a.lat) * Math.PI / 180;
      const dLon = (b.lng - a.lng) * Math.PI / 180;
      const x = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLon/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
    };
    let dist = 0;
    const pts = home ? [home, ...waypoints, home] : waypoints;
    for (let i = 1; i < pts.length; i++) dist += haversine(pts[i-1], pts[i]);
    const geometry = pts.map(p => [p.lat, p.lng]);
    res.json({ order: waypoints.map((_, i) => i), total_distance_km: Math.round(dist * 10) / 10, duration_min: 0, geometry });
  }
});

// ============================================================
// DEMO RESET
// ============================================================
app.post('/api/demo/reset', async (req, res) => {
  try {
    const repId = req.body.rep_id || 1;
    
    await executeQuery('DELETE FROM VISITS WHERE REP_ID = ?', [repId]);

    const storesSql = `SELECT STORE_ID, STORE_NAME FROM STORES WHERE REP_ID = ? ORDER BY RANDOM() LIMIT 50`;
    const stores = await executeQuery(storesSql, [repId]);

    const heroStore = await executeQuery(
      `SELECT STORE_ID FROM STORES WHERE STORE_NAME = 'Sephora Clamart' AND REP_ID = ?`, [repId]
    );
    const heroStoreId = heroStore.length > 0 ? heroStore[0].STORE_ID : stores[0]?.STORE_ID;

    const today = new Date().toISOString().split('T')[0];
    const visits = [];
    const hours = ['08:30:00', '09:30:00', '10:30:00', '11:30:00', '14:00:00', '15:30:00', '16:30:00'];

    const notes = [
      'Review NPD placement. Competitor gained facing.',
      'Quarterly review prep. Bring sell-out data.',
      'Full bay audit. Premium activation push.',
      'High footfall location. Negotiate promo slot.',
      'Sell-in negotiation for next quarter.',
      'Check numerical distribution on new launches.',
      'Market share recovery plan needed.',
      'Introduce new Skincare range. Growth opportunity.',
      'Monthly performance review with store manager.',
      'Stock check and replenishment order.',
      'Follow-up on previous corrective actions.',
      'Summer campaign activation check.',
      'Verify promotional end-cap execution.',
      'New gondola head negotiation.',
      'Competitor benchmark and facing count.',
    ];

    visits.push(`(${repId}, ${heroStoreId}, '${today} 09:00:00', 'Planned', 'Hero store — Push Oud Mystique end-cap. Negotiate 2nd facing.')`);
    visits.push(`(${repId}, ${stores[1 % stores.length].STORE_ID}, '${today} 11:00:00', 'Planned', 'Morning visit — Check stock levels and validate planogram.')`);
    visits.push(`(${repId}, ${stores[2 % stores.length].STORE_ID}, '${today} 14:30:00', 'Planned', 'Afternoon — Sell-in meeting with store manager.')`);

    let storeIdx = 3;

    // Past visits (earlier this month) — mark as Completed
    for (let dayBack = 1; dayBack <= 4; dayBack++) {
      const d = new Date();
      d.setDate(d.getDate() - dayBack);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      if (d.getMonth() !== new Date().getMonth()) break;
      const dateStr = d.toISOString().split('T')[0];
      const visitsPerDay = 1 + Math.floor(Math.random() * 2);
      for (let v = 0; v < visitsPerDay; v++) {
        const sid = stores[storeIdx % stores.length].STORE_ID;
        const hour = hours[v % hours.length];
        const note = notes[(storeIdx + v) % notes.length];
        visits.push(`(${repId}, ${sid}, '${dateStr} ${hour}', 'Completed', '${note.replace(/'/g, "''")}')`);
        storeIdx++;
      }
    }

    // Future visits
    for (let week = 0; week < 4; week++) {
      for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
        const d = new Date();
        d.setDate(d.getDate() + (week * 7) + dayOffset);
        if (d.getDay() === 0 || d.getDay() === 6) continue;
        
        const dateStr = d.toISOString().split('T')[0];
        const visitsPerDay = 1 + Math.floor(Math.random() * 2);

        for (let v = 0; v < visitsPerDay; v++) {
          const sid = stores[storeIdx % stores.length].STORE_ID;
          const hour = hours[v % hours.length];
          const note = notes[(storeIdx + v) % notes.length];
          const status = (week === 2 && dayOffset === 3 && v === 0) ? 'Urgent' : 'Planned';
          visits.push(`(${repId}, ${sid}, '${dateStr} ${hour}', '${status}', '${note.replace(/'/g, "''")}')`);
          storeIdx++;
        }
      }
    }

    const insertSql = `INSERT INTO VISITS (REP_ID, STORE_ID, SCHEDULED_DATETIME, STATUS, AI_RECOMMENDATION_NOTES) VALUES ${visits.join(',')}`;
    await executeQuery(insertSql);

    // === DEMO STORY DATA: Performance adjustments ===
    // Story 1: Sephora Clamart (65) — overall -12% sell-out, Lumière de Soie (PRODUCT_ID=2) -34%
    await executeQuery(`UPDATE STORE_PERFORMANCE SET SELL_OUT_UNITS = GREATEST(ROUND(SELL_OUT_UNITS * 0.88, 0), 1)
      WHERE STORE_ID = 65 AND DATE >= DATEADD('day', -30, CURRENT_DATE()) AND PRODUCT_ID != 2`);
    await executeQuery(`UPDATE STORE_PERFORMANCE SET SELL_OUT_UNITS = GREATEST(ROUND(SELL_OUT_UNITS * 0.66, 0), 1)
      WHERE STORE_ID = 65 AND DATE >= DATEADD('day', -30, CURRENT_DATE()) AND PRODUCT_ID = 2`);
    await executeQuery(`UPDATE STORE_PERFORMANCE SET SELL_OUT_UNITS = ROUND(SELL_OUT_UNITS * 1.05, 0)
      WHERE STORE_ID = 65 AND DATE < DATEADD('day', -30, CURRENT_DATE()) AND DATE >= DATEADD('day', -60, CURRENT_DATE())`);
    await executeQuery(`UPDATE STORE_PERFORMANCE SET SELL_OUT_UNITS = GREATEST(ROUND(SELL_OUT_UNITS * 1.15, 0), 1)
      WHERE STORE_ID = 65 AND DATE >= DATEADD('day', -30, CURRENT_DATE()) AND PRODUCT_ID = 2`);

    // Story 2: Marionnaud Clamart (299) — overall -7%, skincare -14%, market share -2pts
    await executeQuery(`UPDATE STORE_PERFORMANCE SET SELL_OUT_UNITS = GREATEST(ROUND(SELL_OUT_UNITS * 0.93, 0), 1)
      WHERE STORE_ID = 299 AND DATE >= DATEADD('day', -30, CURRENT_DATE())`);
    await executeQuery(`UPDATE STORE_PERFORMANCE SET SELL_OUT_UNITS = GREATEST(ROUND(SELL_OUT_UNITS * 0.92, 0), 1)
      WHERE STORE_ID = 299 AND DATE >= DATEADD('day', -30, CURRENT_DATE()) AND PRODUCT_ID IN (6,7,8,9,10)`);
    await executeQuery(`UPDATE STORE_PERFORMANCE SET MARKET_SHARE_PERCENT = GREATEST(MARKET_SHARE_PERCENT - 2.0, 3.0)
      WHERE STORE_ID = 299 AND DATE >= DATEADD('day', -30, CURRENT_DATE())`);
    await executeQuery(`UPDATE STORE_PERFORMANCE SET SELL_OUT_UNITS = ROUND(SELL_OUT_UNITS * 1.06, 0)
      WHERE STORE_ID = 299 AND DATE < DATEADD('day', -30, CURRENT_DATE()) AND DATE >= DATEADD('day', -60, CURRENT_DATE())`);

    // Hero store assortments
    await executeQuery(`DELETE FROM STORE_ASSORTMENT WHERE STORE_ID = 65 AND CATALOG_ID IN (SELECT CATALOG_ID FROM PRODUCT_CATALOG WHERE PRODUCT_TYPE = 'Sellable')`);
    await executeQuery(`INSERT INTO STORE_ASSORTMENT (STORE_ID, CATALOG_ID) SELECT 65, CATALOG_ID FROM PRODUCT_CATALOG WHERE PRODUCT_TYPE='Sellable' AND CATEGORY='Fragrance'`);
    await executeQuery(`INSERT INTO STORE_ASSORTMENT (STORE_ID, CATALOG_ID) VALUES (65,6),(65,7),(65,9),(65,10)`);
    await executeQuery(`INSERT INTO STORE_ASSORTMENT (STORE_ID, CATALOG_ID) VALUES (65,12),(65,13),(65,14)`);

    await executeQuery(`DELETE FROM STORE_ASSORTMENT WHERE STORE_ID = 299 AND CATALOG_ID IN (SELECT CATALOG_ID FROM PRODUCT_CATALOG WHERE PRODUCT_TYPE = 'Sellable')`);
    await executeQuery(`INSERT INTO STORE_ASSORTMENT (STORE_ID, CATALOG_ID) VALUES (299,1),(299,2),(299,3),(299,4)`);
    await executeQuery(`INSERT INTO STORE_ASSORTMENT (STORE_ID, CATALOG_ID) SELECT 299, CATALOG_ID FROM PRODUCT_CATALOG WHERE PRODUCT_TYPE='Sellable' AND CATEGORY='Skincare'`);
    await executeQuery(`INSERT INTO STORE_ASSORTMENT (STORE_ID, CATALOG_ID) VALUES (299,12),(299,13),(299,14)`);
    res.json({ success: true, visits_created: visits.length });
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
