import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.pilates.app',
  appName: 'Pilates Studio',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    useLegacyBridge: false,
    targetSdk: 36,
    minSdk: 24,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#7c3aed', // Roxo Pilates
    },
    FirebaseMessaging: {
      senderId: 'YOUR_SENDER_ID', // será preenchido
    },
  },
};

export default config;
