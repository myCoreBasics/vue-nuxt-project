import { getDbPool } from '../../utils/db'
import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const body = await readBody(event)

  console.log('Profile PUT - User:', JSON.stringify(user, null, 2))
  console.log('Profile PUT - Body:', JSON.stringify(body, null, 2))

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '인증이 필요합니다.'
    })
  }

  if (!body.name) {
    throw createError({
      statusCode: 400,
      message: '이름은 필수 항목입니다.'
    })
  }

  const pool = getDbPool()
  const conn = await pool.getConnection()

  console.log('DB connection established')

  try {
    await conn.beginTransaction()

    const updateFields = []
    const updateValues = []

    updateFields.push('name = ?')
    updateValues.push(body.name)

    // 이메일이 있고 변경된 경우에만 업데이트
    if (body.email && body.email !== user.email) {
      updateFields.push('email = ?')
      updateValues.push(body.email)
      console.log('Email update detected:', body.email, 'vs', user.email)
    }

    // 비밀번호가 있는 경우에만 업데이트
    if (body.password && body.password.trim()) {
      const hashedPassword = await bcrypt.hash(body.password, 10)
      updateFields.push('password = ?')
      updateValues.push(hashedPassword)
      console.log('Password update detected')
    }

    // 직업이 있는 경우 업데이트
    if (body.job && body.job.trim()) {
      updateFields.push('job = ?')
      updateValues.push(body.job)
      console.log('Job update detected:', body.job)
    }

    // 취미가 있는 경우 업데이트
    if (body.hobbies && body.hobbies.trim()) {
      updateFields.push('hobbies = ?')
      updateValues.push(body.hobbies)
      console.log('Hobbies update detected:', body.hobbies)
    }

    updateFields.push('updatedat = NOW()')
    updateValues.push(user.userid)

    const updateQuery = `
      UPDATE laon_tbl_user
      SET ${updateFields.join(', ')}
      WHERE userid = ?
    `

    console.log('Update query:', updateQuery)
    console.log('Update values:', updateValues)

    const [result] = await conn.query(updateQuery, updateValues)

    console.log('Update result:', result)

    if (result.affectedRows === 0) {
      throw new Error('DB update failed')
    }

    await conn.commit()
    console.log('Transaction committed')

    // 세션 정보 업데이트
    const session = await useSession(event, {
      password: useRuntimeConfig().sessionSecret
    })

    session.data.user = {
      ...session.data.user,
      name: body.name,
      email: body.email ?? session.data.user.email,
      updatedAt: new Date()
    }

    console.log('Profile updated in session:', session.data.user)

    return {
      success: true,
      message: '회원정보가 성공적으로 수정되었습니다.',
      user: session.data.user
    }

  } catch (err) {
    await conn.rollback()
    console.error('프로필 업데이트 실패:', err)

    throw createError({
      statusCode: 500,
      message: '회원정보 수정에 실패했습니다.'
    })
  } finally {
    conn.release()
  }
})
