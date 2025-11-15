<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { clearSession } from '../utils/auth'

const isMenuOpen = ref(false)
const profileRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)

const router = useRouter()

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

const goTo = (name: string) => {
  router.push({ name })
}

const goToProfile = () => {
  goTo('user-home')
  closeMenu()
}

const logout = () => {
  clearSession()
  closeMenu()
  goTo('login')
}

const handleClickOutside = (event: MouseEvent) => {
  if (
    isMenuOpen.value &&
    profileRef.value &&
    menuRef.value &&
    !profileRef.value.contains(event.target as Node) &&
    !menuRef.value.contains(event.target as Node)
  ) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <header class="user-header">
    <div class="left">
      <img class="logo" src="/favicon.ico" alt="Logo" />
      <div>
        <h1 class="title">User Hub</h1>
        <p class="subtitle">General information and quick access</p>
      </div>
    </div>
    <div class="right">
      <div ref="profileRef" class="profile" @click="toggleMenu">
        <div class="avatar" title="Profile"></div>
      </div>
      <div v-if="isMenuOpen" ref="menuRef" class="menu" @click.stop>
        <div class="menu-header">Account</div>
        <button class="menu-item" @click="goToProfile">Profile</button>
        <button class="menu-item danger" @click="logout">Logout</button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.user-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 18px;
  background: linear-gradient(135deg, #1e3a8a, #6366f1);
  color: #fff;
  box-shadow: 0 10px 24px rgba(30, 58, 138, 0.3);
  flex-wrap: wrap;
}
.left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.logo {
  width: 36px;
  height: 36px;
}
.title {
  margin: 0;
  font-size: 20px;
}
.subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  opacity: 0.8;
}
.right {
  position: relative;
  display: flex;
  align-items: center;
}
.profile {
  display: grid;
  place-items: center;
  cursor: pointer;
}
.avatar {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  background: linear-gradient(135deg, #818cf8, #312e81);
  border: 2px solid rgba(255, 255, 255, 0.6);
}
.menu {
  position: absolute;
  right: 0;
  top: 50px;
  width: 220px;
  background: #fff;
  color: #0f172a;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  padding: 8px;
}
.menu-header {
  font-weight: 600;
  font-size: 12px;
  color: #475569;
  padding: 6px 8px;
  text-transform: uppercase;
}
.menu-item {
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
}
.menu-item:hover {
  background: #f1f5f9;
}
.menu-item.danger {
  color: #b91c1c;
}
</style>
