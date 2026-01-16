<!-- pages/index.vue -->
<template>
  <div class="container">
    <!-- 로그인 안 했으면 경고 -->
    <div v-if="!user" class="profile-container">
      <div class="profile-wrapper">
        <div class="alert alert-warning">
          ⚠️ 로그인이 필요합니다.
        </div>
      </div>
    </div>

    <!-- 로그인 했을 때만 메인 화면 -->
    <div v-else>
      <div class="hero">
        <h1>🎉 최신 제품을 만나보세요</h1>
        <p>다양한 카테고리의 제품을 둘러보세요</p>
      </div>

      <div class="search-section">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="제품 검색..."
          class="search-input"
        />
      </div>

      <!-- 로딩 -->
      <div v-if="pending" class="loading">
        <div class="spinner"></div>
        <p>제품을 불러오는 중...</p>
      </div>

      <!-- 에러 -->
      <div v-else-if="error" class="error">
        <p>⚠️ 오류가 발생했습니다</p>
        <button @click="refresh">다시 시도</button>
      </div>

      <!-- 제품 목록 -->
      <div v-else>
        <div class="products-grid">
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            class="product-card"
          >
            <NuxtLink :to="`/products/${product.id}`" class="product-link">
              <div class="product-image">
                <img :src="product.thumbnail" :alt="product.title" />
                <span class="discount-badge" v-if="product.discountPercentage > 0">
                  -{{ Math.round(product.discountPercentage) }}%
                </span>
              </div>
              <div class="product-info">
                <span class="category">{{ product.category }}</span>
                <h3 class="product-title">{{ product.title }}</h3>
                <p class="product-description">{{ product.description }}</p>
                <div class="rating">
                  ⭐ {{ product.rating }} ({{ product.stock }}개 재고)
                </div>
                <div class="price-section">
                  <span class="price">${{ product.price }}</span>
                  <span class="original-price" v-if="product.discountPercentage > 0">
                    ${{ Math.round(product.price / (1 - product.discountPercentage / 100)) }}
                  </span>
                </div>
              </div>
            </NuxtLink>
            <button @click="addToCart(product)" class="add-to-cart-btn">
              🛒 장바구니 담기
            </button>
          </div>
        </div>

        <!-- 페이지네이션 -->
        <div class="pagination">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="page-btn"
          >
            ← 이전
          </button>
          <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="page-btn"
          >
            다음 →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCart } from '../composables/useCart'
const user = useCookie('user_name'); // 로그인 여부 체크
const userName = computed(() => user.value)
const route = useRoute();
const router = useRouter();

const { addToCart } = useCart()

const searchQuery = ref('')
const currentPage = ref(1)
const limit = 12

// 제품 데이터 가져오기
const { data: productsData, pending, error, refresh } = await useFetch('https://dummyjson.com/products', {
  query: {
    limit,
    skip: computed(() => (currentPage.value - 1) * limit)
  },
  watch: [currentPage],
  transform: (response) => response
})

const filteredProducts = computed(() => {
  const products = productsData.value?.products || []
  if (!searchQuery.value) return products
  
  const search = searchQuery.value.toLowerCase()
  return products.filter(p =>
    p.title.toLowerCase().includes(search) ||
    p.description.toLowerCase().includes(search) ||
    p.category.toLowerCase().includes(search)
  )
})

const totalPages = computed(() => {
  return Math.ceil((productsData.value?.total || 0) / limit)
})
</script>

<style scoped>
.hero {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  margin-bottom: 30px;
}

.hero h1 {
  font-size: 36px;
  margin-bottom: 10px;
}

.hero p {
  font-size: 18px;
  opacity: 0.9;
}

.search-section {
  margin-bottom: 30px;
}

.search-input {
  width: 100%;
  padding: 14px 20px;
  font-size: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
}

.loading {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 20px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 40px;
  background: #ffe6e6;
  border-radius: 8px;
  color: #c0392b;
}

.error button {
  margin-top: 16px;
  padding: 10px 24px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.15);
}

.product-link {
  text-decoration: none;
  color: inherit;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.product-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f8f9fa;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.discount-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #e74c3c;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.product-info {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.category {
  display: inline-block;
  background: #ecf0f1;
  color: #7f8c8d;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  text-transform: capitalize;
  margin-bottom: 8px;
  align-self: flex-start;
}

.product-title {
  font-size: 18px;
  margin: 8px 0;
  color: #2c3e50;
  line-height: 1.4;
}

.product-description {
  color: #7f8c8d;
  font-size: 14px;
  margin: 8px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.rating {
  margin: 8px 0;
  font-size: 14px;
  color: #f39c12;
}

.price-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}

.price {
  font-size: 24px;
  font-weight: bold;
  color: #27ae60;
}

.original-price {
  font-size: 16px;
  color: #95a5a6;
  text-decoration: line-through;
}

.add-to-cart-btn {
  width: 100%;
  padding: 12px;
  background: #3498db;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background 0.3s;
}

.add-to-cart-btn:hover {
  background: #2980b9;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin: 40px 0;
}

.page-btn {
  padding: 10px 20px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 16px;
  font-weight: 500;
}

.profile-container {
  /* min-height: calc(100vh - 80px); */
  background: white;
  /* padding: 2rem 0; */
}

.profile-wrapper {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem 1rem;
  text-align: center; /* 텍스트도 중앙으로 */
}

.user-info {
  color: #666;
  font-size: 14px;
}
</style>