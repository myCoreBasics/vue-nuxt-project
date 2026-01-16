import { verifyToken } from '../utils/jwt';

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event).pathname
  
  // 인증이 필요없는 API 경로들
  const publicPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/auth/google',
    '/api/auth/callback/google',
    '/api/auth/naver',
    '/api/auth/callback/naver'
  ];
  
  // public 경로면 인증 체크 안 함
  if (publicPaths.some(path => url.startsWith(path))) {
    return;
  }
  
  // API 요청이 아니면 인증 체크 안 함
  if (!url.startsWith('/api/')) {
    return;
  }
  
  // 여기부터는 인증이 필요한 API
  let user = null;
  
  // 1. Session에서 사용자 정보 확인 (우선)
  try {
    const session = await useSession(event, {
      password: useRuntimeConfig().sessionSecret
    });
    
    if (session.data.user) {
      user = session.data.user;
      console.log(`[${url}] : Session 확인 - ${user.userid}`);
    }
  } catch (error) {
    console.log('Session error:', error.message);
  }
  
  if (!user) {
    // 2. Session이 없으면 JWT 토큰 확인 (보조)
    const token = getCookie(event, 'auth_token');
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        user = decoded;
        // JWT로 인증된 경우 Session에도 저장
        try {
          const session = await useSession(event, {
            password: useRuntimeConfig().sessionSecret
          });
          session.data.user = user;
          console.log(`[${url}] : JWT 확인 - ${user.userid}`);
        } catch (error) {
          console.log('Session save error:', error.message);
        }
      }
    }
  }
  
  if (!user) {
    throw createError({
      statusCode: 401,
      message: '인증이 필요합니다.'
    });
  }
  
  // 사용자 정보를 event context에 저장
  event.context.user = user;
});