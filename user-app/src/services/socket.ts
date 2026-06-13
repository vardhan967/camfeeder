import { io, Socket } from 'socket.io-client';
import { SERVER_URL } from '../constants';
import * as Device from 'expo-device';
import { useStore } from '../store/useStore';
import { setupWebRTCListeners } from './webrtc';

export let socket: Socket;

export const initSocket = async () => {
  if (socket) return;
  
  socket = io(SERVER_URL, {
    transports: ['websocket'],
  });

  // Generate a rudimentary Device ID for this demo
  const deviceId = (Device.modelName || 'Device') + '_' + (Device.osBuildId || Math.floor(Math.random() * 10000));
  
  useStore.getState().setDeviceId(deviceId);

  socket.on('connect', () => {
    console.log('User Socket Connected:', socket.id);
    useStore.getState().setStatus('Connected');
    socket.emit('REGISTER_DEVICE', { deviceId, platform: Device.osName });
  });

  socket.on('REGISTER_SUCCESS', () => {
    console.log('Device successfully registered');
    useStore.getState().setStatus('Ready & Waiting...');
  });

  socket.on('disconnect', () => {
    console.log('User Socket Disconnected');
    useStore.getState().setStatus('Disconnected');
  });

  setupWebRTCListeners();
};
