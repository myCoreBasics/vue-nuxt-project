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

    <!-- 로그인 했으면 프로필 메뉴 -->
    <div v-else>
      <div class="header">
        <h1>마이페이지</h1>
        <p class="subtitle">{{ user.name }}님 환영합니다!</p>
      </div>
      
      <div class="profile-container">
        <div class="profile-wrapper">
          <div class="profile-summary">
            <div class="summary-card">
              <div class="summary-avatar">
                <div class="avatar-placeholder">
                  {{ user.name.charAt(0).toUpperCase() }}
                </div>
              </div>
              <div class="summary-info">
                <h2>{{ user.name }}</h2>
                <p class="user-id">{{ user.userid }}</p>
                <div class="provider-badge" :class="user.provider">
                  {{ getProviderName(user.provider) }}
                </div>
              </div>
            </div>
          </div>
          <div class="profile-menu">
            <div class="menu-item" @click="navigateTo('/profile/info')">
              <div class="menu-icon">👤</div>
              <div class="menu-content">
                <h3>회원정보 수정</h3>
                <p>개인정보를 수정하고 관리할 수 있습니다.</p>
              </div>
              <div class="menu-arrow">→</div>
            </div>

            <div class="menu-item" @click="navigateTo('/profile/activity')">
              <div class="menu-icon">📝</div>
              <div class="menu-content">
                <h3>활동 내역</h3>
                <p>게시글, 댓글 등 활동 내역을 확인할 수 있습니다.</p>
              </div>
              <div class="menu-arrow">→</div>
            </div>

            <div class="menu-item" @click="navigateTo('/profile/settings')">
              <div class="menu-icon">⚙️</div>
              <div class="menu-content">
                <h3>설정</h3>
                <p>알림, 개인정보 보호 등 설정을 관리할 수 있습니다.</p>
              </div>
              <div class="menu-arrow">→</div>
            </div>
          </div>

          
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

// 사용자 정보
const user = ref(null)

// 페이지 접근 시 사용자 정보 확인
onMounted(() => {
  // 쿠키에서 사용자 정보 가져오기
  const cookies = useCookie('user_name')
  const userIdCookie = useCookie('user_id')
  
  if (cookies.value && userIdCookie.value) {
    user.value = {
      userid: userIdCookie.value,
      name: cookies.value,
      loginTime: new Date()
    }
  }
})

// 로그아웃 처리
const handleLogout = async () => {
  try {
    await $fetch('/api/auth/logout', {
      method: 'POST'
    })
    
    // 로그아웃 성공 시 메인페이지로 이동
    await navigateTo('/')
  } catch (error) {
    console.error('로그아웃 실패:', error)
    // 에러가 있어도 메인페이지로 이동
    await navigateTo('/')
  }
}

// 로그인 방식 이름 반환
const getProviderName = (provider) => {
  const providers = {
    'google': 'Google',
    'naver': 'Naver',
    'local': '일반'
  }
  return providers[provider] || provider
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
  margin-bottom: 40px;
}

.header h1 {
  color: #333;
  margin: 0 0 10px 0;
  font-size: 2.5rem;
}

.subtitle {
  color: #666;
  margin: 0;
  font-size: 1.1rem;
}

.profile-container {
  display: flex;
  justify-content: center;
}

.profile-wrapper {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.profile-menu {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background-color: #f8f9fa;
}

.menu-item.logout:hover {
  background-color: #fff5f5;
}

.menu-icon {
  font-size: 24px;
  margin-right: 20px;
  width: 40px;
  text-align: center;
}

.menu-icon.logout {
  color: #dc3545;
}

.menu-content {
  flex: 1;
}

.menu-content h3 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.menu-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.menu-arrow {
  font-size: 18px;
  color: #999;
  transition: transform 0.3s;
}

.menu-item:hover .menu-arrow {
  transform: translateX(5px);
}

.profile-summary {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 20px;
}

.summary-avatar {
  flex-shrink: 0;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  font-weight: 600;
}

.summary-info {
  flex: 1;
}

.summary-info h2 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 24px;
}

.user-id {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
}

.provider-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
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

.alert-warning {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}
</style>
