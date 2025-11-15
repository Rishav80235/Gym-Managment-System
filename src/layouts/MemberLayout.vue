<script setup lang="ts">
import MemberHeader from '../components/MemberHeader.vue'
import MemberFooter from '../components/MemberFooter.vue'
</script>

<template>
  <div class="member-layout">
    <MemberHeader />
    <main class="member-main">
      <router-view />
    </main>
    <MemberFooter />
  </div>
</template>

<style scoped>
.member-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}
.member-main {
  flex: 1;
  padding: 24px 16px;
  max-width: 1080px;
  width: 100%;
  margin: 0 auto;
}
</style>

