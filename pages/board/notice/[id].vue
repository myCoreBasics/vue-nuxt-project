<template>
  <div class="container">
    <div v-if="pending" class="loading">
      데이터를 불러오는 중...
    </div>
    
    <div v-else-if="error" class="error">
      오류가 발생했습니다: {{ error.message }}
    </div>
    
    <div v-else-if="data && data.success">
      <div class="view-container">
        <h1>{{ data.data.title }}</h1>
        
        <div class="post-info">
          <div class="info-item">
            <span class="label">작성자:</span>
            <span>{{ data.data.writer }}</span>
          </div>
          <div class="info-item">
            <span class="label">조회수:</span>
            <span>{{ data.data.hitno }}</span>
          </div>
          <div class="info-item">
            <span class="label">등록일:</span>
            <span>{{ formatDate(data.data.regDate) }}</span>
          </div>
        </div>
        
        <div class="post-content">
          <div v-html="formatContent(data.data.content)"></div>
        </div>
        
        <!-- 좋아요 버튼 -->
        <div class="like-section">
          <button 
            @click="toggleLike" 
            :class="['like-btn', { liked: isLiked }]"
            :disabled="!user || likeLoading"
          >
            <span class="like-icon">{{ isLiked ? '❤️' : '🤍' }}</span>
            <span class="like-count">{{ likeCount }}</span>
          </button>
        </div>
        
        <!-- 댓글 작성 폼 -->
        <div v-if="user" class="comment-form">
          <h3>댓글 작성</h3>
          <textarea 
            v-model="newComment"
            placeholder="댓글을 입력하세요..."
            class="comment-textarea"
            rows="3"
          ></textarea>
          <div class="comment-actions">
            <button 
              @click="submitComment" 
              :disabled="!newComment.trim() || commentLoading"
              class="submit-btn"
            >
              {{ commentLoading ? '작성 중...' : '댓글 작성' }}
            </button>
          </div>
        </div>
        
        <!-- 댓글 목록 -->
        <div v-if="comments && comments.length > 0" class="comments-section">
          <h3>댓글 ({{ comments.length }})</h3>
          <div class="comments-list">
            <div 
              v-for="comment in comments" 
              :key="comment.comment_id"
              class="comment-item"
            >
              <div class="comment-header">
                <span class="comment-writer">{{ comment.writer }}</span>
                <span class="comment-date">{{ formatDate(comment.regDate) }}</span>
              </div>
              <div class="comment-body">
                <div v-if="editingComment === comment.comment_id" class="edit-mode">
                  <textarea 
                    v-model="editContent"
                    class="comment-textarea"
                    rows="3"
                  ></textarea>
                  <div class="edit-actions">
                    <button 
                      @click="updateComment(comment.comment_id)"
                      :disabled="!editContent.trim()"
                      class="submit-btn"
                    >
                      저장
                    </button>
                    <button 
                      @click="cancelCommentEdit"
                      class="cancel-btn"
                    >
                      취소
                    </button>
                  </div>
                </div>
                <div v-else class="comment-content">{{ comment.content }}</div>
                <div class="comment-actions">
                  <button 
                    @click="toggleCommentLike(comment.comment_id)"
                    :class="['comment-like-btn', { liked: comment.is_liked }]"
                    :disabled="!user"
                  >
                    <span>{{ comment.is_liked ? '❤️' : '🤍' }}</span>
                    <span>{{ comment.like_count || 0 }}</span>
                  </button>
                  <button 
                    v-if="isCommentOwner(comment)"
                    @click="editComment(comment)"
                    class="comment-edit-btn"
                  >
                    수정
                  </button>
                  <button 
                    v-if="isCommentOwner(comment)"
                    @click="deleteComment(comment.comment_id)"
                    class="comment-delete-btn"
                  >
                    삭제
                  </button>
                  <button 
                    @click="showReplyForm(comment.comment_id)"
                    class="reply-btn"
                  >
                    답글
                  </button>
                </div>
              </div>
              
              <!-- 대댓글 목록 -->
              <div 
                v-for="reply in comment.replies" 
                :key="reply.comment_id"
                class="reply-item"
                style="margin-left: 40px;"
              >
                <div class="comment-header">
                  <span class="comment-writer">{{ reply.writer }}</span>
                  <span class="comment-date">{{ formatDate(reply.regDate) }}</span>
                </div>
                <div class="comment-body">
                  <div v-if="editingComment === reply.comment_id" class="edit-mode">
                    <textarea 
                      v-model="editContent"
                      class="comment-textarea"
                      rows="2"
                    ></textarea>
                    <div class="edit-actions">
                      <button 
                        @click="updateComment(reply.comment_id)"
                        :disabled="!editContent.trim()"
                        class="submit-btn"
                      >
                        저장
                      </button>
                      <button 
                        @click="cancelCommentEdit"
                        class="cancel-btn"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                  <div v-else class="comment-content">{{ reply.content }}</div>
                  <div class="comment-actions">
                    <button 
                      @click="toggleCommentLike(reply.comment_id)"
                      :class="['comment-like-btn', { liked: reply.is_liked }]"
                      :disabled="!user"
                    >
                      <span>{{ reply.is_liked ? '❤️' : '🤍' }}</span>
                      <span>{{ reply.like_count || 0 }}</span>
                    </button>
                    <button 
                      v-if="isCommentOwner(reply)"
                      @click="editComment(reply)"
                      class="comment-edit-btn"
                    >
                      수정
                    </button>
                    <button 
                      v-if="isCommentOwner(reply)"
                      @click="deleteComment(reply.comment_id)"
                      class="comment-delete-btn"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- 대댓글 작성 폼 -->
              <div v-if="replyFormVisible === comment.comment_id" class="reply-form">
                <textarea 
                  v-model="replyContent[comment.comment_id]"
                  :placeholder="`${comment.writer}님에게 답글 작성...`"
                  class="comment-textarea"
                  rows="2"
                ></textarea>
                <div class="reply-actions">
                  <button 
                    @click="submitReply(comment.comment_id)"
                    :disabled="!replyContent[comment.comment_id]?.trim()"
                    class="submit-btn"
                  >
                    답글 작성
                  </button>
                  <button 
                    @click="hideReplyForm(comment.comment_id)"
                    class="cancel-btn"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 댓글 페이지네이션 -->
        <div v-if="commentPagination.totalPages > 1" class="comment-pagination">
          <button 
            @click="loadComments(commentPagination.currentPage - 1)"
            :disabled="commentPagination.currentPage === 1"
            class="pagination-btn"
          >
            이전
          </button>
          <span class="page-info">
            {{ commentPagination.currentPage }} / {{ commentPagination.totalPages }}
          </span>
          <button 
            @click="loadComments(commentPagination.currentPage + 1)"
            :disabled="commentPagination.currentPage === commentPagination.totalPages"
            class="pagination-btn"
          >
            다음
          </button>
        </div>
        
        <div class="navigation-buttons">
          <button v-if="data.prevPost" @click="goToPost(data.prevPost.bno)" class="nav-btn prev-btn">
            이전 글: {{ data.prevPost.title }}
          </button>
          <button v-if="data.nextPost" @click="goToPost(data.nextPost.bno)" class="nav-btn next-btn">
            다음 글: {{ data.nextPost.title }}
          </button>
        </div>
        
        <div class="action-buttons">
          <button @click="goToList" class="list-btn">목록</button>
          <button v-if="isOwner" @click="startEdit" class="edit-btn">수정</button>
          <button v-if="isOwner" @click="showDeleteModal = true" class="delete-btn">삭제</button>
        </div>
      </div>
    </div>
    
    <!-- 삭제 확인 모달 -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal">
        <h3>게시물 삭제</h3>
        <p>정말로 이 게시물을 삭제하시겠습니까?</p>
        <div class="modal-buttons">
          <button @click="handleDelete" class="delete-confirm-btn">삭제</button>
          <button @click="showDeleteModal = false" class="cancel-btn">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
const userId = useCookie('user_id');

// 인증 체크
onMounted(() => {
  const token = useCookie('auth_token');
  if (!token.value) {
    router.push('/');
  }
});

const { data, pending, error, refresh } = await useFetch(`/api/board/${route.params.id}`);

const isOwner = computed(() => {
  if (!data.value || !data.value.data) return false;
  return data.value.data.userid === userId.value;
});

const isEditMode = ref(false);
const showDeleteModal = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');

// 댓글 관련 상태
const comments = ref([]);
const newComment = ref('');
const commentLoading = ref(false);
const replyContent = ref({});
const replyFormVisible = ref(null);
const commentPagination = ref({
  currentPage: 1,
  totalPages: 1,
  total: 0
});

// 좋아요 관련 상태
const isLiked = ref(false);
const likeCount = ref(0);
const likeLoading = ref(false);

// 사용자 정보
const user = computed(() => {
  const userName = useCookie('user_name', { default: () => null });
  const userId = useCookie('user_id', { default: () => null });
  return userId.value ? {
    userid: userId.value,
    name: userName.value
  } : null;
});

const editData = ref({
  title: '',
  content: ''
});

// 데이터 로드 시 수정 폼 초기화
watchEffect(() => {
  if (data.value?.data) {
    editData.value = {
      title: data.value.data.title,
      content: data.value.data.content
    };
  }
});

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
};

const formatContent = (content) => {
  return content.replace(/\n/g, '<br>');
};

const goToPost = (bno) => {
  router.push(`/board/notice/${bno}`);
};

const goToList = () => {
  router.push('/board/notice/notice');
};

const startEdit = () => {
  isEditMode.value = true;
  errorMessage.value = '';
};

const cancelEdit = () => {
  isEditMode.value = false;
  errorMessage.value = '';
};

const handleUpdate = async () => {
  if (isSubmitting.value) return;
  
  isSubmitting.value = true;
  errorMessage.value = '';
  
  try {
    const response = await $fetch(`/api/board/${route.params.id}`, {
      method: 'PUT',
      body: editData.value
    });
    
    if (response.success) {
      alert('게시물이 수정되었습니다.');
      isEditMode.value = false;
      refresh();
    } else {
      errorMessage.value = response.error || '게시물 수정에 실패했습니다.';
    }
  } catch (error) {
    console.error('Update error:', error);
    errorMessage.value = '게시물 수정 중 오류가 발생했습니다.';
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = async () => {
  try {
    const response = await $fetch(`/api/board/${route.params.id}`, {
      method: 'DELETE'
    });
    
    if (response.success) {
      alert('게시물이 삭제되었습니다.');
      router.push('/board/notice/notice');
    } else {
      alert(response.error || '게시물 삭제에 실패했습니다.');
    }
  } catch (error) {
    console.error('Delete error:', error);
    alert('게시물 삭제 중 오류가 발생했습니다.');
  }
};

// 댓글 관련 함수
const loadComments = async (page = 1) => {
  try {
    const response = await $fetch(`/api/boards/${route.params.id}/comments?page=${page}`);
    if (response.success) {
      comments.value = response.comments;
      commentPagination.value = response.pagination;
      
      // 현재 사용자의 댓글 좋아요 상태 확인
      if (user.value && comments.value.length > 0) {
        await checkCommentsLikeStatus();
      }
    }
  } catch (error) {
    console.error('댓글 로드 실패:', error);
  }
};

// 댓글 좋아요 상태 확인 함수
const checkCommentsLikeStatus = async () => {
  if (!user.value) return;
  
  try {
    const commentIds = comments.value.map(c => c.comment_id);
    
    // 각 댓글의 좋아요 상태 확인
    for (const commentId of commentIds) {
      const response = await $fetch(`/api/boards/${route.params.id}/comments/${commentId}/like/status?userid=${user.value.userid}`);
      const comment = comments.value.find(c => c.comment_id === commentId);
      if (comment) {
        comment.is_liked = response.liked || false;
      }
    }
  } catch (error) {
    console.error('댓글 좋아요 상태 확인 실패:', error);
  }
};

const submitComment = async () => {
  if (!newComment.value.trim() || commentLoading.value) return;
  
  commentLoading.value = true;
  try {
    const response = await $fetch(`/api/boards/${route.params.id}/comments`, {
      method: 'POST',
      body: {
        userid: user.value.userid,
        content: newComment.value
      }
    });
    
    if (response.success) {
      newComment.value = '';
      await loadComments(1); // 댓글 목록 새로고침
    }
  } catch (error) {
    console.error('댓글 작성 실패:', error);
    alert('댓글 작성에 실패했습니다.');
  } finally {
    commentLoading.value = false;
  }
};

const showReplyForm = (commentId) => {
  replyFormVisible.value = commentId;
  replyContent.value[commentId] = '';
};

const hideReplyForm = (commentId) => {
  replyFormVisible.value = null;
  delete replyContent.value[commentId];
};

const submitReply = async (parentId) => {
  const content = replyContent.value[parentId];
  if (!content?.trim()) return;
  
  try {
    const response = await $fetch(`/api/boards/${route.params.id}/comments`, {
      method: 'POST',
      body: {
        parent_id: parentId,
        userid: user.value.userid,
        content: content
      }
    });
    
    if (response.success) {
      hideReplyForm(parentId);
      await loadComments(1);
    }
  } catch (error) {
    console.error('답글 작성 실패:', error);
    alert('답글 작성에 실패했습니다.');
  }
};

const isCommentOwner = (comment) => {
  return user.value && comment.userid === user.value.userid;
};

const editingComment = ref(null);
const editContent = ref('');

const editComment = (comment) => {
  editingComment.value = comment.comment_id;
  editContent.value = comment.content;
};

const cancelCommentEdit = () => {
  editingComment.value = null;
  editContent.value = '';
};

const updateComment = async (commentId) => {
  if (!editContent.value.trim()) return;
  
  try {
    const response = await $fetch(`/api/boards/${route.params.id}/comments/${commentId}`, {
      method: 'PUT',
      body: {
        content: editContent.value,
        userid: user.value.userid
      }
    });
    
    if (response.success) {
      await loadComments(commentPagination.value.currentPage);
      cancelCommentEdit();
    }
  } catch (error) {
    console.error('댓글 수정 실패:', error);
    alert('댓글 수정에 실패했습니다.');
  }
};

const deleteComment = async (commentId) => {
  if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;
  
  try {
    const response = await $fetch(`/api/boards/${route.params.id}/comments/${commentId}?userid=${user.value.userid}`, {
      method: 'DELETE'
    });
    
    if (response.success) {
      await loadComments(commentPagination.value.currentPage);
    }
  } catch (error) {
    console.error('댓글 삭제 실패:', error);
    alert('댓글 삭제에 실패했습니다.');
  }
};

// 좋아요 관련 함수
const toggleLike = async () => {
  if (!user.value || likeLoading.value) return;
  
  likeLoading.value = true;
  try {
    const response = await $fetch(`/api/boards/${route.params.id}/like`, {
      method: 'POST',
      body: {
        userid: user.value.userid
      }
    });
    
    if (response.success) {
      isLiked.value = response.liked;
      likeCount.value += response.liked ? 1 : -1;
    }
  } catch (error) {
    console.error('좋아요 실패:', error);
    alert('좋아요 처리에 실패했습니다.');
  } finally {
    likeLoading.value = false;
  }
};

const toggleCommentLike = async (commentId) => {
  if (!user.value) return;
  
  try {
    const response = await $fetch(`/api/boards/${route.params.id}/comments/${commentId}/like`, {
      method: 'POST',
      body: {
        commentId: commentId,
        userid: user.value.userid
      }
    });
    
    if (response.success) {
      // 댓글 목록에서 찾기
      let comment = comments.value.find(c => c.comment_id === commentId);
      
      // 댓글에 없으면 대댓글에서 찾기
      if (!comment) {
        for (const parentComment of comments.value) {
          comment = parentComment.replies?.find(r => r.comment_id === commentId);
          if (comment) break;
        }
      }
      
      if (comment) {
        comment.is_liked = response.liked;
        comment.like_count = (comment.like_count || 0) + (response.liked ? 1 : -1);
      }
    }
  } catch (error) {
    console.error('댓글 좋아요 실패:', error);
    alert('댓글 좋아요 처리에 실패했습니다.');
  }
};

// 좋아요 상태 확인 함수
const checkLikeStatus = async () => {
  if (!user.value) return;
  
  try {
    const response = await $fetch(`/api/boards/${route.params.id}/like/status?userid=${user.value.userid}`);
    isLiked.value = response.liked || false;
  } catch (error) {
    console.error('좋아요 상태 확인 실패:', error);
  }
};

// 데이터 로드 시 댓글과 좋아요 상태 초기화
watchEffect(() => {
  if (data.value?.data) {
    likeCount.value = data.value.data.like_count || 0;
    loadComments(1);
    // 현재 사용자의 좋아요 상태 확인
    checkLikeStatus();
  }
});
</script>

<style scoped>
.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 18px;
}

.error {
  padding: 20px;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
  margin: 20px 0;
}

.view-container, .edit-container {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

.post-info {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.info-item {
  display: flex;
  gap: 8px;
}

.label {
  font-weight: bold;
  color: #666;
}

.post-content {
  margin: 20px 0;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-height: 200px;
  line-height: 1.6;
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  margin: 20px 0;
}

.nav-btn {
  padding: 10px 20px;
  border: 1px solid #ddd;
  background-color: white;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-btn:hover {
  background-color: #f5f5f5;
}

.prev-btn {
  margin-right: auto;
}

.next-btn {
  margin-left: auto;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.list-btn, .edit-btn, .delete-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
}

.list-btn {
  background-color: #2196F3;
  color: white;
}

.edit-btn {
  background-color: #FFC107;
  color: #333;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}

.list-btn:hover {
  background-color: #1976D2;
}

.edit-btn:hover {
  background-color: #FFA000;
}

.delete-btn:hover {
  background-color: #d32f2f;
}

/* 좋아요 스타일 */
.like-section {
  margin: 20px 0;
  text-align: center;
}

.like-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.like-btn:hover {
  border-color: #ff6b6b;
  background: #fff8f8;
}

.like-btn.liked {
  border-color: #ff6b6b;
  background: #ffe8e8;
}

.like-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.like-icon {
  font-size: 16px;
}

.like-count {
  font-weight: bold;
  color: #666;
}

/* 댓글 스타일 */
.comment-form {
  margin: 30px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.comment-form h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.comment-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
}

.comment-actions {
  margin-top: 10px;
  text-align: right;
}

.submit-btn {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.submit-btn:hover:not(:disabled) {
  background: #0056b3;
}

.submit-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.comments-section {
  margin-top: 40px;
}

.replies-section {
  margin-top: 40px;
}

.comments-section h3, .replies-section h3 {
  margin-bottom: 20px;
  color: #333;
  font-size: 18px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  padding: 20px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 15px;
}

.comment-body {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;
}

.comment-body .comment-content {
  margin-bottom: 0;
  flex: 1;
}

.comment-body .comment-actions {
  margin-top: 0;
  flex-shrink: 0;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.comment-writer {
  font-weight: bold;
  color: #007bff;
}

.comment-date {
  color: #666;
  font-size: 12px;
}

.comment-content {
  margin-bottom: 10px;
  line-height: 1.5;
  color: #333;
}

.comment-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.comment-like-btn, .comment-edit-btn, .comment-delete-btn, .reply-btn {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.comment-like-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.comment-like-btn.liked {
  background: #ffe8e8;
  border-color: #ff6b6b;
}

.comment-edit-btn:hover {
  background: #e3f2fd;
  border-color: #2196f3;
}

.comment-delete-btn:hover {
  background: #f8d7da;
  border-color: #dc3545;
  color: white;
}

.reply-btn:hover {
  background: #d1ecf1;
  border-color: #17a2b8;
}

.reply-form {
  margin-left: 40px;
  margin-top: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.reply-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

.cancel-btn {
  padding: 4px 8px;
  border: 1px solid #6c757d;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
}

.cancel-btn:hover {
  background: #f8f9fa;
}

.reply-item {
  padding: 20px;
  background: white;
  /* border: 1px solid #e9ecef; */
  border-bottom: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 15px;
}

.comment-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.pagination-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
}

.pagination-btn:hover:not(:disabled) {
  background: #f8f9fa;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}

.edit-form {
  max-width: 100%;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.error-message {
  padding: 12px;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
  margin-bottom: 20px;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.submit-btn, .cancel-btn {
  padding: 12px 30px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-btn {
  background-color: #4CAF50;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background-color: #45a049;
}

.submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.cancel-btn:hover {
  background-color: #e0e0e0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  text-align: center;
  min-width: 300px;
}

.modal h3 {
  margin-bottom: 15px;
  color: #333;
}

.modal p {
  margin-bottom: 20px;
  color: #666;
}

.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.delete-confirm-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.delete-confirm-btn:hover {
  background-color: #d32f2f;
}
</style>
