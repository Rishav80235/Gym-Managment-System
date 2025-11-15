<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { accountService } from '../firebase/services'
import type { AccountRole } from '../firebase/services'
import { setSession } from '../utils/auth'

defineOptions({ name: 'LoginPage' })

const router = useRouter()
const route = useRoute()

const form = reactive<{
  email: string
  password: string
  role: AccountRole
}>({
  email: '',
  password: '',
  role: 'member',
})

const isSubmitting = ref(false)
const error = ref('')
const notice = ref('')

watch(
  () => route.query,
  (query) => {
    if (query.created === '1') {
      notice.value =
        'Account created successfully. Please sign in using the credentials you just set.'
    } else {
      notice.value = ''
    }
  },
  { immediate: true },
)

const handleLogin = async () => {
  isSubmitting.value = true
  error.value = ''

  try {
    const email = form.email.trim()
    const password = form.password

    if (!email || !password) {
      error.value = 'Please provide both email and password.'
      return
    }

    const account = await accountService.verifyCredentials(email, password)

    if (!account) {
      error.value = 'Invalid email or password.'
      return
    }

    if (account.role !== form.role) {
      error.value = `This account is registered as ${account.role}. Please choose the matching role.`
      return
    }

    setSession({
      id: account.id ?? '',
      accountId: account.accountId,
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
      role: account.role,
    })

    if (account.role === 'admin') {
      router.push({ name: 'add-member' })
    } else if (account.role === 'member') {
      router.push({ name: 'member-dashboard' })
    } else {
      router.push({ name: 'user-home' })
    }
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = 'Unable to log in right now. Please try again.'
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
        <h1>Welcome Back</h1>
        <p>Log in with your credentials to access the dashboard.</p>
      </header>

      <p v-if="notice" class="notice">{{ notice }}</p>

      <form class="form" @submit.prevent="handleLogin">
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
          <label for="role">Login as</label>
          <select id="role" v-model="form.role">
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="user">User</option>
          </select>
        </div>

        <button class="primary-btn" type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Signing in…' : 'Login' }}
        </button>

        <p v-if="error" class="error">{{ error }}</p>
      </form>

      <footer class="footer">
        <span>New here?</span>
        <router-link class="link" :to="{ name: 'signup' }">Create an account</router-link>
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
  background: radial-gradient(circle at top, #312e81 0%, #0f172a 55%, #020617 100%);
  color: #e2e8f0;
}
.card {
  width: min(420px, 100%);
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 18px;
  padding: 32px 28px;
  box-shadow: 0 30px 50px rgba(15, 23, 42, 0.45);
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.header h1 {
  margin: 0;
  font-size: 28px;
  color: #ffffff;
}
.header p {
  margin: 6px 0 0;
  color: rgba(226, 232, 240, 0.75);
}
.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
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
  border-color: rgba(99, 102, 241, 0.7);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
  outline: none;
}
.primary-btn {
  margin-top: 6px;
  padding: 12px 18px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #6366f1, #9333ea);
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
  box-shadow: 0 14px 28px rgba(99, 102, 241, 0.35);
}
.error {
  margin: 0;
  color: #fca5a5;
  font-weight: 600;
}
.notice {
  margin: -8px 0 0;
  color: #a5b4fc;
  font-weight: 600;
  text-align: center;
}
.footer {
  display: flex;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: rgba(226, 232, 240, 0.75);
}
.link {
  color: #a5b4fc;
  text-decoration: none;
  font-weight: 600;
}
.link:hover {
  text-decoration: underline;
}
@media (max-width: 480px) {
  .card {
    padding: 28px 22px;
  }
  .header h1 {
    font-size: 24px;
  }
}
</style>
