import { getDbPool } from '../utils/db';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const category = query.category || '';
    const offset = (page - 1) * limit;
    
    const pool = getDbPool();
    
    // WHERE 조건 구성
    let whereClause = '';
    let queryParams = [];
    
    if (category) {
      whereClause = 'WHERE category = ?';
      queryParams.push(category);
    }
    
    // 전체 게시글 수 조회
    const countQuery = `SELECT COUNT(*) as total FROM laon_tbl_board ${whereClause}`;
    const [countResult] = await pool.query(countQuery, queryParams);
    const totalCount = countResult[0].total;
    
    // 페이지별 데이터 조회 (번호는 내림차순으로 계산)
    const dataQuery = `
      SELECT 
        bno, 
        userid, 
        writer, 
        title, 
        hitno, 
        regDate,
        (SELECT COUNT(*) FROM laon_tbl_board) - (
          SELECT COUNT(*) FROM laon_tbl_board AS b2 WHERE b2.bno > laon_tbl_board.bno
        ) AS rownum
      FROM laon_tbl_board 
      ${whereClause}
      ORDER BY bno DESC 
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(dataQuery, [...queryParams, limit, offset]);
    
    return {
      success: true,
      data: rows,
      pagination: {
        currentPage: page,
        totalCount: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        limit: limit
      }
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});