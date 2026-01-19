import { generateToken } from '../../../utils/jwt'
import { getDbPool } from '../../../utils/db'

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
        redirect_uri: `${getRequestURL(event).origin}/api/auth/callback/naver`,
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

    // 사용자 정보 구성
    const user = {
      userid: userInfo.response.email?.split('@')[0], // 이메일 앞부분을 아이디로 사용
      name: userInfo.response.name || userInfo.response.nickname || userInfo.response.email?.split('@')[0] || 'Naver User',
      email: userInfo.response.email,
      provider: 'naver'
    }

    // DB에 사용자 정보 저장 또는 업데이트
    const pool = getDbPool()
    try {
      // 기존 사용자 확인
      const [existingUsers] = await pool.query(
        'SELECT userid, status FROM laon_tbl_user WHERE userid = ?',
        [user.userid]
      )
      
      if (existingUsers.length === 0) {
        // 신규 사용자 자동 가입 (ACTIVE 상태로)
        // 소셜 로그인 사용자를 위한 임시 비밀번호 생성
        const tempPassword = 'social_' + Date.now() + Math.random().toString(36).substring(2)
        
        await pool.query(
          'INSERT INTO laon_tbl_user (userid, name, email, password, provider, status, regdate) VALUES (?, ?, ?, ?, ?, ?, NOW())',
          [user.userid, user.name, user.email, tempPassword, user.provider, 'ACTIVE']
        )
        console.log('Naver 신규 사용자 자동 가입 완료:', user.userid)
      } else {
        const existingUser = existingUsers[0]
        if (existingUser.status === 'ACTIVE') {
          // 기존 활성 사용자: 정보 업데이트
          await pool.query(
            'UPDATE laon_tbl_user SET name = ?, email = ?, updateat = NOW() WHERE userid = ?',
            [user.name, user.email, user.userid]
          )
          console.log('Naver 기존 사용자 정보 업데이트:', user.userid)
        } else {
          // PENDING 상태 사용자: ACTIVE로 전환
          await pool.query(
            'UPDATE laon_tbl_user SET name = ?, email = ?, status = ?, updateat = NOW() WHERE userid = ?',
            [user.name, user.email, 'ACTIVE', user.userid]
          )
          console.log('Naver PENDING 사용자 ACTIVE로 전환:', user.userid)
        }
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

    return sendRedirect(event, '/')

  } catch (error) {
    console.error('Naver OAuth error:', error)
    throw createError({
      statusCode: 500,
      message: 'Naver 로그인에 실패했습니다.'
    })
  }
})
