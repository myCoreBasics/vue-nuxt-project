import { getDbPool } from '#utils/db.js'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const boardId = parseInt(getRouterParam(event, 'boardId'))
    const { userid } = query

    if (!boardId || !userid) {
      throw createError({
        statusCode: 400,
        message: '필수 정보가 누락되었습니다.'
      })
    }

    const pool = getDbPool()

    // 사용자의 좋아요 여부 확인
    const [existingLike] = await pool.query(
      'SELECT * FROM laon_tbl_likes WHERE board_id = ? AND userid = ?',
      [boardId, userid]
    )

    return {
      success: true,
      liked: existingLike.length > 0
    }

  } catch (error) {
    console.error('좋아요 상태 확인 실패:', error)
    throw createError({
      statusCode: 500,
      message: '좋아요 상태 확인에 실패했습니다.'
    })
  }
})
