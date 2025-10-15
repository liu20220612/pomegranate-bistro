import { Server } from 'socket.io';

// 简单的内存存储
const connectedClients = new Map();

export default function handler(req, res) {
  console.log('🔧 API请求收到:', req.method, req.url);
  
  // 设置响应头
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    console.log('处理OPTIONS预检请求');
    res.status(200).end();
    return;
  }

  // 初始化Socket.io（只在第一次请求时）
  if (!res.socket.server.io) {
    console.log('🚀 首次请求，初始化Socket.io...');
    
    try {
      const io = new Server(res.socket.server, {
        path: '/api/socket.io',
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        }
      });

      res.socket.server.io = io;

      io.on('connection', (socket) => {
        console.log('✅ 客户端连接成功:', socket.id);
        
        // 发送欢迎消息
        socket.emit('welcome', { 
          message: '连接成功',
          serverTime: new Date().toISOString()
        });

        socket.on('register', (data) => {
          console.log(`📱 设备注册: ${data.deviceId}`);
          connectedClients.set(socket.id, data.deviceId);
        });

        socket.on('menu_update', (data) => {
          console.log(`📝 菜单更新: ${data.deviceId}`);
          socket.broadcast.emit('menu_update', data);
        });

        socket.on('disconnect', () => {
          console.log(`❌ 客户端断开: ${socket.id}`);
          connectedClients.delete(socket.id);
        });
      });

      console.log('✅ Socket.io服务器初始化完成');

    } catch (error) {
      console.error('❌ Socket.io初始化失败:', error);
      return res.status(500).json({ 
        error: '服务器初始化失败',
        details: error.message 
      });
    }
  }

  // 返回API状态信息
  console.log('📊 返回API状态信息');
  res.status(200).json({ 
    status: 'success',
    message: 'WebSocket服务器运行中',
    timestamp: new Date().toISOString(),
    connectedClients: connectedClients.size,
    path: '/api/socket.io'
  });
}
