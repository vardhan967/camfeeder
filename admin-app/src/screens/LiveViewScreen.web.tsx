import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { socket } from '../services/socket';
import { useRoute, useNavigation } from '@react-navigation/native';

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
  ]
};

// Web-compatible RTCView using standard HTML5 video
const WebRTCView = ({ stream, style, objectFit }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      style={{ width: '100%', height: '100%', objectFit }}
    />
  );
};

export default function LiveViewScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { deviceId } = route.params;

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState('Connecting...');
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    startSession();

    return () => {
      endSession();
    };
  }, []);

  const startSession = () => {
    // Use standard browser RTCPeerConnection
    peerConnection.current = new window.RTCPeerConnection(configuration);

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ICE_CANDIDATE', { target: deviceId, candidate: event.candidate });
      }
    };

    peerConnection.current.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        setStatus('Live');
      }
    };

    peerConnection.current.onconnectionstatechange = (e) => {
      setStatus(peerConnection.current?.connectionState || 'Unknown');
    };

    // Listen for socket events
    socket.on('OFFER', async (payload) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(new window.RTCSessionDescription(payload.sdp));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit('ANSWER', { target: deviceId, sdp: answer });
    });

    socket.on('ICE_CANDIDATE', async (payload) => {
      if (payload.candidate && peerConnection.current) {
        await peerConnection.current.addIceCandidate(new window.RTCIceCandidate(payload.candidate));
      }
    });

    // Notify server to start session
    socket.emit('START_SESSION', { targetDeviceId: deviceId });
  };

  const endSession = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    socket.emit('END_SESSION', { targetDeviceId: deviceId });
    socket.off('OFFER');
    socket.off('ICE_CANDIDATE');
    setRemoteStream(null);
  };

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Device: {deviceId}</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.videoContainer}>
        {remoteStream ? (
          <WebRTCView
            stream={remoteStream}
            style={styles.video}
            objectFit="cover"
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0ea5e9" />
            <Text style={styles.statusText}>{status}</Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.endButton} onPress={goBack}>
          <Text style={styles.endButtonText}>End Session</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#18181b' },
  backButton: { padding: 8 },
  backButtonText: { color: '#0ea5e9', fontSize: 16, fontWeight: 'bold' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  videoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  video: { width: '100%', height: '100%' },
  loadingContainer: { alignItems: 'center' },
  statusText: { color: '#fff', marginTop: 12, fontSize: 16 },
  controls: { padding: 24, paddingBottom: 40, backgroundColor: '#18181b', alignItems: 'center' },
  endButton: { backgroundColor: '#ef4444', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 8, width: '100%', alignItems: 'center' },
  endButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
