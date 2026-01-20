import { getDbPool } from '#utils/db.js'
import { logCommentActivity } from '#utils/activityLogger.js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { commentId, userid } = body

    if (!commentId || !userid) {
      throw createError({
        statusCode: 400,
        message: '필수 정보가 누락되었습니다.'
      })
    }

    const pool = getDbPool()

    // 이미 좋아요를 눌렀는지 확인
    const [existingLike] = await pool.query(
      'SELECT * FROM laon_tbl_likes WHERE comment_id = ? AND userid = ?',
      [commentId, userid]
    )

    if (existingLike.length > 0) {
      // 좋아요 취소
      await pool.query(
        'DELETE FROM laon_tbl_likes WHERE comment_id = ? AND userid = ?',
        [commentId, userid]
      )

      return {
        success: true,
        liked: false,
        message: '좋아요를 취소했습니다.'
      }
    } else {
      // 좋아요 추가
      await pool.query(
        'INSERT INTO laon_tbl_likes (comment_id, userid, regdate) VALUES (?, ?, NOW())',
        [commentId, userid]
      )

      // 활동 기록
      const [commentInfo] = await pool.query(
        'SELECT board_id FROM laon_tbl_comments WHERE comment_id = ?',
        [commentId]
      )

      if (commentInfo.length > 0) {
        await logCommentActivity(userid, 'like', commentInfo[0].board_id, commentId)
      }

      return {
        success: true,
        liked: true,
        message: '좋아요를 눌렀습니다.'
      }
    }

  } catch (error) {
    console.error('댓글 좋아요 실패:', error)
    throw createError({
      statusCode: 500,
      message: '댓글 좋아요 처리에 실패했습니다.'
    })
  }
})
