import { create } from 'zustand';

interface UserState {
  deviceId: string | null;
  setDeviceId: (id: string) => void;
  status: string;
  setStatus: (status: string) => void;
  isStreaming: boolean;
  setIsStreaming: (isStreaming: boolean) => void;
}

export const useStore = create<UserState>((set) => ({
  deviceId: null,
  setDeviceId: (id) => set({ deviceId: id }),
  status: 'Initializing...',
  setStatus: (status) => set({ status }),
  isStreaming: false,
  setIsStreaming: (isStreaming) => set({ isStreaming }),
}));
