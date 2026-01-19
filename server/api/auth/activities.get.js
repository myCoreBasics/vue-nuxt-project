import { getDbPool } from '../../utils/db'

export default defineEventHandler(async (event) => {
  // 사용자 정보는 auth 미들웨어를 통해 이미 확인됨
  const user = event.context.user

  console.log('Activities API - User from context:', JSON.stringify(user, null, 2))

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '인증이 필요합니다.'
    })
  }

  try {
    // 쿼리 파라미터 가져오기
    const query = getQuery(event)
    const page = parseInt(query.page) || 1
    const limit = parseInt(query.limit) || 10
    const type = query.type || 'all'
    const search = query.search || ''
    const category = query.category || ''
    const dateFilter = query.dateFilter || ''
    const offset = (page - 1) * limit

    console.log('Activities API - Query params:', { page, limit, type, search, category, dateFilter, offset })

    const pool = getDbPool()

    // 기본 WHERE 조건
    let whereConditions = ['a.userid = ?']
    let queryParams = [user.userid]

    // 타입 필터링
    if (type !== 'all') {
      whereConditions.push('a.activity_type = ?')
      queryParams.push(type)
    }

    // 검색 필터링
    if (search.trim()) {
      whereConditions.push(`(b.title LIKE ? OR b.content LIKE ? OR c.content LIKE ?)`)
      const searchTerm = `%${search.trim()}%`
      queryParams.push(searchTerm, searchTerm, searchTerm)
    }

    // 카테고리 필터링
    if (category) {
      whereConditions.push('a.category = ?')
      queryParams.push(category)
    }

    // 날짜 필터링
    if (dateFilter) {
      const now = new Date()
      let startDate = null

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
      }

      if (startDate) {
        whereConditions.push('a.created_at >= ?')
        queryParams.push(startDate.toISOString().slice(0, 19).replace('T', ' '))
      }
    }

    const whereClause = whereConditions.join(' AND ')

    // 전체 개수 조회
    const [countResult] = await pool.query(
      `SELECT COUNT(a.activity_id) as total FROM laon_tbl_activities a WHERE ${whereClause}`,
      queryParams
    )
    const total = countResult[0].total
    const totalPages = Math.ceil(total / limit)

    // 활동 내역 조회 (조인으로 게시글 정보 가져오기)
    const [rows] = await pool.query(
      `SELECT 
        a.activity_id as id,
        a.activity_type as type,
        a.category as category,
        a.target_id as targetId,
        a.created_at as createdAt,
        CASE 
          WHEN a.activity_type = 'post' THEN b.title
          WHEN a.activity_type = 'comment' THEN '댓글 작성'
          WHEN a.activity_type = 'like' THEN '좋아요'
          ELSE '활동'
        END as title,
        CASE 
          WHEN a.activity_type = 'post' THEN b.content
          WHEN a.activity_type = 'comment' THEN c.content
          ELSE NULL
        END as content
      FROM laon_tbl_activities a
      LEFT JOIN laon_tbl_board b ON a.target_id = b.bno AND a.activity_type = 'post'
      LEFT JOIN laon_tbl_board c ON a.target_id = c.bno AND a.activity_type = 'comment'
      WHERE ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    )

    console.log('Activities API - Found activities:', rows.length)

    return {
      success: true,
      activities: rows,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        total: total,
        limit: limit
      }
    }

  } catch (error) {
    console.error('활동 내역 조회 실패:', error)
    throw createError({
      statusCode: 500,
      message: '활동 내역 조회에 실패했습니다.'
    })
  }
})