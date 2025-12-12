cat > api/ai-gateway.js << 'EOF'
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const url = req.url || '';
    
    if (req.method === 'GET' && (url === '/api/ai-gateway' || url === '/api/ai-gateway/')) {
      return res.status(200).json({
        status: 'UP',
        service: 'vas-ai-gateway',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(200).json({ status: 'OK', service: 'ai-gateway' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
EOF
