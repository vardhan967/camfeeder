import { io, Socket } from 'socket.io-client';
import { SERVER_URL } from '../constants';

export let socket: Socket;

export const initSocket = () => {
  if (!socket) {
    socket = io(SERVER_URL, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Admin Socket Connected:', socket.id);
      socket.emit('ADMIN_JOIN');
    });

    socket.on('disconnect', () => {
      console.log('Admin Socket Disconnected');
    });
  }
};
