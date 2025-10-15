import { Server } from 'socket.io';

let ioInstance = null;
const connectedClients = new Map();

function initializeSocketIO(server) {
  if (ioInstance) {
    return ioInstance;
  }

  console.log('🚀 初始化Socket.io服务器...');
  
  try {
    ioInstance = new Server(server, {
      path: '/api/socket.io',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      // 添加Vercel适配配置
      adapter: require('socket.io-adapter'),
      // 减少ping超时以适应Serverless环境
      pingTimeout: 30000,
      pingInterval: 25000
    });

    ioInstance.on('connection', (socket) => {
      console.log('✅ 客户端连接成功:', socket.id);
      
      // 发送欢迎消息
      socket.emit('welcome', { 
        message: '连接成功',
        serverTime: new Date().toISOString(),
        socketId: socket.id
      });

      socket.on('register', (data) => {
        console.log(`📱 设备注册: ${data.deviceId}`);
        connectedClients.set(socket.id, {
          deviceId: data.deviceId,
          socketId: socket.id
        });
        
        // 通知其他设备
        socket.broadcast.emit('device_connected', {
          deviceId: data.deviceId,
          timestamp: new Date().toISOString()
        });
      });

      socket.on('menu_update', (data) => {
        console.log(`📝 收到菜单更新 from ${data.deviceId}`);
        // 广播给其他所有客户端
        socket.broadcast.emit('menu_update', data);
      });

      socket.on('sync_request', (data) => {
        console.log(`🔄 同步请求 from ${data.deviceId}`);
        socket.broadcast.emit('sync_request', data);
      });

      socket.on('disconnect', (reason) => {
        console.log(`❌ 客户端断开: ${socket.id}`, reason);
        const clientInfo = connectedClients.get(socket.id);
        if (clientInfo) {
          connectedClients.delete(socket.id);
        }
      });

      socket.on('error', (error) => {
        console.error('Socket错误:', error);
      });
    });

    console.log('✅ Socket.io服务器初始化完成');
    return ioInstance;

  } catch (error) {
    console.error('❌ Socket.io初始化失败:', error);
    throw error;
  }
}

export default function handler(req, res) {
  console.log('🔧 API请求:', req.method, req.url);
  
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

  try {
    // 初始化或获取Socket.io实例
    if (!res.socket.server.io) {
      res.socket.server.io = initializeSocketIO(res.socket.server);
    }

    // 返回成功响应
    res.status(200).json({ 
      status: 'success',
      message: 'WebSocket服务器运行中',
      timestamp: new Date().toISOString(),
      connectedClients: connectedClients.size,
      path: '/api/socket.io'
    });

  } catch (error) {
    console.error('❌ 服务器错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误',
      message: error.message
    });
  }
}

