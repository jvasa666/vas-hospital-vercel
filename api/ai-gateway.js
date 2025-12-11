// VAS AI Gateway - Serverless Function
const Anthropic = require('@anthropic-ai/sdk');

// In-memory capability handlers (no external DB needed)
const capabilities = {
  'data:encrypt': (terms) => {
    // Simple encryption (use real crypto in production)
    const encrypted = Buffer.from(terms.plaintext || '').toString('base64');
    return { ciphertext: encrypted };
  },
  
  'data:decrypt': (terms) => {
    const decrypted = Buffer.from(terms.ciphertext || '', 'base64').toString('utf8');
    return { plaintext: decrypted };
  },
  
  'clinical:sepsis_risk': (terms) => {
    const { vitals = {} } = terms;
    let risk_score = 0;
    
    // Sepsis prediction algorithm
    if (vitals.temperature > 100.4 || vitals.temperature < 96.8) risk_score += 0.3;
    if (vitals.heart_rate > 90) risk_score += 0.2;
    if (vitals.bp_systolic < 100) risk_score += 0.3;
    if (vitals.wbc_count > 12 || vitals.wbc_count < 4) risk_score += 0.2;
    
    const risk_level = risk_score > 0.6 ? 'HIGH' : risk_score > 0.3 ? 'MEDIUM' : 'LOW';
    const recommendation = risk_score > 0.6 
      ? 'INITIATE SEPSIS PROTOCOL - Alert physician immediately'
      : risk_score > 0.3
      ? 'Increase monitoring frequency, consider blood cultures'
      : 'Continue standard monitoring';
    
    return {
      risk_score: Math.min(risk_score, 1.0),
      risk_level,
      recommendation,
      confidence: 0.85
    };
  },
  
  'clinical:drug_interaction': (terms) => {
    const { medications = [] } = terms;
    const interactions = [];
    
    // Simple interaction checker
    const dangerous = [
      ['warfarin', 'aspirin', 'Increased bleeding risk'],
      ['metformin', 'contrast', 'Lactic acidosis risk'],
      ['ssri', 'tramadol', 'Serotonin syndrome risk']
    ];
    
    const meds = medications.map(m => m.toLowerCase());
    
    dangerous.forEach(([drug1, drug2, warning]) => {
      if (meds.some(m => m.includes(drug1)) && meds.some(m => m.includes(drug2))) {
        interactions.push({
          drugs: [drug1, drug2],
          severity: 'HIGH',
          warning
        });
      }
    });
    
    return {
      has_interactions: interactions.length > 0,
      interactions,
      checked_medications: medications
    };
  },
  
  'analytics:readmission_risk': (terms) => {
    const { patient_data = {} } = terms;
    let risk_score = 0;
    const risk_factors = [];
    
    if (patient_data.age > 65) {
      risk_score += 0.3;
      risk_factors.push('Age > 65');
    }
    
    if (patient_data.chronic_conditions > 2) {
      risk_score += 0.4;
      risk_factors.push('Multiple chronic conditions');
    }
    
    if (patient_data.previous_admissions_30d > 0) {
      risk_score += 0.3;
      risk_factors.push('Recent admission');
    }
    
    const risk_level = risk_score > 0.6 ? 'HIGH' : risk_score > 0.3 ? 'MEDIUM' : 'LOW';
    
    return {
      risk_score: Math.min(risk_score, 1.0),
      risk_level,
      risk_factors,
      recommendation: risk_score > 0.6 
        ? 'Consider discharge planning intervention'
        : 'Standard discharge protocol'
    };
  }
};

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  
  // List capabilities
  if (req.method === 'GET' && pathname.includes('/capabilities')) {
    return res.status(200).json({
      capabilities: Object.keys(capabilities).map(name => ({
        name,
        description: `Capability: ${name}`
      })),
      total: Object.keys(capabilities).length,
      timestamp: new Date().toISOString()
    });
  }
  
  // Invoke capability
  if (req.method === 'POST' && pathname.includes('/invoke')) {
    try {
      const { capability, terms = {} } = req.body;
      
      if (!capability) {
        return res.status(400).json({ error: 'Missing capability name' });
      }
      
      if (!capabilities[capability]) {
        return res.status(404).json({ 
          error: `Capability '${capability}' not found`,
          available: Object.keys(capabilities)
        });
      }
      
      const startTime = Date.now();
      const result = capabilities[capability](terms);
      const executionTime = Date.now() - startTime;
      
      return res.status(200).json({
        success: true,
        result,
        capability,
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Health check
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'UP',
      service: 'vas-ai-gateway',
      capabilities: Object.keys(capabilities).length,
      timestamp: new Date().toISOString()
    });
  }
  
  res.status(404).json({ error: 'Not found' });
};
