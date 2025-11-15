<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const packages = reactive([
  {
    id: 'standard',
    name: 'Standard',
    price: '$69 / month',
    perks: ['Access to gym floor', 'Locker facilities', 'Two guest passes'],
    recommended: false,
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '$99 / month',
    perks: ['Standard perks', 'Unlimited group classes', 'Sauna access'],
    recommended: true,
  },
  {
    id: 'elite-plus',
    name: 'Elite Plus',
    price: '$129 / month',
    perks: ['Elite perks', 'Dedicated trainer sessions', 'Nutrition coaching'],
    recommended: false,
  },
])

const selectedPackage = ref('elite-plus')
const processing = ref(false)
const confirmation = ref('')

const currentPackage = computed(() => 'Elite Plus')

const confirmUpgrade = async () => {
  processing.value = true
  confirmation.value = ''

  await new Promise((resolve) => setTimeout(resolve, 1000))

  processing.value = false
  confirmation.value = `Package updated to ${selectedPackage.value
    .split('-')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')} successfully.`
}

const goBack = () => {
  if (route.path.startsWith('/member')) {
    router.push({ name: 'member-profile' })
  } else {
    router.push({ name: 'admin-profile' })
  }
}
</script>

<template>
  <section class="upgrade-page">
    <header class="page-header">
      <div>
        <h2>Upgrade Package</h2>
        <p>Your current package: <strong>{{ currentPackage }}</strong>. Choose a new plan below.</p>
      </div>
      <button class="ghost-btn" type="button" @click="goBack">Back to Profile</button>
    </header>

    <div class="packages">
      <article
        v-for="plan in packages"
        :key="plan.id"
        class="package-card"
        :class="{ selected: selectedPackage === plan.id, recommended: plan.recommended }"
        @click="selectedPackage = plan.id"
      >
        <div class="card-header">
          <h3>{{ plan.name }}</h3>
          <span v-if="plan.recommended" class="badge">Popular</span>
        </div>
        <div class="price">{{ plan.price }}</div>
        <ul>
          <li v-for="perk in plan.perks" :key="perk">{{ perk }}</li>
        </ul>
        <label class="radio">
          <input
            type="radio"
            name="package"
            :value="plan.id"
            :checked="selectedPackage === plan.id"
            @change="selectedPackage = plan.id"
          />
          Select
        </label>
      </article>
    </div>

    <div class="actions">
      <button class="primary-btn" type="button" :disabled="processing" @click="confirmUpgrade">
        {{ processing ? 'Processing...' : 'Confirm Upgrade' }}
      </button>
    </div>

    <p v-if="confirmation" class="confirmation">{{ confirmation }}</p>
  </section>
</template>

<style scoped>
.upgrade-page {
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
.packages {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}
.package-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 24px;
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border 0.15s ease;
}
.package-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.12);
}
.package-card.selected {
  border-color: #2563eb;
  box-shadow: 0 20px 36px rgba(37, 99, 235, 0.18);
}
.package-card.recommended {
  position: relative;
  background: linear-gradient(145deg, #0f172a, #1e293b);
  color: #e2e8f0;
}
.package-card.recommended .price,
.package-card.recommended li,
.package-card.recommended h3 {
  color: inherit;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.badge {
  background: #f59e0b;
  color: #fff;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.price {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
}
li {
  color: #475569;
}
.radio {
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.radio input[type='radio'] {
  width: 18px;
  height: 18px;
}
.actions {
  display: flex;
  justify-content: flex-end;
}
.primary-btn {
  padding: 10px 24px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #38bdf8, #2563eb);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.primary-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.25);
}
.primary-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}
.confirmation {
  color: #22c55e;
  font-weight: 600;
}
.ghost-btn {
  padding: 10px 18px;
  border-radius: 999px;
  background: transparent;
  color: #2563eb;
  border: 1px solid rgba(37, 99, 235, 0.4);
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.ghost-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.12);
}
@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .packages {
    grid-template-columns: 1fr;
  }
  .actions {
    justify-content: stretch;
  }
  .primary-btn {
    width: 100%;
  }
}
</style>

