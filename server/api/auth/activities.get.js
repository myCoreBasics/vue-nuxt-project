import { getDbPool } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const user = event.context.user

  console.log('Activities API - User from context:', JSON.stringify(user, null, 2))

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '인증이 필요합니다.'
    })
  }

  try {
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

    let whereConditions = ['a.userid = ?']
    let queryParams = [user.userid]

    // 게시판 필터링
    if (type !== 'all') {
      whereConditions.push('a.activity_type = ?')
      queryParams.push(type)
    }

    // 검색 필터링
    let searchConditions = []
    if (search.trim()) {
      if (type === 'all') {
        // 전체 탭: 모든 타입에 대해 검색
        if (category) {
          // 카테고리 필터가 있을 때
          searchConditions.push(`(
            (a.activity_type = 'post' AND a.category = ? AND (b.title LIKE ? OR b.content LIKE ?)) OR 
            (a.activity_type = 'comment' AND a.category = ? AND c.content LIKE ?)
          )`)
          const searchTerm = `%${search.trim()}%`
          queryParams.push(category, searchTerm, searchTerm, category, searchTerm)
        } else {
          // 카테고리 필터가 없을 때
          searchConditions.push(`(
            (a.activity_type = 'post' AND (b.title LIKE ? OR b.content LIKE ?)) OR 
            (a.activity_type = 'comment' AND c.content LIKE ?)
          )`)
          const searchTerm = `%${search.trim()}%`
          queryParams.push(searchTerm, searchTerm, searchTerm)
        }
      } else if (type === 'post') {
        // 게시글 탭: 게시글 제목/내용 검색
        if (category) {
          searchConditions.push(`a.category = ? AND (b.title LIKE ? OR b.content LIKE ?)`)
          const searchTerm = `%${search.trim()}%`
          queryParams.push(category, searchTerm, searchTerm)
        } else {
          searchConditions.push(`(b.title LIKE ? OR b.content LIKE ?)`)
          const searchTerm = `%${search.trim()}%`
          queryParams.push(searchTerm, searchTerm)
        }
      } else if (type === 'comment') {
        // 댓글 탭: 댓글 내용 검색
        if (category) {
          searchConditions.push(`a.category = ? AND c.content LIKE ?`)
          const searchTerm = `%${search.trim()}%`
          queryParams.push(category, searchTerm)
        } else {
          searchConditions.push(`c.content LIKE ?`)
          const searchTerm = `%${search.trim()}%`
          queryParams.push(searchTerm)
        }
      }
      // like 탭은 검색 제외 (게시글 정보 없음)
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
        whereConditions.push('a.regdate >= ?')
        queryParams.push(startDate.toISOString().slice(0, 19).replace('T', ' '))
      }
    }

    const whereClause = whereConditions.join(' AND ')
    const searchClause = searchConditions.length > 0 ? ' AND ' + searchConditions.join(' AND ') : ''
    const finalWhereClause = whereClause + searchClause

    // 전체 개수 조회 (검색 조건 포함)
    let countQuery = `SELECT COUNT(a.activity_id) as total FROM laon_tbl_activities a`
    let countParams = [...queryParams]
    
    if (searchConditions.length > 0) {
      countQuery += ` LEFT JOIN laon_tbl_board b ON a.target_id = b.bno AND a.activity_type = 'post'
                     LEFT JOIN laon_tbl_board c ON a.target_id = c.bno AND a.activity_type = 'comment'
                     WHERE ${whereClause} AND ${searchConditions.join(' AND ')}`
    } else {
      countQuery += ` WHERE ${whereClause}`
    }
    
    const [countResult] = await pool.query(countQuery, countParams)
    const total = countResult[0].total
    const totalPages = Math.ceil(total / limit)

    // 활동 내역 조회 (조인으로 게시글 정보 가져오기)
    const [rows] = await pool.query(
      `SELECT 
        a.activity_id as id,
        a.activity_type as type,
        a.category as category,
        a.target_id as targetId,
        a.regdate as regdate,
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
      WHERE ${finalWhereClause}
      ORDER BY a.regdate DESC
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    )

    console.log('Activities API - Found activities:', rows.length)
    console.log('Activities API - Final WHERE clause:', finalWhereClause)
    console.log('Activities API - Search term:', search.trim())
    console.log('Activities API - Search conditions:', searchConditions)

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