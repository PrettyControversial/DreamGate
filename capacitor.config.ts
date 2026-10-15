import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ninebynine.psyra',
  appName: 'Dream State',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'never'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
