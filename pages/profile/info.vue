<template>
  <div class="container">
    <!-- 로그인 안 했으면 경고 표시 -->
    <div v-if="!user" class="profile-container">
      <div class="profile-wrapper">
        <div class="alert alert-warning">
          ⚠️ 로그인이 필요합니다.
        </div>
      </div>
    </div>

    <!-- 로그인 했으면 회원정보 수정 폼 -->
    <div v-else>
      <div class="header">
        <h1>회원정보 수정</h1>
      </div>
      
      <div class="profile-container">
        <div class="profile-wrapper">
          <form @submit.prevent="updateProfile" class="profile-form">

            <div class="form-group">
              <label for="userId">아이디</label>
              <input 
                type="text" 
                id="userId" 
                :value="user.userid" 
                readonly 
                class="form-control"
              />
              <small class="form-text text-muted">
                아이디는 수정할 수 없습니다.
              </small>
            </div>

            <div class="form-group">
              <label>가입 유형</label>
              <div class="provider-info">
                <span class="provider-badge" :class="user.provider">
                  {{ getProviderName(user.provider) }}
                </span>
              </div>
            </div>

            <div class="form-group">
              <label for="regdate">가입일</label>
              <input 
                type="text" 
                id="regdate" 
                :value="formatDate(user.regdate)" 
                readonly 
                class="form-control"
              />
              <small class="form-text text-muted">
                가입일은 수정할 수 없습니다.
              </small>
            </div>

            <div class="form-group">
              <label for="name">이름</label>
              <input 
                type="text" 
                id="name" 
                v-model="formData.name" 
                required 
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="email">이메일</label>
              <input 
                type="email" 
                id="email" 
                v-model="formData.email" 
                class="form-control"
                :disabled="user.provider !== 'local'"
                :readonly="user.provider !== 'local'"
              />
              <small v-if="user.provider !== 'local'" class="form-text text-muted">
                소셜 로그인 사용자는 이메일을 수정할 수 없습니다.
              </small>
            </div>

            <div class="form-group">
              <label for="password">비밀번호</label>
              <input 
                type="password" 
                id="password" 
                v-model="formData.password" 
                class="form-control"
                placeholder="새 비밀번호를 입력하세요"
              />
              <small class="form-text text-muted">
                비밀번호를 변경하려면 새 비밀번호를 입력하세요.
              </small>
            </div>

            <div class="form-group" v-if="formData.password">
              <label for="confirmPassword">비밀번호 확인</label>
              <input 
                type="password" 
                id="confirmPassword" 
                v-model="formData.confirmPassword" 
                class="form-control"
                placeholder="비밀번호를 다시 입력하세요"
              />
              <small class="form-text text-muted">
                비밀번호 변경을 위해 다시 입력하세요.
              </small>
            </div>

            <div class="form-group">
              <label for="job">직업</label>
              <input 
                type="text" 
                id="job" 
                v-model="formData.job" 
                class="form-control"
                placeholder="직업을 입력하세요"
              />
            </div>

            <div class="form-group">
              <label for="hobbies">취미</label>
              <input 
                type="text" 
                id="hobbies" 
                v-model="formData.hobbies" 
                class="form-control"
                placeholder="취미를 입력하세요 (여러 개일 경우 쉼표로 구분)"
              />
            </div>

            <div class="form-actions">
              <button 
                type="submit" 
                class="btn btn-primary"
                :disabled="loading"
              >
                {{ loading ? '저장 중...' : '저장' }}
              </button>
              
              <button 
                type="button" 
                @click="goBack"
                class="btn btn-secondary"
              >
                취소
              </button>
            </div>
          </form>

          <div v-if="message" class="alert" :class="message.type">
            {{ message.text }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 사용자 정보
const user = ref(null)

// 폼 데이터
const formData = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  job: '',
  hobbies: ''
})

// 상태
const loading = ref(false)
const message = ref(null)

// 페이지 접근 시 사용자 정보 확인
onMounted(() => {
  // 쿠키에서 사용자 정보 가져오기
  const userNameCookie = useCookie('user_name')
  const userIdCookie = useCookie('user_id')
  
  if (userNameCookie.value && userIdCookie.value) {
    user.value = {
      userid: userIdCookie.value,
      name: userNameCookie.value,
      loginTime: new Date()
    }
    
    // 실제 사용자 정보 API 호출 (필요시)
    fetchUserProfile()
  }
})

// 사용자 프로필 정보 가져오기
const fetchUserProfile = async () => {
  try {
    const response = await $fetch('/api/auth/profile', {
      method: 'GET'
    })
    
    console.log('Profile API response:', response) // 디버깅용
    
    if (response.success) {
      user.value = response.user
      formData.value = {
        name: response.user.name,
        email: response.user.email || '',
        job: response.user.job || '',
        hobbies: response.user.hobbies || ''
      }
      console.log('Form data set:', formData.value) // 디버깅용
      console.log('Email value:', formData.value.email) // 이메일 값 specifically 확인
      console.log('Response user email:', response.user.email) // API 응답 이메일 확인
    }
  } catch (error) {
    console.error('프로필 정보 조회 실패:', error)
    // API 실패시 쿠키 정보로 폼 초기화
    if (user.value) {
      formData.value = {
        name: user.value.name,
        email: '' // 기본값은 빈칸
      }
    }
  }
}

// 프로필 업데이트
const updateProfile = async () => {
  loading.value = true
  message.value = null
  
  console.log('updateProfile called with formData:', formData.value) // 디버깅용
  
  // 비밀번호 확인
  if (formData.value.password && formData.value.password !== formData.value.confirmPassword) {
    message.value = {
      type: 'alert-danger',
      text: '비밀번호가 일치하지 않습니다.'
    }
    loading.value = false
    return
  }
  
  try {
    const response = await $fetch('/api/auth/profile', {
      method: 'PUT',
      body: formData.value
    })
    
    console.log('Profile update response:', response) // 응답 로깅
    
    if (response.success) {
      message.value = {
        type: 'alert-success',
        text: '회원정보가 성공적으로 수정되었습니다.'
      }
      
      // 쿠키 업데이트
      const userNameCookie = useCookie('user_name')
      userNameCookie.value = formData.value.name
      
      // 사용자 정보 업데이트
      if (user.value) {
        user.value.name = formData.value.name
        user.value.email = formData.value.email
      }

      // 2초 후 profile/index로 이동
      setTimeout(() => {
        navigateTo('/profile')
      }, 500)
    } else {
      throw new Error(response.message || '수정 실패')
    }
  } catch (error) {
    message.value = {
      type: 'alert-danger',
      text: error.message || '회원정보 수정에 실패했습니다.'
    }
  } finally {
    loading.value = false
  }
}

// 로그인 방식 이름 반환
const getProviderName = (provider) => {
  const providers = {
    'google': 'Google',
    'naver': 'Naver',
    'local': '사이트 회원가입'
  }
  return providers[provider] || '사이트 회원가입'
}

// 날짜 포맷
const formatDate = (date) => {
  if (!date) return '정보 없음'
  return new Date(date).toLocaleDateString('ko-KR')
}

// 뒤로가기
const goBack = () => {
  navigateTo('/profile')
}
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  color: #333;
  margin: 0;
}

.profile-container {
  display: flex;
  justify-content: center;
}

.profile-wrapper {
  width: 100%;
  max-width: 500px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #333;
}

.form-control {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-control[readonly] {
  background-color: #f8f9fa;
  color: #6c757d;
}

.form-text {
  font-size: 12px;
  color: #6c757d;
}

.provider-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.provider-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  color: white;
}

.provider-badge.google {
  background-color: #4285f4;
}

.provider-badge.naver {
  background-color: #03c75a;
}

.provider-badge.local {
  background-color: #6c757d;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-primary:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.alert {
  padding: 12px;
  border-radius: 4px;
  margin-top: 20px;
}

.alert-warning {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
}

.alert-success {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.alert-danger {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.error {
  text-align: center;
  padding: 40px;
  color: #dc3545;
}
</style>
