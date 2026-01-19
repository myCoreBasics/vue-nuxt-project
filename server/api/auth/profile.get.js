import { getDbPool } from '../../utils/db'

export default defineEventHandler(async (event) => {
  // 사용자 정보는 auth 미들웨어를 통해 이미 확인됨
  const user = event.context.user

  console.log('Profile API - User from context:', JSON.stringify(user, null, 2))

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '인증이 필요합니다.'
    })
  }

  try {
    // DB에서 최신 사용자 정보 직접 조회
    const pool = getDbPool()
    const [rows] = await pool.query(
      'SELECT userid, name, email, job, hobbies, regdate FROM laon_tbl_user WHERE userid = ?',
      [user.userid]
    )

    if (rows.length === 0) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    const dbUser = rows[0]
    console.log('Profile API - User from DB:', JSON.stringify(dbUser, null, 2))

    const userProfile = {
      userid: dbUser.userid,
      name: dbUser.name,
      email: dbUser.email || null,
      job: dbUser.job || null,
      hobbies: dbUser.hobbies || null,
      regdate: dbUser.regdate,
      provider: 'local' // 기본값으로 설정
    }

    console.log('Profile API - Email value being returned:', userProfile.email)
    console.log('Profile API - Returning user profile:', JSON.stringify(userProfile, null, 2))

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
