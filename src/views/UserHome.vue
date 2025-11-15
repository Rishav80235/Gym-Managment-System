<script setup lang="ts">
const quickAccess = [
  {
    title: 'Membership Snapshot',
    description: 'See current package, renewal date, and remaining personal training credits.',
    action: 'View membership',
    route: 'member-profile',
  },
  {
    title: 'Billing Overview',
    description: 'Review latest invoices and download receipts with a single click.',
    action: 'Go to receipts',
    route: 'view-bill-receipts',
  },
  {
    title: 'Report an Issue',
    description: 'Let us know if you encounter problems or need assistance.',
    action: 'Contact support',
    route: 'member-dashboard',
  },
]
</script>

<template>
  <section class="user-home">
    <header class="hero">
      <h2>Welcome to the User Hub</h2>
      <p>
        Navigate seamlessly between the admin tools, member portal, and general user updates using
        the header shortcuts above.
      </p>
      <button class="primary-btn" type="button">Explore latest updates</button>
    </header>

    <div class="grid">
      <article class="card highlights">
        <h3>Today&rsquo;s Highlights</h3>
        <ul>
          <li>3 members upgraded to Elite Plus</li>
          <li>5 new diet plans awaiting review</li>
          <li>Billing reminders scheduled for tomorrow</li>
        </ul>
      </article>

      <article class="card quick-view">
        <h3>Need to switch views?</h3>
        <p>Use the quick links below or the header buttons to jump to the right workspace.</p>
        <div class="links">
          <router-link class="link" :to="{ name: 'add-member' }">Admin Panel</router-link>
          <router-link class="link" :to="{ name: 'member-dashboard' }">Member Portal</router-link>
          <router-link class="link" :to="{ name: 'user-home' }">User Hub</router-link>
        </div>
      </article>
    </div>

    <div class="cards">
      <article v-for="item in quickAccess" :key="item.title" class="card">
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
        <router-link class="ghost-btn" :to="{ name: item.route }">{{ item.action }}</router-link>
      </article>
    </div>
  </section>
</template>

<style scoped>
.user-home {
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.hero {
  background: linear-gradient(135deg, #4338ca, #6366f1);
  color: #fff;
  padding: 28px;
  border-radius: 18px;
  box-shadow: 0 18px 36px rgba(67, 56, 202, 0.28);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.hero h2 {
  margin: 0;
  font-size: 28px;
}
.hero p {
  margin: 0;
  opacity: 0.92;
}
.primary-btn {
  align-self: flex-start;
  padding: 10px 20px;
  border-radius: 999px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(255, 255, 255, 0.25);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}
.card {
  background: #ffffff;
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.07);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.highlights ul {
  padding-left: 18px;
  margin: 0;
  display: grid;
  gap: 8px;
  color: #1f2937;
}
.quick-view .links {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.link {
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.12);
  color: #312e81;
  text-decoration: none;
  font-weight: 600;
}
.link:hover {
  background: rgba(99, 102, 241, 0.25);
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}
.ghost-btn {
  align-self: flex-start;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(79, 70, 229, 0.4);
  color: #4338ca;
  text-decoration: none;
  font-weight: 600;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.ghost-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(67, 56, 202, 0.2);
}
@media (max-width: 620px) {
  .primary-btn {
    width: 100%;
    text-align: center;
  }
  .hero {
    padding: 24px;
  }
}
</style>
