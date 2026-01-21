<template>
  <div class="container">
    <div v-if="!user" class="activity-container">
      <div class="activity-wrapper">
        <div class="alert alert-warning">
          ⚠️ 로그인이 필요합니다.
        </div>
      </div>
    </div>
 
    <!-- 로그인 했으면 활동 내역 표시 -->
    <div v-else>
      <div class="header">
        <h1>활동 내역</h1>
        <p class="subtitle">{{ user.name }}님의 최근 활동 내역입니다.</p>
      </div>

      <div class="activity-container">
        <div class="activity-wrapper">
          <!-- 검색 및 필터 옵션 -->
          <div class="filter-options">
            <div class="filters-row">
              <select v-model="categoryFilter" @change="handleFilterChange" class="filter-select">
                <option value="">모든 카테고리</option>
                <option value="공지사항">공지사항</option>
                <option value="자유게시판">자유게시판</option>
                <option value="Q&A">Q&A</option>
                <option value="팁&노하우">팁&노하우</option>
              </select>
              
              <select v-model="dateFilter" @change="handleFilterChange" class="filter-select">
                <option value="">모든 기간</option>
                <option value="today">오늘</option>
                <option value="week">이번 주</option>
                <option value="month">이번 달</option>
                <option value="year">올해</option>
              </select>
              
              <div class="search-box">
                <div class="search-input-wrapper">
                  <input 
                    type="text" 
                    v-model="searchQuery"
                    @keyup.enter="executeSearch"
                    placeholder="검색어를 입력하세요."
                    class="search-input"
                  />
                  <button 
                    v-if="searchQuery.trim()"
                    @click="clearSearch"
                    class="search-clear-button"
                    type="button"
                  >
                    ✕
                  </button>
                </div>
                <button @click="executeSearch" class="search-button">🔍</button>
              </div>
            </div>
          </div>
          <!-- 활동 필터 -->
          <div class="activity-filters">
            <div class="filter-tabs">
              <button 
                v-for="tab in tabs" 
                :key="tab.value"
                @click="handleTabClick(tab.value)"
                :class="['tab-button', { active: activeTab === tab.value }]"
                style="position: relative; z-index: 10;"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>
 
          <!-- 활동 내역 목록 -->
          <div class="activity-list">
            <div v-if="loading" class="loading">
              <div class="spinner"></div>
              <p>활동 내역을 불러오는 중...</p>
            </div>
 
            <div v-else-if="activities.length === 0" class="empty-state">
              <div class="empty-icon">📭</div>
              <h3>활동 내역이 없습니다</h3>
              <p>아직 활동 내역이 없습니다. 게시글을 작성하거나 댓글을 남겨보세요!</p>
            </div>
 
            <div v-else class="activity-items">
              <div 
                v-for="activity in activities" 
                :key="activity.id"
                class="activity-item"
                @click="handleActivityClick(activity)"
              >
                <div class="activity-icon">
                  {{ getActivityIcon(activity.type) }}
                </div>
                <div class="activity-content">
                  <h4>{{ getActivityTitle(activity) }}</h4>
                  <p>{{ getActivityDescription(activity) }}</p>
                  <div class="activity-meta">
                    <span class="date">{{ formatDate(activity.regdate) }}</span>
                    <span class="category">{{ getCategoryName(activity.category) }}</span>
                  </div>
                </div>
                <div class="activity-arrow">→</div>
              </div>
            </div>
          </div>
 
          <!-- 페이지네이션 -->
          <div class="pagination" v-if="totalPages > 0">
            <button 
              @click="goToPage(currentPage - 1)" 
              :disabled="currentPage === 1"
              class="pagination-button"
            >
              이전
            </button>
            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
            <button 
              @click="goToPage(currentPage + 1)" 
              :disabled="currentPage === totalPages"
              class="pagination-button"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
 
<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 사용자 정보
const user = ref(null)

// 상태
const loading = ref(true)
const activities = ref([])
const route = useRoute()
const router = useRouter()
const activeTab = ref(route.query.tab || 'all')
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 10

// 검색 및 필터 상태
const searchQuery = ref('')
const categoryFilter = ref('')
const dateFilter = ref('')
const searchTimeout = ref(null)
 
// 필터 탭
const tabs = [
  { label: '전체', value: 'all' },
  { label: '게시글', value: 'post' },
  { label: '댓글', value: 'comment' },
  { label: '좋아요', value: 'like' }
]

// 탭 클릭 처리
const handleTabClick = (tabValue) => {
  console.log('Tab clicked:', tabValue)
  activeTab.value = tabValue
  
  // URL 업데이트 (탭 상태 유지)
  router.push({
    path: route.path,
    query: { tab: tabValue }
  })
  
  // 페이지만 초기화 (필터는 유지)
  currentPage.value = 1
  
  // 활동 내역 다시 불러오기
  fetchActivities()
}

// 페이지 접근 시 사용자 정보 확인
onMounted(() => {
  // 쿠키에서 사용자 정보 가져오기
  const userNameCookie = useCookie('user_name', { 
    default: () => null 
  })
  const userIdCookie = useCookie('user_id', { 
    default: () => null 
  })
  
  console.log('Cookies check:', {
    userName: userNameCookie.value,
    userId: userIdCookie.value
  })
 
  if (userNameCookie.value && userIdCookie.value) {
    user.value = {
      userid: userIdCookie.value,
      name: userNameCookie.value
    }
    
    console.log('User set:', user.value)

    // 활동 내역 불러오기
    fetchActivities()
  } else {
    console.log('No user cookies found')
    loading.value = false
  }
})
 
// 활동 내역 불러오기
const fetchActivities = async () => {
  loading.value = true

  try { 
    const query = {
      page: currentPage.value,
      limit: pageSize,
      type: activeTab.value === 'all' ? null : activeTab.value
    }
    
    // 검색 및 필터 파라미터 추가
    if (searchQuery.value.trim()) {
      query.search = searchQuery.value.trim()
    }
    if (categoryFilter.value) {
      query.category = categoryFilter.value
    }
    if (dateFilter.value) {
      query.dateFilter = dateFilter.value
    }

    console.log('API Query params:', query)
    console.log('Current filters:', {
      search: searchQuery.value,
      category: categoryFilter.value,
      date: dateFilter.value,
      tab: activeTab.value
    })

    const response = await $fetch('/api/auth/activities', {
      method: 'GET',
      query: query
    })

    console.log('Activities API response:', response)

    if (response.success) {
      activities.value = response.activities
      totalPages.value = response.pagination.totalPages
    } else {
      throw new Error(response.message || '활동 내역 조회 실패')
    }

  } catch (error) {
    console.error('활동 내역 조회 실패:', error)
  } finally {
    loading.value = false
  }
}

// 검색 실행 (버튼 클릭 또는 엔터 키)
const executeSearch = () => {
  currentPage.value = 1
  fetchActivities()
}

// 검색 초기화
const clearSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
  fetchActivities()
}

// 페이지 이동 처리
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchActivities()
  }
}

// 필터 변경 처리
const handleFilterChange = () => {
  currentPage.value = 1
  fetchActivities()
}
 
// 활동 아이콘
const getActivityIcon = (type) => {
  const icons = {
    post: '📝',
    comment: '💬',
    like: '❤️'
  }
  return icons[type] || '📋'
}
 
// 활동 제목
const getActivityTitle = (activity) => {
  if (activity.type === 'post') return `"${activity.title}" 게시글 작성.` 
  if (activity.type === 'comment') {
    if (activity.parentId) {
      // 대댓글: 댓글 내용의 일부만 표시
      const commentContent = activity.content || '내용 없음'
      // const truncatedContent = commentContent.length > 20 ? `${commentContent.substring(0, 20)}...` : commentContent
      if (activity.title === '게시글이 삭제되었습니다') {
        return `"${activity.title}" 대댓글 작성.` 
      } else {
        return `"${activity.title}" 게시글에 대댓글.` 
      }
    } else {
      if (activity.title === '게시글이 삭제되었습니다') {
        return '게시글이 삭제되었습니다' 
      } else {
        return `"${activity.title}" 게시글에 댓글.` 
      }
    }
  }
  if (activity.type === 'like') {
    if (activity.title === '게시글이 삭제되었습니다') {
      return '게시글이 삭제되었습니다' 
    } else {
      return `"${activity.title}" 게시글에 좋아요.` 
    }
  }
  return '활동'
}
 
// 활동 설명
const getActivityDescription = (activity) => {
  if (activity.type === 'post') {
    const content = activity.content || activity.title || '제목 없음'
    return content.length > 50 ? `${content.substring(0, 50)}...` : content
  }
  if (activity.type === 'comment') return activity.content
  if (activity.type === 'like') return activity.content
  return '활동 내역'
}
 
// 카테고리 이름
const getCategoryName = (category) => {
  return category || '기타'
}
 
// 날짜 포맷
const formatDate = (date) => {
  if (!date) return '정보 없음'
  
  console.log('Original date:', date)
  const target = new Date(date)
  console.log('Parsed date:', target)
  console.log('Is valid date:', !isNaN(target.getTime()))
  
  const now = new Date()
  const diff = now - target
  console.log('Time diff (ms):', diff)
  
  // 유효한 날짜인지 확인
  if (isNaN(target.getTime())) {
    return '정보 없음'
  }

  // 1분 이내: "방금 전"
  if (diff < 60000) {
    return '방금 전'
  }

  // 1시간 이내: "N분 전"
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}분 전`
  }

  // 24시간 이내: "N시간 전"
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours}시간 전`
  }

  // 7일 이내: "N일 전"
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000)
    return `${days}일 전`
  }

  // 그 외: 날짜만 표시
  return target.toLocaleDateString('ko-KR')
}
 
// 활동 클릭 처리
const handleActivityClick = (activity) => {
  // TODO: 게시글로 이동하는 로직 구현
  console.log('활동 클릭:', activity)

  if (activity.type === 'post' || activity.type === 'comment' || activity.type === 'like') {
    // 카테고리에 따른 경로 결정
    let boardPath = '/board/free' // 기본값
    
    switch (activity.category) {
      case '공지사항':
        boardPath = '/board/notice'
        break
      case '자유게시판':
        boardPath = '/board/free'
        break
      case 'Q&A':
        boardPath = '/board/qna'
        break
      case '팁&노하우':
        boardPath = '/board/tips'
        break
      default:
        boardPath = '/board/free'
    }
    
    // 게시글로 이동
    navigateTo(`${boardPath}/${activity.boardId}`)
  }
}
 
// 탭 변경 시 활동 내역 다시 불러오기
watch(activeTab, (newTab, oldTab) => {
  console.log('Tab changed:', oldTab, '->', newTab)
})
 
// 페이지 변경 시 활동 내역 다시 불러오기
watch(currentPage, () => {
  fetchActivities()
})
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
  margin-bottom: 10px;
  font-size: 2rem;
}
 
.subtitle {
  color: #666;
  font-size: 1rem;
}
 
.activity-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
 
.activity-wrapper {
  padding: 30px;
}
 
/* 필터 탭 */
.activity-filters {
  margin-bottom: 30px;
}
 
.filter-tabs {
  display: flex;
  gap: 10px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
}
 
.tab-button {
  padding: 10px 20px;
  border: none;
  background: none;
  color: #666;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}
 
.tab-button:hover {
  background: #f8f9fa;
}
 
.tab-button.active {
  background: #007bff;
  color: white;
}

/* 필터 옵션 */
.filter-options {
  margin-bottom: 20px;
  padding: 5px;
  /* background: white; */
  /* border-radius: 8px; */
  /* border: 1px solid #e9ecef; */
}

.filters-row {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  gap: 10px;
  flex: 1;
  min-width: 250px;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 10px 40px 10px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.3s ease;
  width: 100%;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.search-clear-button {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 14px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.search-clear-button:hover {
  background: #f0f0f0;
  color: #666;
}

.search-button {
  padding: 10px 15px;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  white-space: nowrap;
}

.search-button:hover {
  background: #0056b3;
}

.filter-select {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s ease;
  min-width: 150px;
}

.filter-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

/* 로딩 상태 */
.loading {
  text-align: center;
  padding: 40px;
}
 
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}
 
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
 
/* 빈 상태 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}
 
.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}
 
.empty-state h3 {
  color: #333;
  margin-bottom: 10px;
}
 
.empty-state p {
  color: #666;
}
 
/* 활동 목록 */
.activity-list {
  min-height: 400px;
}
 
.activity-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
 
.activity-item {
  display: flex;
  align-items: center;
  padding: 20px;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}
 
.activity-item:hover {
  background: #f8f9fa;
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.1);
}
 
.activity-icon {
  font-size: 2rem;
  margin-right: 20px;
  flex-shrink: 0;
}
 
.activity-content {
  flex: 1;
}
 
.activity-content h4 {
  color: #333;
  margin-bottom: 5px;
  font-size: 1.1rem;
}
 
.activity-content p {
  color: #666;
  margin-bottom: 10px;
  font-size: 0.9rem;
}
 
.activity-meta {
  display: flex;
  gap: 15px;
  font-size: 0.8rem;
  color: #999;
}
 
.activity-arrow {
  color: #ccc;
  font-size: 1.2rem;
  margin-left: 15px;
}
 
/* 페이지네이션 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}
 
.pagination-button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  color: #333;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}
 
.pagination-button:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #007bff;
}
 
.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
 
.page-info {
  color: #666;
  font-weight: 500;
}
 
/* 반응형 */
@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
 
  .activity-wrapper {
    padding: 20px;
  }
 
  .filter-tabs {
    flex-wrap: wrap;
  }
 
  .tab-button {
    font-size: 0.8rem;
    padding: 8px 15px;
  }
 
  .activity-item {
    padding: 15px;
  }
 
  .activity-icon {
    font-size: 1.5rem;
    margin-right: 15px;
  }
 
  .activity-meta {
    flex-direction: column;
    gap: 5px;
  }
}
</style>