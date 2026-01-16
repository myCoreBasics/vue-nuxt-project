import { generateToken } from '../../../utils/jwt'

export default defineEventHandler(async (event) => {
  const { code } = getQuery(event)
  const config = useRuntimeConfig()

  if (!code) {
    throw createError({
      statusCode: 400,
      message: '인증 코드가 없습니다.'
    })
  }

  try {
    // Access token 요청
    const tokenResponse = await $fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: {
        client_id: config.googleClientId,
        client_secret: config.googleClientSecret,
        code,
        redirect_uri: `${getRequestURL(event).origin}/api/auth/google/callback`,
        grant_type: 'authorization_code'
      }
    })

    // 사용자 정보 요청
    const userInfo = await $fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenResponse.access_token}`
      }
    })

    // 사용자 정보 처리
    const user = {
      userid: `google_${userInfo.id}`,
      name: userInfo.name || userInfo.email?.split('@')[0] || 'Google User',
      email: userInfo.email,
      provider: 'google'
    }

    // JWT 토큰 생성
    const token = generateToken(user)

    // 쿠키에 토큰 저장
    setCookie(event, 'auth_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24,
      path: '/'
    })

    // Session에 사용자 정보 저장
    await useSession(event, {
      password: config.sessionSecret
    }).then(session => {
      session.data.user = {
        ...user,
        loginTime: new Date()
      }
    })

    // 사용자 정보 쿠키 저장
    setCookie(event, 'user_name', user.name, {
      maxAge: 60 * 60 * 24,
      path: '/'
    })

    setCookie(event, 'user_id', user.userid, {
      maxAge: 60 * 60 * 24,
      path: '/'
    })

    return sendRedirect(event, '/board/list')

  } catch (error) {
    console.error('Google OAuth error:', error)
    throw createError({
      statusCode: 500,
      message: 'Google 로그인에 실패했습니다.'
    })
  }
})
