export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: true,
  modules: ['@sidebase/nuxt-session'],
  session: {
    name: 'nuxt-session',
    password: process.env.SESSION_SECRET || 'your-session-secret-key-must-be-at-least-32-characters-long',
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24시간
      httpOnly: true,
      path: '/'
    }
  },
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key-must-be-at-least-32-characters-long-for-security',
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-key-must-be-at-least-32-characters-long',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    naverClientId: process.env.NAVER_CLIENT_ID || '',
    naverClientSecret: process.env.NAVER_CLIENT_SECRET || '',
    public: {
      apiBase: process.env.API_BASE || '/api'
    }
  },
  alias: {
    '#server': './server', // 서버 코드 전용 alias
    '#utils': './server/utils' // utils 폴더 alias
  }
})
