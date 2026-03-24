import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket(role: 'ADMIN' | 'EMPLOYEE') {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  s.emit(role === 'ADMIN' ? 'join:admin' : 'join:employee');
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
