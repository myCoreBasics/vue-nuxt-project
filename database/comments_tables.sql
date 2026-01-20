-- 댓글 테이블
CREATE TABLE IF NOT EXISTS laon_tbl_comments (
  comment_id INT AUTO_INCREMENT PRIMARY KEY,     -- 댓글 ID
  board_id INT NOT NULL,                         -- 게시글 ID
  parent_id INT NULL,                            -- 부모 댓글 ID (대댓글용)
  userid VARCHAR(50) NOT NULL,                   -- 작성자 ID
  comments_content TEXT NOT NULL,                 -- 댓글 내용
  regdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- 작성일
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- 수정일
  INDEX idx_board_id (board_id),                 -- 게시글 ID 인덱스
  INDEX idx_parent_id (parent_id),               -- 부모 댓글 ID 인덱스
  INDEX idx_userid (userid),                     -- 작성자 ID 인덱스
  FOREIGN KEY (board_id) REFERENCES laon_tbl_board(bno) ON DELETE CASCADE      -- 게시글 외래키
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 통합 좋아요 테이블 (댓글+게시글)
CREATE TABLE IF NOT EXISTS laon_tbl_likes (
  like_id INT AUTO_INCREMENT PRIMARY KEY,          -- 좋아요 ID
  comment_id INT NULL DEFAULT NULL,               -- 댓글 ID
  board_id INT NULL DEFAULT NULL,                 -- 게시글 ID
  userid VARCHAR(50) NOT NULL,                   -- 사용자 ID
  regdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 생성일
  UNIQUE KEY unique_comment_user (comment_id, userid), -- 댓글 중복 방지
  UNIQUE KEY unique_board_user (board_id, userid),   -- 게시글 중복 방지
  INDEX idx_comment_id (comment_id),             -- 댓글 ID 인덱스
  INDEX idx_board_id (board_id),                 -- 게시글 ID 인덱스
  INDEX idx_userid (userid),                     -- 사용자 ID 인덱스
  FOREIGN KEY (comment_id) REFERENCES laon_tbl_comments(comment_id) ON DELETE CASCADE,  -- 댓글 외래키
  FOREIGN KEY (board_id) REFERENCES laon_tbl_board(bno) ON DELETE CASCADE  -- 게시글 외래키
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 기존 테이블이 있다면 컬럼 수정
ALTER TABLE laon_tbl_likes 
MODIFY COLUMN comment_id INT NULL DEFAULT NULL,
MODIFY COLUMN board_id INT NULL DEFAULT NULL;

-- 게시글 테이블에 좋아요 수 컬럼 추가 (없을 경우)
ALTER TABLE laon_tbl_board 
ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0;

-- 댓글 수 컬럼 추가 (없을 경우)
ALTER TABLE laon_tbl_board 
ADD COLUMN IF NOT EXISTS comment_count INT DEFAULT 0;

-- 기존 테이블에 like_count가 없다면 추가
ALTER TABLE laon_tbl_board 
ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0;

-- laon_tbl_activities 테이블에 regdate 컬럼이 없다면 추가
ALTER TABLE laon_tbl_activities 
ADD COLUMN IF NOT EXISTS regdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
