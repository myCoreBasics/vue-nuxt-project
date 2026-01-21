import { getDbPool } from './db'
 
/**
 * 사용자 활동 내역 기록
 * @param {string} userid - 사용자 ID
 * @param {string} type - 활동 타입 (post, comment, like)
 * @param {number} boardId - 게시글 ID
 * @param {number} commentId - 댓글 ID (댓글/좋아요 활동에 필요)
 * @param {number} likeId - 좋아요 ID (좋아요 활동에 필요)
 */
export async function logActivity(userid, type, boardId = null, commentId = null, likeId = null) {
  try {
    const pool = getDbPool()

    // laon_tbl_activities 테이블이 있는지 확인하고 없으면 생성
    await createActivitiesTableIfNotExists(pool)

    // 활동 내역 저장 (새로운 컬럼 구조)
    const result = await pool.query(
      `INSERT INTO laon_tbl_activities (
        userid, 
        activity_type, 
        board_id, 
        comment_id, 
        like_id,
        regdate
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [userid, type, boardId, commentId, likeId]
    )

    console.log(`Activity logged: ${userid} - ${type} - boardId: ${boardId}, commentId: ${commentId}, likeId: ${likeId}`)
    console.log('Activity query result:', result)

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
        category VARCHAR(50),
        board_id INT,
        comment_id INT,
        like_id INT,
        regdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_userid (userid),
        INDEX idx_activity_type (activity_type),
        INDEX idx_regdate (regdate),
        INDEX idx_board_id (board_id),
        INDEX idx_comment_id (comment_id),
        INDEX idx_like_id (like_id)
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
export async function logPostActivity(userid, boardId, category) {
  return logActivity(userid, 'post', boardId, null, null, category)
}
 
/**
 * 댓글 작성 활동 기록
 */
export async function logCommentActivity(userid, boardId, commentId) {
  return logActivity(userid, 'comment', boardId, commentId, null)
}
 
/**
 * 좋아요 활동 기록
 */
export async function logLikeActivity(userid, boardId, commentId, likeId, category) {
  return logActivity(userid, 'like', boardId, commentId, likeId, category)
}