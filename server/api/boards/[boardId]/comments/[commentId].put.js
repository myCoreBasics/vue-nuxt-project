import { getDbPool } from '#utils/db.js'

export default defineEventHandler(async (event) => {
  try {
    const commentId = getRouterParam(event, 'commentId')
    const body = await readBody(event)
    const { userid, content } = body

    if (!commentId || !userid || !content) {
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
        message: '댓글을 수정할 권한이 없습니다.'
      })
    }

    // 댓글 수정
    await pool.query(`
      UPDATE laon_tbl_comments 
      SET comments_content = ?, updated_at = NOW()
      WHERE comment_id = ? AND userid = ?
    `, [content, commentId, userid])

    // 수정된 댓글 정보 반환
    const [updatedComment] = await pool.query(`
      SELECT 
        c.comment_id,
        c.board_id,
        c.parent_id,
        c.userid,
        u.name as writer,
        c.comments_content as content,
        c.regdate as regDate,
        c.updated_at,
        u.name as user_name
      FROM laon_tbl_comments c
      LEFT JOIN laon_tbl_user u ON c.userid = u.userid
      WHERE c.comment_id = ?
    `, [commentId])

    return {
      success: true,
      comment: updatedComment[0]
    }

  } catch (error) {
    console.error('댓글 수정 실패:', error)
    throw createError({
      statusCode: 500,
      message: '댓글 수정에 실패했습니다.'
    })
  }
})
