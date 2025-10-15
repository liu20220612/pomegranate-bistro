import { Server } from 'socket.io';

export default function handler(req, res) {
  // 如果已经初始化，直接返回
  if (res.socket.server.io) {
    console.log('Socket.io already running');
    res.end();
    return;
  }

  console.log('Initializing Socket.io...');

  // 初始化Socket.io
  const io = new Server(res.socket.server, {
    path: '/api/socket.io',
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  res.socket.server.io = io;

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('register', (data) => {
      console.log('Device registered:', data.deviceId);
      socket.broadcast.emit('device_connected', data);
    });

    socket.on('menu_update', (data) => {
      console.log('Menu update from:', data.deviceId);
      socket.broadcast.emit('menu_update', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  res.end();
}
