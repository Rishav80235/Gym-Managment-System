<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { accountService } from '../firebase/services'
import { getSession, updateSession } from '../utils/auth'

const router = useRouter()
const route = useRoute()

const sessionRef = ref(getSession())

if (!sessionRef.value) {
  router.push({ name: 'login' })
}

const form = reactive({
  firstName: sessionRef.value?.firstName ?? '',
  lastName: sessionRef.value?.lastName ?? '',
  email: sessionRef.value?.email ?? '',
  newPassword: '',
  confirmPassword: '',
})

const saving = ref(false)
const success = ref('')
const error = ref('')

const resetForm = () => {
  const session = sessionRef.value
  if (!session) return
  form.firstName = session.firstName
  form.lastName = session.lastName
  form.email = session.email
  form.newPassword = ''
  form.confirmPassword = ''
  error.value = ''
  success.value = ''
}

const handleSubmit = async () => {
  const session = sessionRef.value
  if (!session) {
    router.push({ name: 'login' })
    return
  }

  error.value = ''
  success.value = ''

  const firstName = form.firstName.trim()
  const lastName = form.lastName.trim()
  const email = form.email.trim()
  const newPassword = form.newPassword
  const confirmPassword = form.confirmPassword

  if (!firstName || !lastName) {
    error.value = 'Please provide both first and last name.'
    return
  }

  if (!email) {
    error.value = 'Email address is required.'
    return
  }

  const updates: {
    firstName?: string
    lastName?: string
    email?: string
    password?: string
  } = {}

  if (firstName !== session.firstName) updates.firstName = firstName
  if (lastName !== session.lastName) updates.lastName = lastName
  if (email !== session.email) updates.email = email

  if (newPassword || confirmPassword) {
    if (newPassword.length < 6) {
      error.value = 'Password must be at least 6 characters.'
      return
    }
    if (newPassword !== confirmPassword) {
      error.value = 'Passwords do not match.'
      return
    }
    updates.password = newPassword
  }

  if (Object.keys(updates).length === 0) {
    success.value = 'Nothing to update.'
    form.newPassword = ''
    form.confirmPassword = ''
    return
  }

  saving.value = true
  try {
    await accountService.updateAccount(session.id, updates)

    updateSession({
      firstName: updates.firstName ?? session.firstName,
      lastName: updates.lastName ?? session.lastName,
      email: updates.email ? updates.email.trim().toLowerCase() : session.email,
    })

    sessionRef.value = getSession()
    success.value = 'Profile updated successfully.'
    form.newPassword = ''
    form.confirmPassword = ''
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = 'Unable to update profile. Please try again.'
    }
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  const session = sessionRef.value
  if (!session) {
    router.push({ name: 'login' })
    return
  }

  if (session.role === 'member') {
    router.push({ name: 'member-profile' })
  } else if (session.role === 'admin') {
    router.push({ name: 'admin-profile' })
  } else {
    router.push({ name: 'user-home' })
  }
}
</script>

<template>
  <section class="edit-profile">
    <header class="page-header">
      <div>
        <h2>Edit Profile</h2>
        <p>Update your personal information so we can keep your account accurate.</p>
      </div>
      <button class="ghost-btn" type="button" @click="goBack">Back to Profile</button>
    </header>

    <form class="form" @submit.prevent="handleSubmit">
      <div class="field-group">
        <label for="firstName">First name</label>
        <input id="firstName" v-model="form.firstName" type="text" autocomplete="given-name" required />
      </div>

      <div class="field-group">
        <label for="lastName">Last name</label>
        <input id="lastName" v-model="form.lastName" type="text" autocomplete="family-name" required />
      </div>

      <div class="field-group">
        <label for="email">Email address</label>
        <input id="email" v-model="form.email" type="email" autocomplete="email" required />
      </div>

      <div class="field-group">
        <label for="newPassword">New password</label>
        <input
          id="newPassword"
          v-model="form.newPassword"
          type="password"
          autocomplete="new-password"
          minlength="6"
          placeholder="Leave blank to keep current password"
        />
        <p class="hint">Enter a new password only if you want to change it.</p>
      </div>

      <div class="field-group">
        <label for="confirmPassword">Confirm new password</label>
        <input
          id="confirmPassword"
          v-model="form.confirmPassword"
          type="password"
          autocomplete="new-password"
          minlength="6"
          placeholder="Repeat new password"
        />
      </div>

      <div class="actions">
        <button class="ghost-btn" type="button" @click="resetForm">Reset</button>
        <button class="primary-btn" type="submit" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>
    </form>
  </section>
</template>

<style scoped>
.edit-profile {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}
.page-header h2 {
  margin: 0 0 8px;
  font-size: 26px;
}
.page-header p {
  margin: 0;
  color: #64748b;
}
.form {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}
.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
label {
  font-weight: 600;
  color: #0f172a;
}
input {
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 15px;
  transition: border 0.15s ease, box-shadow 0.15s ease;
  font-family: inherit;
}
input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  outline: none;
}
.hint {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
}
.actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  align-items: center;
}
.primary-btn,
.ghost-btn {
  padding: 10px 18px;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.primary-btn {
  background: linear-gradient(135deg, #38bdf8, #2563eb);
  color: #fff;
}
.primary-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}
.ghost-btn {
  background: transparent;
  color: #2563eb;
  border: 1px solid rgba(37, 99, 235, 0.4);
}
.primary-btn:hover:not(:disabled),
.ghost-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.12);
}
.error {
  grid-column: 1 / -1;
  color: #dc2626;
  font-weight: 600;
}
.success {
  grid-column: 1 / -1;
  color: #15803d;
  font-weight: 600;
}
@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .form {
    grid-template-columns: 1fr;
  }
  .actions {
    width: 100%;
    flex-direction: column-reverse;
    align-items: stretch;
  }
  .actions button {
    width: 100%;
  }
}
</style>
