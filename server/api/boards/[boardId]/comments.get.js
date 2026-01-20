import { getDbPool } from '#utils/db.js'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const boardId = parseInt(getRouterParam(event, 'boardId'))
    const page = parseInt(query.page) || 1
    const limit = parseInt(query.limit) || 10
    const offset = (page - 1) * limit

    if (!boardId) {
      throw createError({
        statusCode: 400,
        message: '게시글 ID가 필요합니다.'
      })
    }

    const pool = getDbPool()

    // 댓글 목록 조회 (대댓글 포함)
    const [comments] = await pool.query(`
      SELECT 
        c.comment_id,
        c.board_id,
        c.parent_id,
        c.userid,
        u.name as writer,
        c.comments_content as content,
        c.regdate as regDate,
        c.updated_at,
        u.name as user_name,
        (SELECT COUNT(*) FROM laon_tbl_likes WHERE comment_id = c.comment_id) as like_count,
        (SELECT COUNT(*) FROM laon_tbl_comments WHERE parent_id = c.comment_id) as reply_count
      FROM laon_tbl_comments c
      LEFT JOIN laon_tbl_user u ON c.userid = u.userid
      WHERE c.board_id = ?
      ORDER BY c.regdate ASC
      LIMIT ? OFFSET ?
    `, [boardId, limit, offset])

    // 전체 댓글 수 조회
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM laon_tbl_comments WHERE board_id = ?',
      [boardId]
    )

    // 댓글을 계층 구조로 변환
    const hierarchicalComments = buildCommentHierarchy(comments)

    return {
      success: true,
      comments: hierarchicalComments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(countResult[0].total / limit),
        total: countResult[0].total,
        limit: limit
      }
    }

  } catch (error) {
    console.error('댓글 조회 실패:', error)
    throw createError({
      statusCode: 500,
      message: '댓글 조회에 실패했습니다.'
    })
  }
})

// 댓글 계층 구조 생성 함수
function buildCommentHierarchy(comments) {
  const commentMap = {}
  const rootComments = []

  // 댓글 맵 생성
  comments.forEach(comment => {
    comment.replies = []
    commentMap[comment.comment_id] = comment
  })

  // 계층 구조 구성
  comments.forEach(comment => {
    if (comment.parent_id === null || comment.parent_id === 0) {
      // 최상위 댓글
      rootComments.push(comment)
    } else {
      // 대댓글
      const parent = commentMap[comment.parent_id]
      if (parent) {
        parent.replies.push(comment)
      }
    }
  })

  return rootComments
}
