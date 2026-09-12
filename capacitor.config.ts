import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.kaseyriver.life',
  appName: 'Gym-Life',
  webDir: 'dist',
  server: {
    // Uncomment and point at your machine's LAN IP while developing to get
    // live-reload on the installed phone app (same wifi network required):
    // url: 'http://192.168.1.23:5173',
    // cleartext: true,
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
  },
}

export default config
