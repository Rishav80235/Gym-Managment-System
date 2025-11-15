<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { AccountRole } from '../firebase/services'
import { getSession } from '../utils/auth'

const router = useRouter()

const session = ref(getSession())

if (!session.value) {
  router.push({ name: 'login' })
}

const fullName = computed(() => {
  if (!session.value) return '—'
  const parts = [session.value.firstName, session.value.lastName].filter(Boolean)
  if (parts.length === 0) return session.value.email || '—'
  return parts.join(' ')
})

const email = computed(() => session.value?.email ?? '—')
const accountId = computed(() => session.value?.accountId ?? '—')
const role = computed<AccountRole>(() => session.value?.role ?? 'user')
const roleLabel = computed(() => role.value.charAt(0).toUpperCase() + role.value.slice(1))

const preferences = ref({
  notifications: true,
  newsletter: false,
  smsAlerts: true,
})

const togglePreference = (key: keyof typeof preferences.value) => {
  preferences.value[key] = !preferences.value[key]
}

const canEditProfile = computed(() => role.value === 'admin' || role.value === 'member')

const editProfileRouteName = computed(() => {
  if (role.value === 'admin') return 'admin-edit-profile'
  if (role.value === 'member') return 'member-edit-profile'
  return 'member-edit-profile'
})

const shouldShowUpgrade = computed(() => role.value === 'member')
const upgradePackageRouteName = computed(() =>
  role.value === 'member' ? 'member-upgrade-package' : 'admin-upgrade-package',
)

const goToEditProfile = () => {
  if (!canEditProfile.value) return
  router.push({ name: editProfileRouteName.value })
}

const goToUpgradePackage = () => {
  if (!shouldShowUpgrade.value) return
  router.push({ name: upgradePackageRouteName.value })
}
</script>

<template>
  <section class="profile-page">
    <header class="page-header">
      <h2>Profile</h2>
      <p>Review and manage your personal details, account information, and preferences.</p>
    </header>

    <div class="grid">
      <article class="card">
        <h3>Personal Details</h3>
        <dl class="details">
          <div>
            <dt>Name</dt>
            <dd>{{ fullName }}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{{ email }}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{{ roleLabel }}</dd>
          </div>
        </dl>
        <button v-if="canEditProfile" class="primary-btn" type="button" @click="goToEditProfile">
          Edit Profile
        </button>
      </article>

      <article class="card">
        <h3>Account</h3>
        <dl class="details">
          <div>
            <dt>Account ID</dt>
            <dd>{{ accountId }}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd><span class="status active">Active</span></dd>
          </div>
          <div>
            <dt>Access Level</dt>
            <dd>{{ roleLabel }}</dd>
          </div>
        </dl>
        <button
          v-if="shouldShowUpgrade"
          class="secondary-btn"
          type="button"
          @click="goToUpgradePackage"
        >
          Upgrade Package
        </button>
      </article>

      <article class="card">
        <h3>Preferences</h3>
        <ul class="preferences">
          <li>
            <label>
              <input
                type="checkbox"
                :checked="preferences.notifications"
                @change="togglePreference('notifications')"
              />
              Billing notifications
            </label>
          </li>
          <li>
            <label>
              <input
                type="checkbox"
                :checked="preferences.newsletter"
                @change="togglePreference('newsletter')"
              />
              Newsletter updates
            </label>
          </li>
          <li>
            <label>
              <input
                type="checkbox"
                :checked="preferences.smsAlerts"
                @change="togglePreference('smsAlerts')"
              />
              SMS alerts
            </label>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.page-header h2 {
  margin: 0 0 8px;
  font-size: 26px;
}
.page-header p {
  margin: 0;
  color: #64748b;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}
.card {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card h3 {
  margin: 0;
  font-size: 18px;
}
.details {
  margin: 0;
  display: grid;
  gap: 12px;
}
.details dt {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #94a3b8;
}
.details dd {
  margin: 2px 0 0;
  font-weight: 600;
  color: #0f172a;
}
.status {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}
.status.active {
  background: rgba(34, 197, 94, 0.15);
  color: #15803d;
}
.primary-btn,
.secondary-btn {
  align-self: flex-start;
  padding: 8px 16px;
  border-radius: 999px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.primary-btn {
  background: linear-gradient(135deg, #38bdf8, #2563eb);
  color: #fff;
}
.secondary-btn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #fff;
}
.primary-btn:hover,
.secondary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.12);
}
.preferences {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 12px;
}
.preferences label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: #334155;
}
input[type='checkbox'] {
  width: 18px;
  height: 18px;
}
</style>
