import { getDbPool } from '../../utils/db';

export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params.id;
    const user = event.context.user;
    
    const pool = getDbPool();
    
    // 작성자 확인
    const [rows] = await pool.query(
      'SELECT userid FROM laon_tbl_board WHERE bno = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return {
        success: false,
        error: '게시물을 찾을 수 없습니다.'
      };
    }
    
    if (rows[0].userid !== user.userid) {
      return {
        success: false,
        error: '삭제 권한이 없습니다.'
      };
    }
    
    // 게시물 삭제
    await pool.query(
      'DELETE FROM laon_tbl_board WHERE bno = ?',
      [id]
    );
    
    // 활동 내역에서도 삭제
    await pool.query(
      'DELETE FROM laon_tbl_activities WHERE activity_type = ? AND board_id = ? AND userid = ?',
      ['post', id, user.userid]
    );
    
    return {
      success: true,
      message: '게시물이 삭제되었습니다.'
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});