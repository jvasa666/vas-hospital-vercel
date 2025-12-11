// Mock clinical data
const encounters = [
  { id: 'E001', patient_id: 'P001', type: 'Inpatient', status: 'Active', admission: '2025-12-10' },
  { id: 'E002', patient_id: 'P002', type: 'Emergency', status: 'Active', admission: '2025-12-11' }
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  return res.status(200).json({
    status: 'UP',
    service: 'vas-clinical-service',
    encounters,
    total: encounters.length
  });
};
