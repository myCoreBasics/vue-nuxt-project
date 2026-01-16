<template>
  <div class="register-container">
    <div class="register-box">
      <h1>회원가입</h1>
      
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="userid">아이디 *</label>
          <input 
            type="text" 
            id="userid" 
            v-model="formData.userid"
            placeholder="아이디를 입력하세요"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="name">이름 *</label>
          <input 
            type="text" 
            id="name" 
            v-model="formData.name"
            placeholder="이름을 입력하세요"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="password">비밀번호 *</label>
          <input 
            type="password" 
            id="password" 
            v-model="formData.password"
            placeholder="비밀번호를 입력하세요"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="email">이메일 *</label>
          <input 
            type="email" 
            id="email" 
            v-model="formData.email"
            placeholder="이메일을 입력하세요"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="job">직업</label>
          <select id="job" v-model="formData.job">
            <option value="">선택하세요</option>
            <option value="회사원">회사원</option>
            <option value="공무원">공무원</option>
            <option value="자영업">자영업</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>취미</label>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" value="영화감상" v-model="formData.hobbies" />
              영화감상
            </label>
            <label class="checkbox-label">
              <input type="checkbox" value="음악청취" v-model="formData.hobbies" />
              음악청취
            </label>
            <label class="checkbox-label">
              <input type="checkbox" value="스포츠" v-model="formData.hobbies" />
              스포츠
            </label>
          </div>
        </div>
        
        <div class="form-group">
          <label>성별</label>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" value="남성" v-model="formData.gender" />
              남성
            </label>
            <label class="radio-label">
              <input type="radio" value="여성" v-model="formData.gender" />
              여성
            </label>
          </div>
        </div>
        
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <div class="button-group">
          <button type="submit" class="submit-btn" :disabled="isLoading">
            {{ isLoading ? '가입 중...' : '가입하기' }}
          </button>
          <button type="button" @click="goToLogin" class="cancel-btn">
            취소
          </button>
        </div>
      </form>
      
      <div class="social-login-divider">
        <span>또는 소셜 계정으로 가입</span>
      </div>
      
      <div class="social-login-buttons">
        <button @click="handleGoogleLogin" class="social-btn google-btn">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google로 가입
        </button>
        
        <button @click="handleNaverLogin" class="social-btn naver-btn">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="11" fill="#03C75A"/>
            <text x="12" y="17" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">N</text>
          </svg>
          네이버로 가입
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
});

const router = useRouter();

const formData = ref({
  userid: '',
  name: '',
  password: '',
  email: '',
  job: '',
  hobbies: [],
  gender: ''
});

const isLoading = ref(false);
const errorMessage = ref('');

const handleRegister = async () => {
  if (isLoading.value) return;
  
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      body: formData.value
    });
    
    if (response.success) {
      alert('회원가입이 완료되었습니다.');
      router.push('/');
    } else {
      errorMessage.value = response.error;
    }
  } catch (error) {
    console.error('Register error:', error);
    errorMessage.value = '회원가입 중 오류가 발생했습니다.';
  } finally {
    isLoading.value = false;
  }
};

const goToLogin = () => {
  router.push('/login');
};

const handleGoogleLogin = () => {
  window.location.href = '/api/auth/google';
};

const handleNaverLogin = () => {
  window.location.href = '/api/auth/naver';
};
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-box {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 500px;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: bold;
  font-size: 14px;
}

.form-group input[type="text"],
.form-group input[type="password"],
.form-group input[type="email"],
.form-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.checkbox-group,
.radio-group {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.checkbox-label,
.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input,
.radio-label input {
  cursor: pointer;
}

.error-message {
  padding: 12px;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 30px;
}

.submit-btn,
.cancel-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-btn {
  background-color: #667eea;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background-color: #5568d3;
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

  .social-login-divider {
    text-align: center;
    margin: 30px 0 20px;
    position: relative;
  }

  .social-login-divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background-color: #ddd;
  }

  .social-login-divider span {
    background-color: white;
    padding: 0 15px;
    color: #666;
    font-size: 14px;
    position: relative;
  }

  .social-login-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }

  .social-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
    background-color: white;
  }

  .social-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .google-btn:hover {
    background-color: #4285f4;
    color: white;
  }

  .naver-btn {
    border-color: #03c75a;
    color: #03c75a;
  }

  .naver-btn:hover {
    background-color: #03c75a;
    color: white;
  }

  .login-link {
    text-align: center;
    padding-top: 20px;
    border-top: 1px solid #eee;
    color: #666;
  }

  .login-link-text {
    color: #667eea;
    text-decoration: none;
    font-weight: 500;
    margin-left: 5px;
  }

  .login-link-text:hover {
    text-decoration: underline;
  }
</style>