import { Server, Socket } from 'socket.io';
import { store } from '../store/memoryStore';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] New connection: ${socket.id}`);

    // 1. Device Registration (from User App)
    socket.on('REGISTER_DEVICE', (payload: { deviceId: string, platform?: string }) => {
      console.log(`[Socket] REGISTER_DEVICE: ${payload.deviceId}`);
      const device = store.registerDevice(payload.deviceId, socket.id, payload.platform);
      
      // Notify admins that a new device is online
      io.to('admin_room').emit('DEVICE_UPDATED', device);
      
      socket.join(`device_${payload.deviceId}`); // Join a room specifically for this device
      socket.emit('REGISTER_SUCCESS', { status: 'registered' });
    });

    // Admin connects and authenticates
    socket.on('ADMIN_JOIN', () => {
      console.log(`[Socket] Admin joined: ${socket.id}`);
      socket.join('admin_room');
      socket.emit('ALL_DEVICES', store.getAllDevices());
    });

    // 2. Start Session (Admin -> Device)
    socket.on('START_SESSION', (payload: { targetDeviceId: string }) => {
      console.log(`[Socket] START_SESSION to ${payload.targetDeviceId}`);
      const session = store.createSession('admin_current', payload.targetDeviceId);
      
      // Notify the target device to prepare for a WebRTC connection
      io.to(`device_${payload.targetDeviceId}`).emit('START_SESSION', {
        sessionId: session.id,
        adminSocketId: socket.id,
      });
    });

    // 3. WebRTC Signaling: Offer
    socket.on('OFFER', (payload: { target: string, sdp: any }) => {
      console.log(`[Socket] OFFER from ${socket.id} to ${payload.target}`);
      // Target could be a device room or an admin socket ID
      socket.to(`device_${payload.target}`).emit('OFFER', {
        sender: socket.id,
        sdp: payload.sdp
      });
      socket.to(payload.target).emit('OFFER', {
        sender: socket.id,
        sdp: payload.sdp
      });
    });

    // 4. WebRTC Signaling: Answer
    socket.on('ANSWER', (payload: { target: string, sdp: any }) => {
      console.log(`[Socket] ANSWER from ${socket.id} to ${payload.target}`);
      socket.to(`device_${payload.target}`).emit('ANSWER', {
        sender: socket.id,
        sdp: payload.sdp
      });
      socket.to(payload.target).emit('ANSWER', {
        sender: socket.id,
        sdp: payload.sdp
      });
    });

    // 5. WebRTC Signaling: ICE Candidate
    socket.on('ICE_CANDIDATE', (payload: { target: string, candidate: any }) => {
      socket.to(`device_${payload.target}`).emit('ICE_CANDIDATE', {
        sender: socket.id,
        candidate: payload.candidate
      });
      socket.to(payload.target).emit('ICE_CANDIDATE', {
        sender: socket.id,
        candidate: payload.candidate
      });
    });

    // 6. End Session
    socket.on('END_SESSION', (payload: { targetDeviceId: string }) => {
      console.log(`[Socket] END_SESSION for ${payload.targetDeviceId}`);
      io.to(`device_${payload.targetDeviceId}`).emit('END_SESSION', {
        adminSocketId: socket.id
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      const device = store.setDeviceOffline(socket.id);
      if (device) {
        io.to('admin_room').emit('DEVICE_UPDATED', device);
      }
    });
  });
}
