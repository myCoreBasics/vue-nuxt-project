export default defineEventHandler(async (event) => {
  // 사용자 정보는 auth 미들웨어를 통해 이미 확인됨
  const user = event.context.user

  console.log('Profile API - User from session:', JSON.stringify(user, null, 2)); // 세션 사용자 정보 상세 디버깅

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '인증이 필요합니다.'
    })
  }

  try {
    // 세션에 있는 사용자 정보 반환 (DB 조회 없이)
    const userProfile = {
      userid: user.userid,
      name: user.name,
      email: user.email || null,
      provider: user.provider || 'local',
      loginTime: user.loginTime
    }

    console.log('Profile API - Email value being returned:', userProfile.email); // 반환할 이메일 값 specifically 확인
    console.log('Profile API - Returning user profile:', JSON.stringify(userProfile, null, 2)); // 디버깅용

    return {
      success: true,
      user: userProfile
    }

  } catch (error) {
    console.error('프로필 정보 조회 실패:', error)
    throw createError({
      statusCode: 500,
      message: '프로필 정보 조회에 실패했습니다.'
    })
  }
})
