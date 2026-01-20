import { getDbPool } from './db'
 
/**
 * 사용자 활동 내역 기록
 * @param {string} userid - 사용자 ID
 * @param {string} type - 활동 타입 (post, comment, like)
 * @param {string} category - 카테고리 (공지사항, 자유게시판, Q&A, 팁&노하우)
 * @param {number} targetId - 대상 ID (게시글 ID 등)
 */
export async function logActivity(userid, type, category, targetId = null) {
  try {
    const pool = getDbPool()
 
    // laon_tbl_activities 테이블이 있는지 확인하고 없으면 생성
    await createActivitiesTableIfNotExists(pool)
 
    // 활동 내역 저장 (title, content 제거)
    await pool.query(
      `INSERT INTO laon_tbl_activities (
        userid, 
        activity_type, 
        category, 
        target_id, 
        regdate
      ) VALUES (?, ?, ?, ?, CONVERT_TZ(NOW(), "+00:00", "+09:00"))`,
      [userid, type, category, targetId]
    )
 
    console.log(`Activity logged: ${userid} - ${type} - ${category}`)
 
  } catch (error) {
    console.error('Failed to log activity:', error)
    // 활동 로깅 실패해도 메인 기능은 동작해야 함
  }
}
 
/**
 * 활동 내역 테이블 생성 (없을 경우)
 */
async function createActivitiesTableIfNotExists(pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS laon_tbl_activities (
        activity_id INT AUTO_INCREMENT PRIMARY KEY,
        userid VARCHAR(50) NOT NULL,
        activity_type VARCHAR(20) NOT NULL,
        category VARCHAR(50) NOT NULL,
        target_id INT,
        regdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_userid (userid),
        INDEX idx_activity_type (activity_type),
        INDEX idx_regdate (regdate),
        INDEX idx_target_id (target_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)
  } catch (error) {
    console.error('Failed to create activities table:', error)
    throw error
  }
}
 
/**
 * 게시글 작성 활동 기록
 */
export async function logPostActivity(userid, category, postId) {
  return logActivity(userid, 'post', category, postId)
}
 
/**
 * 댓글 작성 활동 기록
 */
export async function logCommentActivity(userid, category, postId) {
  return logActivity(userid, 'comment', category, postId)
}
 
/**
 * 좋아요 활동 기록
 */
export async function logLikeActivity(userid, category, postId) {
  return logActivity(userid, 'like', category, postId)
}