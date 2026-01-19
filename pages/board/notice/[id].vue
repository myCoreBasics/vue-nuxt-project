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
