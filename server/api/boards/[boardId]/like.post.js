import { getDbPool } from '#utils/db.js'
import { logLikeActivity } from '#utils/activityLogger.js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const boardId = parseInt(getRouterParam(event, 'boardId'))
    const { userid } = body

    if (!boardId || !userid) {
      throw createError({
        statusCode: 400,
        message: '필수 정보가 누락되었습니다.'
      })
    }

    const pool = getDbPool()

    // 이미 좋아요를 눌렀는지 확인
    const [existingLike] = await pool.query(
      'SELECT * FROM laon_tbl_likes WHERE board_id = ? AND userid = ?',
      [boardId, userid]
    )

    if (existingLike.length > 0) {
      // 좋아요 취소
      await pool.query(
        'DELETE FROM laon_tbl_likes WHERE board_id = ? AND userid = ?',
        [boardId, userid]
      )

      // 활동 내역에서도 삭제
      await pool.query(
        'DELETE FROM laon_tbl_activities WHERE activity_type = ? AND board_id = ? AND userid = ? AND comment_id IS NULL',
        ['like', boardId, userid]
      )

      // 게시글 좋아요 수 감소
      await pool.query(
        'UPDATE laon_tbl_board SET like_count = COALESCE(like_count, 0) - 1 WHERE bno = ? AND COALESCE(like_count, 0) > 0',
        [boardId]
      )

      return {
        success: true,
        liked: false,
        message: '좋아요를 취소했습니다.'
      }
    } else {
      // 좋아요 추가
      const [likeResult] = await pool.query(
        'INSERT INTO laon_tbl_likes (board_id, userid, regdate) VALUES (?, ?, NOW())',
        [boardId, userid]
      )
      const likeId = likeResult.insertId

      // 게시글 좋아요 수 증가
      await pool.query(
        'UPDATE laon_tbl_board SET like_count = COALESCE(like_count, 0) + 1 WHERE bno = ?',
        [boardId]
      )

      // 활동 기록
      await logLikeActivity(userid, boardId, null, likeId)

      return {
        success: true,
        liked: true,
        message: '좋아요를 눌렀습니다.'
      }
    }

  } catch (error) {
    console.error('게시글 좋아요 실패:', error)
    throw createError({
      statusCode: 500,
      message: '좋아요 처리에 실패했습니다.'
    })
  }
})
