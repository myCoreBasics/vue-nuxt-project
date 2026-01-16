import { generateToken } from '../../../utils/jwt'
import { getDbPool } from '../../../utils/db'

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
        redirect_uri: `${getRequestURL(event).origin}/api/auth/callback/google`,
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

    // DB에 사용자 정보 저장 또는 업데이트
    const pool = getDbPool()
    try {
      // 기존 사용자 확인
      const [existingUsers] = await pool.query(
        'SELECT userid FROM laon_tbl_user WHERE userid = ?',
        [user.userid]
      )
      
      if (existingUsers.length === 0) {
        // 신규 사용자 저장
        await pool.query(
          'INSERT INTO laon_tbl_user (userid, name, email, provider, created_at) VALUES (?, ?, ?, ?, NOW())',
          [user.userid, user.name, user.email, user.provider]
        )
        console.log('Google 신규 사용자 저장:', user.userid)
      } else {
        // 기존 사용자 정보 업데이트
        await pool.query(
          'UPDATE laon_tbl_user SET name = ?, email = ?, updated_at = NOW() WHERE userid = ?',
          [user.name, user.email, user.userid]
        )
        console.log('Google 사용자 정보 업데이트:', user.userid)
      }
    } catch (dbError) {
      console.error('DB 저장 실패:', dbError)
      // DB 실패해도 세션은 계속 진행
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
