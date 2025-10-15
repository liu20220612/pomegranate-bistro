import { Server } from 'socket.io';

// 存储连接的客户端
const connectedClients = new Map();

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log('初始化Socket.io服务器');
    
    const io = new Server(res.socket.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('客户端连接:', socket.id);
      
      // 客户端注册
      socket.on('register', (data) => {
        connectedClients.set(socket.id, {
          deviceId: data.deviceId,
          socketId: socket.id,
          connectedAt: new Date()
        });
        
        console.log(`设备注册: ${data.deviceId}`);
        
        // 通知其他客户端有新设备连接
        socket.broadcast.emit('device_connected', {
          deviceId: data.deviceId,
          timestamp: new Date().toISOString()
        });
      });

      // 处理菜单更新
      socket.on('menu_update', (data) => {
        console.log(`收到菜单更新 from ${data.deviceId}`);
        
        // 广播给其他所有客户端（除了发送者）
        socket.broadcast.emit('menu_update', {
          ...data,
          timestamp: new Date().toISOString()
        });
      });

      // 处理同步请求
      socket.on('sync_request', (data) => {
        console.log(`同步请求 from ${data.deviceId}`);
        
        // 通知其他设备发送当前状态
        socket.broadcast.emit('sync_request', {
          requestingDevice: data.deviceId,
          timestamp: new Date().toISOString()
        });
      });

      // 处理断开连接
      socket.on('disconnect', () => {
        const clientInfo = connectedClients.get(socket.id);
        if (clientInfo) {
          console.log(`客户端断开: ${clientInfo.deviceId}`);
          connectedClients.delete(socket.id);
        }
        
        socket.broadcast.emit('device_disconnected', {
          deviceId: clientInfo?.deviceId,
          timestamp: new Date().toISOString()
        });
      });
    });
  }
  
  res.end();
}