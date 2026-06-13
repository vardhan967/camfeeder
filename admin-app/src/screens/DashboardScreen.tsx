import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useStore } from '../store/useStore';
import { socket, initSocket } from '../services/socket';
import { useNavigation } from '@react-navigation/native';

export default function DashboardScreen() {
  const devices = useStore((state) => state.devices);
  const setDevices = useStore((state) => state.setDevices);
  const setToken = useStore((state) => state.setToken);
  const navigation = useNavigation<any>();

  useEffect(() => {
    initSocket();

    socket.on('ALL_DEVICES', (data) => {
      setDevices(data);
    });

    socket.on('DEVICE_UPDATED', (device) => {
      setDevices(useStore.getState().devices.map(d => d.deviceId === device.deviceId ? device : d));
      // If it's a new device not in the array, add it
      const exists = useStore.getState().devices.find(d => d.deviceId === device.deviceId);
      if (!exists) {
        setDevices([...useStore.getState().devices, device]);
      }
    });

    return () => {
      socket.off('ALL_DEVICES');
      socket.off('DEVICE_UPDATED');
    };
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.deviceCard}>
      <View>
        <Text style={styles.deviceId}>ID: {item.deviceId}</Text>
        <Text style={item.status === 'online' ? styles.online : styles.offline}>
          {item.status.toUpperCase()}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.button, item.status !== 'online' && styles.buttonDisabled]}
        disabled={item.status !== 'online'}
        onPress={() => navigation.navigate('LiveView', { deviceId: item.deviceId })}
      >
        <Text style={styles.buttonText}>View Live</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <TouchableOpacity onPress={() => setToken(null)}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={devices}
        keyExtractor={(item) => item.deviceId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No devices registered yet.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f4f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e4e4e7' },
  title: { fontSize: 20, fontWeight: 'bold' },
  logout: { color: '#ef4444', fontWeight: 'bold' },
  list: { padding: 16 },
  deviceCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  deviceId: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  online: { color: '#22c55e', fontWeight: 'bold', fontSize: 12 },
  offline: { color: '#71717a', fontWeight: 'bold', fontSize: 12 },
  button: { backgroundColor: '#0ea5e9', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6 },
  buttonDisabled: { backgroundColor: '#cbd5e1' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#71717a' },
});
