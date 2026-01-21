import { getDbPool } from '#utils/db.js'
import { logCommentActivity } from '#utils/activityLogger.js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const boardId = parseInt(getRouterParam(event, 'boardId'))
    const { parent_id, userid, content } = body

    if (!boardId || !userid || !content) {
      throw createError({
        statusCode: 400,
        message: '필수 정보가 누락되었습니다.'
      })
    }

    const pool = getDbPool()

    // 댓글 작성
    const [result] = await pool.query(`
      INSERT INTO laon_tbl_comments 
      (board_id, parent_id, userid, comments_content, regdate, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `, [boardId, parent_id || null, userid, content])

    const commentId = result.insertId

    // 활동 기록
    await logCommentActivity(userid, boardId, commentId)

    // 작성된 댓글 정보 반환
    const [newComment] = await pool.query(`
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
      comment: newComment[0]
    }

  } catch (error) {
    console.error('댓글 작성 실패:', error)
    throw createError({
      statusCode: 500,
      message: '댓글 작성에 실패했습니다.'
    })
  }
})
