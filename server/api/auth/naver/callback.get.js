import { generateToken } from '../../../utils/jwt'

export default defineEventHandler(async (event) => {
  const { code, state } = getQuery(event)
  const config = useRuntimeConfig()

  if (!code) {
    throw createError({
      statusCode: 400,
      message: '인증 코드가 없습니다.'
    })
  }

  try {
    // Access token 요청
    const tokenResponse = await $fetch('https://nid.naver.com/oauth2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.naverClientId,
        client_secret: config.naverClientSecret,
        code,
        redirect_uri: `${getRequestURL(event).origin}/api/auth/naver/callback`,
        state: state || ''
      }).toString()
    })

    // 사용자 정보 요청
    const userInfo = await $fetch('https://openapi.naver.com/v1/nid/me', {
      headers: {
        Authorization: `Bearer ${tokenResponse.access_token}`
      }
    })

    console.log('Naver userInfo:', JSON.stringify(userInfo, null, 2))

    if (userInfo.resultcode !== '00') {
      throw new Error('Naver 사용자 정보 조회 실패')
    }

    // 사용자 정보 처리
    const user = {
      userid: `naver_${userInfo.response.id}`,
      name: userInfo.response.name || userInfo.response.nickname || userInfo.response.email?.split('@')[0] || 'Naver User',
      email: userInfo.response.email,
      provider: 'naver'
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
    console.error('Naver OAuth error:', error)
    throw createError({
      statusCode: 500,
      message: 'Naver 로그인에 실패했습니다.'
    })
  }
})
