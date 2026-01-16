<template>
  <div class="login-container">
    <div class="login-box">
      <h1>로그인</h1>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="userid">아이디</label>
          <input 
            type="text" 
            id="userid" 
            v-model="formData.userid"
            placeholder="아이디를 입력하세요"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="password">비밀번호</label>
          <input 
            type="password" 
            id="password" 
            v-model="formData.password"
            placeholder="비밀번호를 입력하세요"
            required
          />
        </div>
        
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <button type="submit" class="login-btn" :disabled="isLoading">
          {{ isLoading ? '로그인 중...' : '로그인' }}
        </button>
      </form>
      
      <div class="social-login-divider">
        <span>또는</span>
      </div>
      
      <div class="social-login-buttons">
        <button @click="handleGoogleLogin" class="social-btn google-btn">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google로 로그인
        </button>
        
        <button @click="handleNaverLogin" class="social-btn naver-btn">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="11" fill="#03C75A"/>
            <text x="12" y="17" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">N</text>
          </svg>
          네이버로 로그인
        </button>
      </div>
      
      <div class="register-link">
        <p>아직 회원이 아니신가요?</p>
        <button @click="goToRegister" class="register-btn">
          회원가입
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false,
  //middleware: 'auth'  // 미들웨어 적용
});


const router = useRouter();

// 이미 로그인되어 있으면 게시판으로 리다이렉트
// onMounted(() => {
//   const token = useCookie('auth_token');
//   if (token.value) {
//     router.push('/board/list');
//   }
// });

const formData = ref({
  userid: '',
  password: ''
});

const isLoading = ref(false);
const errorMessage = ref('');

const handleLogin = async () => {
    console.log('handleLogin 호출됨');
  if (isLoading.value) return;
  
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: formData.value
    });
    
    if (response.success) {
      router.push('/board/list');
    } else {
      errorMessage.value = response.error;
    }
  } catch (error) {
    console.error('Login error:', error);
    errorMessage.value = '로그인 중 오류가 발생했습니다.';
  } finally {
    isLoading.value = false;
  }
};

const goToRegister = () => {
  router.push('/register');
};

const handleGoogleLogin = () => {
  window.location.href = '/api/auth/google';
};

const handleNaverLogin = () => {
  window.location.href = '/api/auth/naver';
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
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

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
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

.login-btn {
  width: 100%;
  padding: 12px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-btn:hover:not(:disabled) {
  background-color: #5568d3;
}

.login-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.register-link {
  margin-top: 30px;
  text-align: center;
}

.register-link p {
  color: #666;
  margin-bottom: 10px;
  font-size: 14px;
}

.register-btn {
  padding: 10px 20px;
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.register-btn:hover {
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
</style>