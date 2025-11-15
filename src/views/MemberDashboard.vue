<script setup lang="ts">
const quickLinks = [
  { label: 'Upcoming Sessions', description: 'Check your scheduled workouts and bookings.' },
  { label: 'Nutrition Plan', description: 'View your personalized diet plan and notes.' },
  { label: 'Trainer Feedback', description: 'Review feedback and track improvements.' },
]
</script>

<template>
  <section class="member-dashboard">
    <header class="hero">
      <h2>Welcome Back!</h2>
      <p>Track your bills, monitor your progress, and stay informed about gym happenings.</p>
    </header>

    <div class="cards">
      <article class="card callout">
        <h3>Billing Center</h3>
        <p>
          Keep an eye on your recent bills and notifications. Use the header buttons above to jump
          directly to detailed receipts or latest alerts.
        </p>
      </article>

      <article v-for="item in quickLinks" :key="item.label" class="card">
        <h3>{{ item.label }}</h3>
        <p>{{ item.description }}</p>
        <button type="button" class="card-btn">View</button>
      </article>
    </div>
  </section>
</template>

<style scoped>
.member-dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.hero {
  background: linear-gradient(135deg, #2563eb, #38bdf8);
  color: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 16px 30px rgba(37, 99, 235, 0.25);
}
.hero h2 {
  margin: 0 0 6px;
  font-size: 24px;
}
.hero p {
  margin: 0;
  opacity: 0.9;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}
.card {
  background: #ffffff;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.card.callout {
  grid-column: span 2;
  background: #1e293b;
  color: #e2e8f0;
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.35);
}
.card h3 {
  margin: 0;
  font-size: 18px;
}
.card p {
  margin: 0;
  color: inherit;
  opacity: 0.9;
}
.card-btn {
  align-self: flex-start;
  padding: 8px 16px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #38bdf8, #2563eb);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.card-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(56, 189, 248, 0.35);
}
@media (max-width: 780px) {
  .card.callout {
    grid-column: span 1;
  }
}
</style>

