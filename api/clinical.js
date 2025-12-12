// VAS Clinical Service - Fixed for Vercel
const encounters = [
  { id: 'E001', patient_id: 'P001', type: 'Inpatient', status: 'Active', admission: '2025-12-10', chief_complaint: 'Fever and chills' },
  { id: 'E002', patient_id: 'P002', type: 'Emergency', status: 'Active', admission: '2025-12-11', chief_complaint: 'Chest pain' },
  { id: 'E003', patient_id: 'P003', type: 'Outpatient', status: 'Completed', admission: '2025-12-09', chief_complaint: 'Follow-up' }
];

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const pathname = url.pathname;
    
    // GET /api/clinical - List encounters
    if (req.method === 'GET') {
      return res.status(200).json({
        status: 'UP',
        service: 'vas-clinical-service',
        encounters,
        total: encounters.length,
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(404).json({ error: 'Not found' });
    
  } catch (error) {
    console.error('Error in Clinical API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
