import { getDbPool } from '../../utils/db';
import { logPostActivity } from '../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const user = event.context.user; // 미들웨어에서 설정한 사용자 정보

    // 입력값 검증
    if (!body.title || !body.content) {
      return {
        success: false,
        error: '제목과 내용을 입력해주세요.'
      };
    }

    const pool = getDbPool();

    // 게시물 등록 (userid, writer, category 포함)
    const [result] = await pool.query(
      'INSERT INTO laon_tbl_board (userid, writer, title, content, category, regDate) VALUES (?, ?, ?, ?, ?, CONVERT_TZ(NOW(), "+00:00", "+09:00"))',
      [user.userid, user.name, body.title, body.content, body.category || '자유게시판']
    );

    // 활동 내역 기록
    await logPostActivity(user.userid, body.category || '자유게시판', result.insertId);

    return {
      success: true,
      message: '게시물이 등록되었습니다.',
      insertId: result.insertId
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});