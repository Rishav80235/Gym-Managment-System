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

const goTo = (name: string) => {
  router.push({ name })
}

const goToProfile = () => {
  router.push({ name: 'member-profile' })
  closeMenu()
}

const logout = () => {
  clearSession()
  closeMenu()
  router.push({ name: 'login' })
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <header class="member-header">
    <div class="left">
      <img class="logo" src="/favicon.ico" alt="Logo" />
      <h1 class="title">Member Portal</h1>
    </div>

    <div class="center">
      <button class="action-btn" type="button" @click="goTo('view-bill-receipts')">
        View Bill Receipts
      </button>
      <button class="action-btn secondary" type="button" @click="goTo('view-bill-notifications')">
        View Bill Notification
      </button>
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
.member-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: max-content 1fr max-content;
  align-items: center;
  gap: 16px;
  min-height: 60px;
  padding: 10px 16px;
  background: linear-gradient(120deg, #0f172a, #1e293b);
  color: #fff;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.25);
}
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
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
  font-size: 18px;
  margin: 0;
  letter-spacing: 0.4px;
}
.right {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
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
.center {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
.action-btn {
  padding: 8px 18px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #38bdf8, #2563eb);
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.2px;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.action-btn.secondary {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(56, 189, 248, 0.35);
}
.action-btn.secondary:hover {
  box-shadow: 0 6px 14px rgba(245, 158, 11, 0.35);
}

@media (max-width: 900px) {
  .member-header {
    grid-template-columns: 1fr;
    justify-items: center;
    padding: 12px;
    gap: 12px;
  }
  .left,
  .right {
    justify-content: center;
    width: 100%;
  }
  .center {
    width: 100%;
    justify-content: center;
  }
}
</style>
