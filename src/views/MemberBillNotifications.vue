<script setup lang="ts">
const notifications = [
  {
    id: 1,
    title: 'Upcoming Payment Due',
    detail: 'Your membership payment of $120 is due on March 4, 2025.',
    type: 'reminder',
    time: '2 days ago',
  },
  {
    id: 2,
    title: 'Payment Received',
    detail: 'We received your February payment. Thank you for staying on track!',
    type: 'success',
    time: '1 month ago',
  },
  {
    id: 3,
    title: 'New Offer',
    detail: 'Get 10% off on personal training sessions this month.',
    type: 'info',
    time: '3 weeks ago',
  },
]
</script>

<template>
  <section class="notification-page">
    <header class="page-header">
      <h2>Bill Notifications</h2>
      <p>Stay informed about payment reminders, confirmations, and special offers.</p>
    </header>

    <div class="list">
      <article v-for="note in notifications" :key="note.id" class="item" :class="note.type">
        <div class="indicator" />
        <div>
          <div class="title">{{ note.title }}</div>
          <div class="detail">{{ note.detail }}</div>
          <div class="time">{{ note.time }}</div>
        </div>
        <button class="mark-btn" type="button">Mark as read</button>
      </article>
    </div>
  </section>
</template>

<style scoped>
.notification-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.page-header h2 {
  margin: 0 0 8px;
  font-size: 24px;
}
.page-header p {
  margin: 0;
  color: #64748b;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.item {
  position: relative;
  display: flex;
  gap: 16px;
  align-items: center;
  background: #ffffff;
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}
.indicator {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: #38bdf8;
  flex-shrink: 0;
}
.item.reminder .indicator {
  background: #f59e0b;
}
.item.success .indicator {
  background: #22c55e;
}
.item.info .indicator {
  background: #38bdf8;
}
.title {
  font-weight: 700;
  margin-bottom: 4px;
  color: #0f172a;
}
.detail {
  color: #475569;
  margin-bottom: 6px;
}
.time {
  font-size: 12px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.mark-btn {
  margin-left: auto;
  border: none;
  background: transparent;
  color: #2563eb;
  font-weight: 600;
  cursor: pointer;
}
.mark-btn:hover {
  text-decoration: underline;
}
@media (max-width: 720px) {
  .item {
    flex-direction: column;
    align-items: flex-start;
  }
  .mark-btn {
    margin-left: 0;
  }
}
</style>
