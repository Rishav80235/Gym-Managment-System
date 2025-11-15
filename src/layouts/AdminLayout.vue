<script setup lang="ts">
import AdminHeader from '../components/AdminHeader.vue'
import AdminSidebar from '../components/AdminSidebar.vue'
import AdminFooter from '../components/AdminFooter.vue'
</script>

<template>
  <div class="admin-layout">
    <AdminHeader />
    <div class="admin-body">
      <AdminSidebar />
      <main class="admin-main">
        <router-view />
      </main>
    </div>
    <AdminFooter />
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.admin-body {
  display: flex;
  flex: 1;
  min-height: 0;
}
.admin-main {
  flex: 1;
  padding: 16px;
  overflow: auto;
  background: #f7f7fb;
}
</style>
