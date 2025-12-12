// Mock patient database
// VAS Patients Service - Fixed for Vercel
const patients = [
  { id: 'P001', mrn: 'MRN001001', first_name: 'James', last_name: 'Anderson', dob: '1945-03-15', status: 'Active' },
  { id: 'P002', mrn: 'MRN001002', first_name: 'Maria', last_name: 'Rodriguez', dob: '1952-07-22', status: 'Active' },
  { id: 'P003', mrn: 'MRN001003', first_name: 'Robert', last_name: 'Chen', dob: '1938-11-08', status: 'Active' },
  { id: 'P004', mrn: 'MRN001004', first_name: 'Emily', last_name: 'Thompson', dob: '1998-05-14', status: 'Active' },
  { id: 'P005', mrn: 'MRN001005', first_name: 'Michael', last_name: 'Johnson', dob: '1995-09-23', status: 'Active' }
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
    
    // GET /api/patients - List all
    if (req.method === 'GET' && (pathname === '/api/patients' || pathname === '/api/patients/')) {
      return res.status(200).json({
        patients,
        total: patients.length,
        timestamp: new Date().toISOString()
      });
    }
    
    // GET /api/patients/:id - Get by ID
    if (req.method === 'GET' && pathname.match(/\/api\/patients\/.+/)) {
      const id = pathname.split('/').pop();
      const patient = patients.find(p => p.id === id || p.mrn === id);
      
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found', id });
      }
      
      return res.status(200).json(patient);
    }
    
    // Default response
    return res.status(200).json({
      status: 'UP',
      service: 'vas-patient-service',
      total_patients: patients.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in Patients API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
