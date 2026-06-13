export interface Device {
  userId: string;
  deviceId: string;
  platform?: string;
  status: 'online' | 'offline';
  lastSeen: Date;
  socketId?: string;
}

export interface Session {
  id: string;
  adminId: string;
  deviceId: string; // The target device
  startedAt: Date;
  endedAt?: Date;
  status: 'idle' | 'active' | 'ended';
}

export interface Admin {
  id: string;
  username: string;
}

// In-Memory Data Store
class MemoryStore {
  public devices: Map<string, Device> = new Map();
  public sessions: Map<string, Session> = new Map();
  public admins: Map<string, Admin> = new Map();

  // Socket ID to Device ID mapping for easy lookup on disconnect
  public socketIdToDeviceId: Map<string, string> = new Map();

  constructor() {
    // Seed an admin for testing
    this.admins.set('admin1', { id: 'admin1', username: 'admin' });
  }

  getDevice(deviceId: string) {
    return this.devices.get(deviceId);
  }

  registerDevice(deviceId: string, socketId: string, platform?: string) {
    const device: Device = {
      userId: deviceId, // In headless mode, user ID is typically the device ID
      deviceId,
      platform,
      status: 'online',
      lastSeen: new Date(),
      socketId,
    };
    this.devices.set(deviceId, device);
    this.socketIdToDeviceId.set(socketId, deviceId);
    return device;
  }

  setDeviceOffline(socketId: string) {
    const deviceId = this.socketIdToDeviceId.get(socketId);
    if (deviceId) {
      const device = this.devices.get(deviceId);
      if (device) {
        device.status = 'offline';
        device.lastSeen = new Date();
        device.socketId = undefined;
        this.devices.set(deviceId, device);
      }
      this.socketIdToDeviceId.delete(socketId);
      return device;
    }
    return null;
  }

  getAllDevices() {
    return Array.from(this.devices.values());
  }

  createSession(adminId: string, deviceId: string) {
    const sessionId = `session_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const session: Session = {
      id: sessionId,
      adminId,
      deviceId,
      startedAt: new Date(),
      status: 'idle',
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  endSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'ended';
      session.endedAt = new Date();
      this.sessions.set(sessionId, session);
    }
    return session;
  }
}

export const store = new MemoryStore();
