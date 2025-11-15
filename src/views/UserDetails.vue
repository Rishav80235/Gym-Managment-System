<script setup lang="ts">
const detailSections = [
  {
    title: 'Profile Summary',
    description: 'Quick overview of your membership and contact information.',
  },
  {
    title: 'Recent Activity',
    description: 'Latest billing, class bookings, and package upgrades.',
  },
  {
    title: 'Support Tickets',
    description: 'Open issues and their current resolution status.',
  },
]
</script>

<template>
  <section class="details-page">
    <header class="page-header">
      <h2>View Details</h2>
      <p>Review important information consolidated from the member and admin dashboards.</p>
    </header>

    <div class="grid">
      <article v-for="section in detailSections" :key="section.title" class="card">
        <h3>{{ section.title }}</h3>
        <p>{{ section.description }}</p>
        <button class="primary-btn" type="button">Open section</button>
      </article>
    </div>
  </section>
</template>

<style scoped>
.details-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.page-header h2 {
  margin: 0 0 8px;
  font-size: 26px;
  color: #312e81;
}
.page-header p {
  margin: 0;
  color: #4c1d95;
  opacity: 0.8;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
}
.card {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.card h3 {
  margin: 0;
  color: #1e3a8a;
}
.card p {
  margin: 0;
  color: #475569;
}
.primary-btn {
  align-self: flex-start;
  padding: 8px 16px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #6366f1, #4338ca);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(79, 70, 229, 0.25);
}
@media (max-width: 640px) {
  .page-header h2 {
    font-size: 24px;
  }
}
</style>
