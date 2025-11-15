<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { accountService } from '../firebase/services'
import type { AccountRole } from '../firebase/services'

defineOptions({ name: 'SignupPage' })

const router = useRouter()

const form = reactive<{
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  role: AccountRole
}>({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'member',
})

const isSubmitting = ref(false)
const error = ref('')
const success = ref('')

const handleSignup = async () => {
  isSubmitting.value = true
  error.value = ''
  success.value = ''

  if (!form.firstName || !form.lastName) {
    error.value = 'Please provide your full name.'
  } else if (form.password !== form.confirmPassword) {
    error.value = 'Passwords do not match.'
  }

  if (error.value) {
    isSubmitting.value = false
    return
  }

  try {
    const { accountId } = await accountService.createAccount({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
    })

    success.value = `Account created successfully. Your ID is ${accountId}.`

    setTimeout(() => {
      router.push({ name: 'login', query: { created: '1', accountId } })
    }, 800)
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = 'Unable to create account. Please try again.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="auth-page">
    <div class="card">
      <header class="header">
        <h1>Create your account</h1>
        <p>Sign up as an admin, member, or general user to access the platform.</p>
      </header>

      <form class="form" @submit.prevent="handleSignup">
        <div class="row">
          <div class="field">
            <label for="firstName">First name</label>
            <input
              id="firstName"
              v-model="form.firstName"
              type="text"
              placeholder="Alex"
              required
            />
          </div>
          <div class="field">
            <label for="lastName">Last name</label>
            <input
              id="lastName"
              v-model="form.lastName"
              type="text"
              placeholder="Johnson"
              required
            />
          </div>
        </div>

        <div class="field">
          <label for="email">Email address</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <div class="row">
          <div class="field">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              minlength="6"
              required
            />
          </div>
          <div class="field">
            <label for="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              placeholder="Repeat password"
              minlength="6"
              required
            />
          </div>
        </div>

        <div class="field">
          <label for="role">Sign up as</label>
          <select id="role" v-model="form.role">
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="user">User</option>
          </select>
        </div>

        <button class="primary-btn" type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Creating account…' : 'Sign up' }}
        </button>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">{{ success }}</p>
      </form>

      <footer class="footer">
        <span>Already registered?</span>
        <router-link class="link" :to="{ name: 'login' }">Log in</router-link>
      </footer>
    </div>
  </section>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: radial-gradient(circle at bottom left, #14b8a6 0%, #0f172a 60%, #020617 100%);
  color: #e2e8f0;
}
.card {
  width: min(540px, 100%);
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(45, 212, 191, 0.25);
  border-radius: 20px;
  padding: 36px 32px;
  box-shadow: 0 32px 55px rgba(15, 23, 42, 0.45);
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.header h1 {
  margin: 0;
  font-size: 28px;
  color: #f8fafc;
}
.header p {
  margin: 8px 0 0;
  color: rgba(226, 232, 240, 0.75);
}
.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
label {
  font-weight: 600;
  font-size: 14px;
}
input,
select {
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.6);
  color: #e2e8f0;
  padding: 12px 14px;
  font-size: 15px;
  transition:
    border 0.15s ease,
    box-shadow 0.15s ease;
}
input:focus,
select:focus {
  border-color: rgba(45, 212, 191, 0.7);
  box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.25);
  outline: none;
}
.primary-btn {
  margin-top: 6px;
  padding: 12px 18px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #0ea5e9, #14b8a6);
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.4px;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.primary-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}
.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(14, 165, 233, 0.35);
}
.error {
  margin: 0;
  color: #fca5a5;
  font-weight: 600;
}
.success {
  margin: 0;
  color: #bbf7d0;
  font-weight: 600;
}
.footer {
  display: flex;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: rgba(226, 232, 240, 0.75);
}
.link {
  color: #5eead4;
  text-decoration: none;
  font-weight: 600;
}
.link:hover {
  text-decoration: underline;
}
@media (max-width: 640px) {
  .card {
    padding: 32px 24px;
  }
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
