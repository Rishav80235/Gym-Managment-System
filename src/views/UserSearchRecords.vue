<script setup lang="ts">
import { ref } from 'vue'

const query = ref('')
const results = ref([
  { type: 'Member', label: 'Alex Johnson', detail: 'Elite Plus package, joined 2023-09-15' },
  { type: 'Invoice', label: 'INV-0014', detail: 'Due on 2025-03-04 for $120.00' },
  { type: 'Notification', label: 'Payment Reminder', detail: 'Sent 2 days ago' },
])

const handleSearch = () => {
  // Placeholder search logic; integrate with backend later.
  console.info('Searching for', query.value)
}
</script>

<template>
  <section class="search-page">
    <header class="page-header">
      <h2>Search Records</h2>
      <p>Look up members, invoices, notifications, or support tickets in one place.</p>
    </header>

    <form class="search-form" @submit.prevent="handleSearch">
      <input v-model="query" type="search" placeholder="Search by name, invoice, or keyword..." />
      <button class="primary-btn" type="submit">Search</button>
    </form>

    <div class="results">
      <article v-for="item in results" :key="item.label" class="result-card">
        <div class="badge">{{ item.type }}</div>
        <h3>{{ item.label }}</h3>
        <p>{{ item.detail }}</p>
        <button class="ghost-btn" type="button">View record</button>
      </article>
    </div>
  </section>
</template>

<style scoped>
.search-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.page-header h2 {
  margin: 0 0 8px;
  font-size: 26px;
  color: #1d4ed8;
}
.page-header p {
  margin: 0;
  color: #1e293b;
  opacity: 0.8;
}
.search-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
}
input[type='search'] {
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid #cbd5f5;
  font-size: 15px;
  font-family: inherit;
  transition:
    border 0.15s ease,
    box-shadow 0.15s ease;
}
input[type='search']:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  outline: none;
}
.primary-btn {
  padding: 12px 24px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.25);
}
.results {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
}
.result-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.badge {
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.15);
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.result-card h3 {
  margin: 0;
  color: #0f172a;
}
.result-card p {
  margin: 0;
  color: #475569;
}
.ghost-btn {
  align-self: flex-start;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.35);
  background: transparent;
  color: #1d4ed8;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.ghost-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.2);
}
@media (max-width: 560px) {
  .search-form {
    grid-template-columns: 1fr;
  }
  .primary-btn {
    width: 100%;
  }
}
</style>
