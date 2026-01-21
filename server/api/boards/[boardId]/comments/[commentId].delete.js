import { getDbPool } from '#utils/db.js'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const commentId = getRouterParam(event, 'commentId')
    const { userid } = query

    if (!commentId || !userid) {
      throw createError({
        statusCode: 400,
        message: '필수 정보가 누락되었습니다.'
      })
    }

    const pool = getDbPool()

    // 댓글 작성자 확인
    const [commentCheck] = await pool.query(
      'SELECT userid FROM laon_tbl_comments WHERE comment_id = ?',
      [commentId]
    )

    if (commentCheck.length === 0 || commentCheck[0].userid !== userid) {
      throw createError({
        statusCode: 403,
        message: '댓글을 삭제할 권한이 없습니다.'
      })
    }

    // 대댓글이 있는지 확인
    const [replyCheck] = await pool.query(
      'SELECT COUNT(*) as count FROM laon_tbl_comments WHERE parent_id = ?',
      [commentId]
    )

    if (replyCheck[0].count > 0) {
      // 대댓글이 있으면 내용만 삭제
      await pool.query(`
        UPDATE laon_tbl_comments 
        SET content = '삭제된 댓글입니다.', updated_at = NOW()
        WHERE comment_id = ? AND userid = ?
      `, [commentId, userid])
    } else {
      // 대댓글이 없으면 완전 삭제
      await pool.query(
        'DELETE FROM laon_tbl_comments WHERE comment_id = ? AND userid = ?',
        [commentId, userid]
      )
    }

    // 관련 좋아요 삭제
    await pool.query(
      'DELETE FROM laon_tbl_likes WHERE comment_id = ?',
      [commentId]
    )

    // 활동 내역에서도 삭제
    await pool.query(
      'DELETE FROM laon_tbl_activities WHERE activity_type = ? AND comment_id = ? AND userid = ?',
      ['comment', commentId, userid]
    )

    return {
      success: true,
      message: '댓글이 삭제되었습니다.'
    }

  } catch (error) {
    console.error('댓글 삭제 실패:', error)
    throw createError({
      statusCode: 500,
      message: '댓글 삭제에 실패했습니다.'
    })
  }
})
