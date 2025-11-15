<script setup lang="ts"></script>

<template>
  <footer class="footer">
    <div class="grid">
      <div>
        <div class="title">Gym Management System</div>
        <div class="muted">All rights reserved © {{ new Date().getFullYear() }}</div>
      </div>
      <div>
        <div class="title">Contact</div>
        <div class="muted">Email: support@gym.local</div>
        <div class="muted">Phone: +1 (000) 123-4567</div>
      </div>
      <div>
        <div class="title">Address</div>
        <div class="muted">123 Fitness Ave, Wellness City</div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 16px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.title {
  font-weight: 700;
  margin-bottom: 6px;
}
.muted {
  color: #6b7280;
  font-size: 14px;
}
@media (max-width: 800px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
