import { Server, Socket } from 'socket.io';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join rooms based on role
    socket.on('join:admin', () => {
      socket.join('admin');
      console.log(`👑 Admin joined: ${socket.id}`);
    });

    socket.on('join:employee', () => {
      socket.join('employee');
      console.log(`👤 Employee joined: ${socket.id}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
}
