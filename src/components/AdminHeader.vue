<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { clearSession, getSession } from '../utils/auth'

const isMenuOpen = ref(false)
const profileRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)

const router = useRouter()

// Get current session to check user role
const session = computed(() => getSession())
const isAdmin = computed(() => session.value?.role === 'admin')

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

const goToProfile = () => {
  router.push({ name: 'admin-profile' })
  closeMenu()
}

const logout = () => {
  clearSession()
  closeMenu()
  router.push({ name: 'login' })
}

const goToAdmin = () => {
  router.push({ name: 'add-member' })
}

const goToMember = () => {
  router.push({ name: 'member-dashboard' })
}

const goToUser = () => {
  router.push({ name: 'user-home' })
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
  <header class="header">
    <div class="left">
      <img class="logo" src="/favicon.ico" alt="Logo" />
      <h1 class="title">Admin Panel</h1>
    </div>
    <div v-if="isAdmin" class="center">
      <button class="switch-btn" type="button" @click="goToAdmin">Admin</button>
      <button class="switch-btn" type="button" @click="goToMember">Member</button>
      <button class="switch-btn" type="button" @click="goToUser">User</button>
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
.header {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 16px;
  background: #0f172a;
  color: #fff;
  z-index: 10;
  gap: 12px;
}
.left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
}
.title {
  font-size: 16px;
  margin: 0;
}
.center {
  display: flex;
  gap: 10px;
  justify-content: center;
}
.switch-btn {
  padding: 6px 14px;
  border-radius: 999px;
  border: none;
  background: rgba(148, 163, 184, 0.15);
  color: #e2e8f0;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.switch-btn:hover {
  background: rgba(148, 163, 184, 0.35);
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(15, 23, 42, 0.25);
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
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: linear-gradient(135deg, #64748b, #1e293b);
  border: 2px solid #94a3b8;
}
.menu {
  position: absolute;
  right: 0;
  top: 48px;
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
@media (max-width: 760px) {
  .header {
    flex-wrap: wrap;
    padding: 10px;
    height: auto;
  }
  .center {
    order: 3;
    width: 100%;
    justify-content: flex-start;
    overflow-x: auto;
  }
}
</style>
