import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rafiqalsiyam.app',
  appName: 'رفيق الصيام',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_rafiq',
      iconColor: '#1d8f68'
    }
  }
};

export default config;
