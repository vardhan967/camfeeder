import React, { useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { initSocket } from './src/services/socket';
import { useStore } from './src/store/useStore';
import { initCamera } from './src/services/webrtc';

export default function App() {
  const deviceId = useStore((state) => state.deviceId);
  const status = useStore((state) => state.status);

  useEffect(() => {
    // Initialize Camera Permission early
    initCamera();

    // Init Socket
    initSocket();

  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Monitor Node</Text>
        <Text style={styles.subtitle}>This device is currently running as a headless monitoring node.</Text>
        
        <View style={styles.card}>
          <Text style={styles.label}>Device ID:</Text>
          <Text style={styles.value}>{deviceId || 'Generating...'}</Text>
          
          <Text style={styles.label}>Status:</Text>
          <Text style={[styles.value, status.includes('Connected') || status.includes('Ready') ? styles.online : null]}>
            {status}
          </Text>
        </View>

        <Text style={styles.footer}>App is actively running.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1, justifyContent: 'center', padding: 24, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#a1a1aa', textAlign: 'center', marginBottom: 32 },
  card: { backgroundColor: '#18181b', padding: 24, borderRadius: 12, width: '100%' },
  label: { color: '#71717a', fontSize: 14, marginBottom: 4 },
  value: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 16 },
  online: { color: '#22c55e' },
  footer: { color: '#3f3f46', position: 'absolute', bottom: 40 },
});
