import { Server } from 'socket.io';

let io;

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log('初始化Socket.io服务器');
    
    io = new Server(res.socket.server, {
      path: '/api/socket',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('客户端连接:', socket.id);
      
      socket.on('register', (data) => {
        console.log(`设备注册: ${data.deviceId}`);
        socket.broadcast.emit('device_connected', {
          deviceId: data.deviceId,
          timestamp: new Date().toISOString()
        });
      });

      socket.on('menu_update', (data) => {
        console.log(`收到菜单更新 from ${data.deviceId}`);
        socket.broadcast.emit('menu_update', data);
      });

      socket.on('sync_request', (data) => {
        console.log(`同步请求 from ${data.deviceId}`);
        socket.broadcast.emit('sync_request', {
          requestingDevice: data.deviceId,
          timestamp: new Date().toISOString()
        });
      });

      socket.on('disconnect', () => {
        console.log('客户端断开:', socket.id);
      });
    });
  }
  
  res.end();
}