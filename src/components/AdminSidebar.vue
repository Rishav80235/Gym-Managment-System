<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

type NavItem = { label: string; routeName: string }
const items: NavItem[] = [
  { label: 'Add Member', routeName: 'add-member' },
  { label: 'Update/Delete Members', routeName: 'manage-members' },
  { label: 'Pending Registrations', routeName: 'pending-registrations' },
  { label: 'Create Bills', routeName: 'create-bills' },
  { label: 'Assign Fee Package', routeName: 'assign-fee' },
  { label: 'Assign Notification for monthly', routeName: 'monthly-notifications' },
  { label: 'Report export', routeName: 'report-export' },
  { label: 'Supplement store', routeName: 'supplement-store' },
  { label: 'Diet Details', routeName: 'diet-details' },
]

const isActive = (name: string) => computed(() => route.name === name)
const go = (name: string) => router.push({ name })
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">Admin Panel</div>
    <nav class="nav">
      <button
        v-for="item in items"
        :key="item.routeName"
        class="nav-item"
        :class="{ active: isActive(item.routeName).value }"
        @click="go(item.routeName)"
      >
        {{ item.label }}
      </button>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  background: #111827;
  color: #e5e7eb;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #1f2937;
}
.sidebar-header {
  padding: 16px;
  font-weight: 700;
  border-bottom: 1px solid #1f2937;
}
.nav {
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 6px;
}
.nav-item {
  text-align: left;
  padding: 10px 12px;
  border-radius: 8px;
  background: transparent;
  color: #e5e7eb;
  border: 1px solid transparent;
  cursor: pointer;
}
.nav-item:hover {
  background: #1f2937;
}
.nav-item.active {
  background: #374151;
  border-color: #4b5563;
}
</style>
