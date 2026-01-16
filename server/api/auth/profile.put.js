export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '인증이 필요합니다.'
    })
  }

  // 필수 필드 확인
  if (!body.name) {
    throw createError({
      statusCode: 400,
      message: '이름은 필수 항목입니다.'
    })
  }

  // 소셜 로그인 사용자는 이메일 수정 불가
  if (user.provider !== 'local' && body.email && body.email !== (user.email || '')) {
    throw createError({
      statusCode: 400,
      message: '소셜 로그인 사용자는 이메일을 수정할 수 없습니다.'
    })
  }

  try {
    // TODO: 데이터베이스에 사용자 정보 업데이트
    // 현재는 세션 정보만 업데이트
    
    // 세션 정보 업데이트
    const session = await useSession(event, {
      password: useRuntimeConfig().sessionSecret
    })
    
    session.data.user = {
      ...session.data.user,
      name: body.name,
      email: body.email || session.data.user.email,
      updatedAt: new Date()
    }

    return {
      success: true,
      message: '회원정보가 성공적으로 수정되었습니다.',
      user: session.data.user
    }

  } catch (error) {
    console.error('프로필 업데이트 실패:', error)
    throw createError({
      statusCode: 500,
      message: '회원정보 수정에 실패했습니다.'
    })
  }
})
