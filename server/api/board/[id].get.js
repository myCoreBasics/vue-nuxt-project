import { getDbPool } from '../../utils/db';

export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params.id;
    const pool = getDbPool();
    
    // 조회수 증가
    await pool.query(
      'UPDATE laon_tbl_board SET hitno = hitno + 1 WHERE bno = ?',
      [id]
    );
    
    // 게시물 조회
    const [rows] = await pool.query(
      'SELECT bno, userid, writer, title, content, hitno, regDate, COALESCE(like_count, 0) as like_count FROM laon_tbl_board WHERE bno = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return {
        success: false,
        error: '게시물을 찾을 수 없습니다.'
      };
    }
    
    // 이전 게시물
    const [prevRows] = await pool.query(
      'SELECT bno, title FROM laon_tbl_board WHERE bno < ? ORDER BY bno DESC LIMIT 1',
      [id]
    );
    
    // 다음 게시물
    const [nextRows] = await pool.query(
      'SELECT bno, title FROM laon_tbl_board WHERE bno > ? ORDER BY bno ASC LIMIT 1',
      [id]
    );
    
    return {
      success: true,
      data: rows[0],
      prev: prevRows.length > 0 ? prevRows[0] : null,
      next: nextRows.length > 0 ? nextRows[0] : null
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});