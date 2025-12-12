cat > api/clinical.js << 'EOF'
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const encounters = [
    { id: 'E001', patient: 'James Anderson', type: 'Inpatient' },
    { id: 'E002', patient: 'Maria Rodriguez', type: 'Emergency' }
  ];

  return res.status(200).json({
    status: 'UP',
    encounters: encounters,
    total: encounters.length
  });
};
EOF
