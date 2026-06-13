import { RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, mediaDevices } from 'react-native-webrtc';
import { socket } from './socket';

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
  ]
};

export let peerConnection: RTCPeerConnection | null = null;
export let localStream: any = null;

export const initCamera = async () => {
  if (localStream) return localStream;
  try {
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: {
        width: 1280,
        height: 720,
        frameRate: 30,
        facingMode: 'environment' // back camera by default
      }
    });
    localStream = stream;
    return stream;
  } catch (error) {
    console.error('Error accessing media devices:', error);
  }
};

export const setupWebRTCListeners = () => {
  socket.on('START_SESSION', async (payload: { sessionId: string, adminSocketId: string }) => {
    console.log('Received START_SESSION from', payload.adminSocketId);
    
    if (!localStream) {
      await initCamera();
    }
    
    peerConnection = new RTCPeerConnection(configuration);

    if (localStream) {
      localStream.getTracks().forEach((track: any) => {
        peerConnection?.addTrack(track, localStream);
      });
    }

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ICE_CANDIDATE', { target: payload.adminSocketId, candidate: event.candidate });
      }
    };

    const offer = await peerConnection.createOffer({});
    await peerConnection.setLocalDescription(offer);
    socket.emit('OFFER', { target: payload.adminSocketId, sdp: offer });
  });

  socket.on('ANSWER', async (payload: { sender: string, sdp: any }) => {
    console.log('Received ANSWER');
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    }
  });

  socket.on('ICE_CANDIDATE', async (payload: { sender: string, candidate: any }) => {
    if (peerConnection && payload.candidate) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate));
    }
  });

  socket.on('END_SESSION', () => {
    console.log('Received END_SESSION');
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
  });
};
