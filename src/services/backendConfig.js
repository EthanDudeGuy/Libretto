import { Platform } from 'react-native';

// Shared by every service that talks to the FastAPI backend, so the URL
// logic lives in exactly one place.
export const BACKEND_BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8001' // Android Emulator (special alias to the host machine)
    : 'http://127.0.0.1:8001'; // iOS Simulator + web (both reach the host directly)
