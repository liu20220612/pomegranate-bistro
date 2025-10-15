// 简化版本，专注于基本功能
const sessions = new Map();

export default function handler(req, res) {
  console.log('🔧 API请求:', req.method, req.url);
  
  // 设置响应头
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 处理Socket.io握手请求
  if (req.method === 'GET' && req.url.includes('/socket.io')) {
    console.log('🤝 Socket.io握手请求');
    
    // 模拟Socket.io握手响应
    res.status(200).json({
      sid: 'session_' + Date.now(),
      upgrades: [],
      pingInterval: 25000,
      pingTimeout: 5000
    });
    return;
  }

  // 处理菜单更新请求
  if (req.method === 'POST' && req.url.includes('/socket.io')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        console.log('📝 收到数据:', body);
        
        // 这里可以处理实际的菜单更新逻辑
        // 由于Serverless限制，我们简化处理
        
        res.status(200).json({
          status: 'received',
          message: '数据已接收'
        });
      } catch (error) {
        console.error('处理数据错误:', error);
        res.status(200).json({ error: '处理失败' });
      }
    });
    return;
  }

  // 默认响应
  res.status(200).json({
    status: 'ready',
    message: 'API服务器运行中',
    timestamp: new Date().toISOString(),
    note: '由于Serverless限制，实时同步功能使用简化版本'
  });
}
