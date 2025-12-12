/cat > api/patients.js << 'EOF'
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const patients = [
    { id: 'P001', name: 'James Anderson', age: 80 },
    { id: 'P002', name: 'Maria Rodriguez', age: 72 }
  ];

  return res.status(200).json({
    status: 'UP',
    patients: patients,
    total: patients.length
  });
};
EOF
