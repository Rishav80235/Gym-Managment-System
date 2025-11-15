<script setup lang="ts">
import UserHeader from '../components/UserHeader.vue'
import MemberFooter from '../components/MemberFooter.vue'
</script>

<template>
  <div class="user-layout">
    <UserHeader />
    <main class="user-main">
      <router-view />
    </main>
    <MemberFooter />
  </div>
</template>

<style scoped>
.user-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f4ff;
}
.user-main {
  flex: 1;
  max-width: 960px;
  width: 100%;
  margin: 24px auto;
  padding: 0 16px 24px;
}
</style>
