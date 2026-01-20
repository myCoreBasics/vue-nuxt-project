import { getDbPool } from '#utils/db.js'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const boardId = parseInt(getRouterParam(event, 'boardId'))
    const commentId = parseInt(getRouterParam(event, 'commentId'))
    const { userid } = query

    if (!boardId || !commentId || !userid) {
      throw createError({
        statusCode: 400,
        message: '필수 정보가 누락되었습니다.'
      })
    }

    const pool = getDbPool()

    // 사용자의 댓글 좋아요 여부 확인
    const [existingLike] = await pool.query(
      'SELECT * FROM laon_tbl_likes WHERE comment_id = ? AND userid = ?',
      [commentId, userid]
    )

    return {
      success: true,
      liked: existingLike.length > 0
    }

  } catch (error) {
    console.error('댓글 좋아요 상태 확인 실패:', error)
    throw createError({
      statusCode: 500,
      message: '댓글 좋아요 상태 확인에 실패했습니다.'
    })
  }
})
