// VAS AI Gateway - Fixed for Vercel Serverless
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Capability handlers (simplified, no external dependencies)
    const capabilities = {
      'data:encrypt': (terms) => {
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
        
        if (vitals.temperature > 100.4 || vitals.temperature < 96.8) risk_score += 0.3;
        if (vitals.heart_rate > 90) risk_score += 0.2;
        if (vitals.bp_systolic < 100) risk_score += 0.3;
        if (vitals.wbc_count > 12 || vitals.wbc_count < 4) risk_score += 0.2;
        
        const risk_level = risk_score > 0.6 ? 'HIGH' : risk_score > 0.3 ? 'MEDIUM' : 'LOW';
        const recommendation = risk_score > 0.6 
          ? 'INITIATE SEPSIS PROTOCOL - Alert physician immediately'
          : risk_score > 0.3
          ? 'Increase monitoring frequency'
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
        
        const dangerous = [
          ['warfarin', 'aspirin', 'Increased bleeding risk'],
          ['metformin', 'contrast', 'Lactic acidosis risk'],
          ['ssri', 'tramadol', 'Serotonin syndrome risk']
        ];
        
        const meds = medications.map(m => m.toLowerCase());
        
        dangerous.forEach(([drug1, drug2, warning]) => {
          if (meds.some(m => m.includes(drug1)) && meds.some(m => m.includes(drug2))) {
            interactions.push({ drugs: [drug1, drug2], severity: 'HIGH', warning });
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
        
        return {
          risk_score: Math.min(risk_score, 1.0),
          risk_level: risk_score > 0.6 ? 'HIGH' : risk_score > 0.3 ? 'MEDIUM' : 'LOW',
          risk_factors,
          recommendation: risk_score > 0.6 
            ? 'Consider discharge planning intervention'
            : 'Standard discharge protocol'
        };
      }
    };

    // Parse URL to get the endpoint
    const url = new URL(req.url, `https://${req.headers.host}`);
    const pathname = url.pathname;
    
    // GET /api/ai-gateway or /api/ai-gateway/ - Health check
    if (req.method === 'GET' && (pathname === '/api/ai-gateway' || pathname === '/api/ai-gateway/')) {
      return res.status(200).json({
        status: 'UP',
        service: 'vas-ai-gateway',
        capabilities: Object.keys(capabilities).length,
        timestamp: new Date().toISOString()
      });
    }
    
    // GET /api/ai-gateway/capabilities - List capabilities
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
    
    // POST /api/ai-gateway/invoke - Invoke capability
    if (req.method === 'POST' && pathname.includes('/invoke')) {
      // Parse body (Vercel handles this automatically)
      const body = req.body;
      
      if (!body || !body.capability) {
        return res.status(400).json({ 
          error: 'Missing capability name',
          received: body
        });
      }
      
      const { capability, terms = {} } = body;
      
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
    }
    
    // Unknown endpoint
    return res.status(404).json({ 
      error: 'Not found',
      path: pathname,
      method: req.method
    });
    
  } catch (error) {
    console.error('Error in AI Gateway:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
