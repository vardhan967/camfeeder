import { create } from 'zustand';

export interface Device {
  deviceId: string;
  userId: string;
  status: string;
  lastSeen: string;
}

interface AdminState {
  token: string | null;
  setToken: (token: string | null) => void;
  devices: Device[];
  setDevices: (devices: Device[]) => void;
}

export const useStore = create<AdminState>((set) => ({
  token: null,
  setToken: (token) => set({ token }),
  devices: [],
  setDevices: (devices) => set({ devices }),
}));
