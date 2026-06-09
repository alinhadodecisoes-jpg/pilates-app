import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.daimach.movement',
  appName: 'Daimach.Movement',
  // webDir: 'out',  // para export estático
  // server.url: carregar a versão hospedada (mais simples, atualiza sozinha com deploy)
  server: {
    url: 'https://daimach.com.br/pilates', // TODO: atualizar para a URL de produção real
    androidScheme: 'https',
    cleartext: false,
    allowNavigation: [
      '*.supabase.co',
      '*.vercel.app',
      'daimach.com.br',
    ],
  },
  android: {
    allowMixedContent: false,
    useLegacyBridge: false,
    backgroundColor: '#0f172a', // slate-900 (cor de fundo do app)
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    FirebaseMessaging: {
      // TODO: Configurar após criar projeto no Firebase Console
      // Baixar google-services.json e colocar em android/app/
      senderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
    },
  },
};

export default config;
