<script setup lang="ts"></script>

<template>
  <footer class="footer">
    <div class="content">
      <div class="brand">
        <div class="title">Member Portal</div>
        <div class="muted">Stay connected with your fitness journey.</div>
      </div>
      <div class="links">
        <a class="link" href="#">Support</a>
        <a class="link" href="#">Privacy</a>
        <a class="link" href="#">Terms</a>
      </div>
      <div class="meta">
        <div class="muted">© {{ new Date().getFullYear() }} Gym Management System</div>
        <div class="muted small">Built for members</div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: #0f172a;
  color: #e2e8f0;
  padding: 20px 16px;
  margin-top: auto;
}
.content {
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
}
.title {
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 4px;
}
.muted {
  color: #cbd5f5;
  font-size: 14px;
}
.muted.small {
  font-size: 12px;
  opacity: 0.7;
}
.links {
  display: flex;
  gap: 16px;
}
.link {
  color: inherit;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}
.link:hover {
  color: #38bdf8;
}
@media (max-width: 768px) {
  .content {
    flex-direction: column;
    align-items: flex-start;
  }
  .links {
    order: 3;
  }
}
</style>

