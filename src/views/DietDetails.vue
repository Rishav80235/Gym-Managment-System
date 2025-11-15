<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { memberService, dietPlanService, type Member, type DietPlan } from '../firebase/services'

const members = ref<Member[]>([])
const dietPlans = ref<DietPlan[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const showForm = ref(false)
const isEditMode = ref(false)
const editingPlan = ref<DietPlan | null>(null)

// Form data
const dietForm = ref({
  memberId: '',
  planName: '',
  goal: '' as DietPlan['goal'] | '',
  dailyCalories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
  meals: {
    breakfast: '',
    lunch: '',
    dinner: '',
    snacks: '',
  },
  notes: '',
  startDate: '',
  endDate: '',
})

const searchTerm = ref('')
const statusFilter = ref<'All' | DietPlan['status']>('All')
const goalFilter = ref<'All' | DietPlan['goal']>('All')

// Goals
const goals: DietPlan['goal'][] = [
  'Weight Loss',
  'Muscle Gain',
  'Maintenance',
  'Cutting',
  'Bulking',
]

// Load data
const loadMembers = async () => {
  try {
    members.value = await memberService.getAllMembers()
  } catch (error) {
    console.error('Error loading members:', error)
  }
}

const loadDietPlans = async () => {
  try {
    isLoading.value = true
    dietPlans.value = await dietPlanService.getAllDietPlans()
  } catch (error) {
    console.error('Error loading diet plans:', error)
    alert('Failed to load diet plans. Please refresh the page.')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadMembers(), loadDietPlans()])
})

// Filtered diet plans
const filteredPlans = computed(() => {
  return dietPlans.value.filter((plan) => {
    const matchesSearch =
      plan.memberName.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      plan.planName.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      plan.goal.toLowerCase().includes(searchTerm.value.toLowerCase())

    const matchesStatus = statusFilter.value === 'All' || plan.status === statusFilter.value

    const matchesGoal = goalFilter.value === 'All' || plan.goal === goalFilter.value

    return matchesSearch && matchesStatus && matchesGoal
  })
})

// Stats
const stats = computed(() => {
  const total = dietPlans.value.length
  const active = dietPlans.value.filter((p) => p.status === 'Active').length
  const completed = dietPlans.value.filter((p) => p.status === 'Completed').length

  return {
    total,
    active,
    completed,
  }
})

// Open add form
const openAddForm = () => {
  showForm.value = true
  isEditMode.value = false
  editingPlan.value = null
  resetForm()
}

// Open edit form
const openEditForm = (plan: DietPlan) => {
  showForm.value = true
  isEditMode.value = true
  editingPlan.value = plan
  dietForm.value = {
    memberId: plan.memberId,
    planName: plan.planName,
    goal: plan.goal,
    dailyCalories: plan.dailyCalories,
    protein: plan.protein,
    carbs: plan.carbs,
    fats: plan.fats,
    meals: {
      breakfast: plan.meals.breakfast,
      lunch: plan.meals.lunch,
      dinner: plan.meals.dinner,
      snacks: plan.meals.snacks,
    },
    notes: plan.notes,
    startDate: plan.startDate,
    endDate: plan.endDate || '',
  }
}

// Close form
const closeForm = () => {
  showForm.value = false
  isEditMode.value = false
  editingPlan.value = null
  resetForm()
}

// Reset form
const resetForm = () => {
  dietForm.value = {
    memberId: '',
    planName: '',
    goal: '' as DietPlan['goal'] | '',
    dailyCalories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    meals: {
      breakfast: '',
      lunch: '',
      dinner: '',
      snacks: '',
    },
    notes: '',
    startDate: '',
    endDate: '',
  }
}

// Calculate macros based on calories and goal
const calculateMacros = () => {
  if (!dietForm.value.dailyCalories || !dietForm.value.goal) return

  const calories = dietForm.value.dailyCalories

  switch (dietForm.value.goal) {
    case 'Weight Loss':
    case 'Cutting':
      dietForm.value.protein = Math.round((calories * 0.35) / 4) // 35% protein
      dietForm.value.carbs = Math.round((calories * 0.35) / 4) // 35% carbs
      dietForm.value.fats = Math.round((calories * 0.3) / 9) // 30% fats
      break
    case 'Muscle Gain':
    case 'Bulking':
      dietForm.value.protein = Math.round((calories * 0.3) / 4) // 30% protein
      dietForm.value.carbs = Math.round((calories * 0.45) / 4) // 45% carbs
      dietForm.value.fats = Math.round((calories * 0.25) / 9) // 25% fats
      break
    case 'Maintenance':
      dietForm.value.protein = Math.round((calories * 0.3) / 4) // 30% protein
      dietForm.value.carbs = Math.round((calories * 0.4) / 4) // 40% carbs
      dietForm.value.fats = Math.round((calories * 0.3) / 9) // 30% fats
      break
  }
}

// Save diet plan
const saveDietPlan = async () => {
  if (
    !dietForm.value.memberId ||
    !dietForm.value.planName ||
    !dietForm.value.goal ||
    !dietForm.value.dailyCalories ||
    !dietForm.value.startDate
  ) {
    alert('Please fill in all required fields')
    return
  }

  isSubmitting.value = true

  try {
    const selectedMember = members.value.find((m) => m.id === dietForm.value.memberId)
    if (!selectedMember) {
      alert('Member not found')
      return
    }

    const memberName = `${selectedMember.firstName} ${selectedMember.lastName}`

    if (isEditMode.value && editingPlan.value?.id) {
      await dietPlanService.updateDietPlan(editingPlan.value.id, {
        ...dietForm.value,
        memberName,
        goal: dietForm.value.goal as DietPlan['goal'],
      })
      alert('Diet plan updated successfully!')
    } else {
      await dietPlanService.createDietPlan({
        ...dietForm.value,
        memberName,
        goal: dietForm.value.goal as DietPlan['goal'],
      })
      alert('Diet plan created successfully!')
    }

    await loadDietPlans()
    closeForm()
  } catch (error) {
    console.error('Error saving diet plan:', error)
    alert('Failed to save diet plan. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

// Delete diet plan
const deleteDietPlan = async (id: string) => {
  const plan = dietPlans.value.find((p) => p.id === id)
  if (!plan) return

  const confirmed = window.confirm(
    `Are you sure you want to delete the diet plan "${plan.planName}" for ${plan.memberName}?`,
  )

  if (!confirmed) return

  try {
    await dietPlanService.deleteDietPlan(id)
    alert('Diet plan deleted successfully!')
    await loadDietPlans()
  } catch (error) {
    console.error('Error deleting diet plan:', error)
    alert('Failed to delete diet plan. Please try again.')
  }
}

// Format date
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="diet-details-page">
    <header class="page-header">
      <div>
        <h2>Diet Details</h2>
        <p>Design and manage personalized meal plans for gym members</p>
      </div>
      <button type="button" class="btn btn-primary" @click="openAddForm">Create Diet Plan</button>
    </header>

    <!-- Stats -->
    <section class="stats">
      <article class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">Total Plans</div>
      </article>
      <article class="stat-card">
        <div class="stat-value success">{{ stats.active }}</div>
        <div class="stat-label">Active Plans</div>
      </article>
      <article class="stat-card">
        <div class="stat-value info">{{ stats.completed }}</div>
        <div class="stat-label">Completed</div>
      </article>
    </section>

    <!-- Filters -->
    <section class="filters">
      <input
        v-model="searchTerm"
        type="text"
        placeholder="Search diet plans..."
        class="search-input"
      />
      <select v-model="statusFilter" class="filter-select">
        <option value="All">All Status</option>
        <option value="Active">Active</option>
        <option value="Completed">Completed</option>
        <option value="Inactive">Inactive</option>
      </select>
      <select v-model="goalFilter" class="filter-select">
        <option value="All">All Goals</option>
        <option v-for="goal in goals" :key="goal" :value="goal">
          {{ goal }}
        </option>
      </select>
    </section>

    <!-- Diet Plans Grid -->
    <section class="plans-grid">
      <div v-if="isLoading" class="loading-state">
        <p>Loading diet plans...</p>
      </div>

      <div v-else-if="filteredPlans.length === 0" class="empty-state">
        <p>No diet plans found</p>
      </div>

      <article v-for="plan in filteredPlans" :key="plan.id" class="diet-plan-card">
        <div class="card-header">
          <div>
            <h3 class="plan-name">{{ plan.planName }}</h3>
            <p class="member-name">{{ plan.memberName }}</p>
          </div>
          <span :class="['status-badge', plan.status.toLowerCase()]">
            {{ plan.status }}
          </span>
        </div>

        <div class="card-body">
          <div class="plan-info">
            <div class="info-row">
              <span class="label">Goal:</span>
              <span class="value goal-badge">{{ plan.goal }}</span>
            </div>
            <div class="info-row">
              <span class="label">Daily Calories:</span>
              <span class="value">{{ plan.dailyCalories }} kcal</span>
            </div>

            <div class="macros">
              <div class="macro-item">
                <span class="macro-label">Protein</span>
                <span class="macro-value">{{ plan.protein }}g</span>
              </div>
              <div class="macro-item">
                <span class="macro-label">Carbs</span>
                <span class="macro-value">{{ plan.carbs }}g</span>
              </div>
              <div class="macro-item">
                <span class="macro-label">Fats</span>
                <span class="macro-value">{{ plan.fats }}g</span>
              </div>
            </div>

            <div class="meals-section">
              <div class="meal-item">
                <span class="meal-label">Breakfast:</span>
                <span class="meal-value">{{ plan.meals.breakfast || 'Not specified' }}</span>
              </div>
              <div class="meal-item">
                <span class="meal-label">Lunch:</span>
                <span class="meal-value">{{ plan.meals.lunch || 'Not specified' }}</span>
              </div>
              <div class="meal-item">
                <span class="meal-label">Dinner:</span>
                <span class="meal-value">{{ plan.meals.dinner || 'Not specified' }}</span>
              </div>
              <div class="meal-item">
                <span class="meal-label">Snacks:</span>
                <span class="meal-value">{{ plan.meals.snacks || 'Not specified' }}</span>
              </div>
            </div>

            <div class="dates">
              <div class="date-item">
                <span class="label">Start Date:</span>
                <span class="value">{{ formatDate(plan.startDate) }}</span>
              </div>
              <div v-if="plan.endDate" class="date-item">
                <span class="label">End Date:</span>
                <span class="value">{{ formatDate(plan.endDate) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card-actions">
          <button type="button" class="btn btn-secondary" @click="openEditForm(plan)">Edit</button>
          <button type="button" class="btn btn-danger" @click="deleteDietPlan(plan.id!)">
            Delete
          </button>
        </div>
      </article>
    </section>

    <!-- Add/Edit Form Modal -->
    <transition name="fade">
      <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ isEditMode ? 'Edit Diet Plan' : 'Create Diet Plan' }}</h3>
            <button type="button" class="close-btn" @click="closeForm">×</button>
          </div>

          <form @submit.prevent="saveDietPlan" class="diet-form">
            <div class="form-row">
              <div class="form-group">
                <label for="memberId">Select Member <span class="required">*</span></label>
                <select id="memberId" v-model="dietForm.memberId" required>
                  <option value="">Choose a member...</option>
                  <option v-for="member in members" :key="member.id" :value="member.id">
                    {{ member.firstName }} {{ member.lastName }} - {{ member.email }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="planName">Plan Name <span class="required">*</span></label>
                <input
                  id="planName"
                  v-model="dietForm.planName"
                  type="text"
                  required
                  placeholder="e.g., Summer Cut Plan"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="goal">Goal <span class="required">*</span></label>
                <select id="goal" v-model="dietForm.goal" required @change="calculateMacros">
                  <option value="">Select goal</option>
                  <option v-for="g in goals" :key="g" :value="g">
                    {{ g }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="dailyCalories"
                  >Daily Calories (kcal) <span class="required">*</span></label
                >
                <input
                  id="dailyCalories"
                  v-model.number="dietForm.dailyCalories"
                  type="number"
                  min="0"
                  required
                  placeholder="Enter daily calories"
                  @input="calculateMacros"
                />
              </div>
            </div>

            <div class="macros-input">
              <h4>Macronutrients (Auto-calculated or Manual)</h4>
              <div class="form-row">
                <div class="form-group">
                  <label for="protein">Protein (g)</label>
                  <input
                    id="protein"
                    v-model.number="dietForm.protein"
                    type="number"
                    min="0"
                    placeholder="Protein in grams"
                  />
                </div>
                <div class="form-group">
                  <label for="carbs">Carbs (g)</label>
                  <input
                    id="carbs"
                    v-model.number="dietForm.carbs"
                    type="number"
                    min="0"
                    placeholder="Carbs in grams"
                  />
                </div>
                <div class="form-group">
                  <label for="fats">Fats (g)</label>
                  <input
                    id="fats"
                    v-model.number="dietForm.fats"
                    type="number"
                    min="0"
                    placeholder="Fats in grams"
                  />
                </div>
              </div>
            </div>

            <div class="meals-input">
              <h4>Meal Plan</h4>
              <div class="form-group">
                <label for="breakfast">Breakfast</label>
                <textarea
                  id="breakfast"
                  v-model="dietForm.meals.breakfast"
                  rows="2"
                  placeholder="Describe breakfast meal plan..."
                ></textarea>
              </div>
              <div class="form-group">
                <label for="lunch">Lunch</label>
                <textarea
                  id="lunch"
                  v-model="dietForm.meals.lunch"
                  rows="2"
                  placeholder="Describe lunch meal plan..."
                ></textarea>
              </div>
              <div class="form-group">
                <label for="dinner">Dinner</label>
                <textarea
                  id="dinner"
                  v-model="dietForm.meals.dinner"
                  rows="2"
                  placeholder="Describe dinner meal plan..."
                ></textarea>
              </div>
              <div class="form-group">
                <label for="snacks">Snacks</label>
                <textarea
                  id="snacks"
                  v-model="dietForm.meals.snacks"
                  rows="2"
                  placeholder="Describe snacks..."
                ></textarea>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="startDate">Start Date <span class="required">*</span></label>
                <input id="startDate" v-model="dietForm.startDate" type="date" required />
              </div>

              <div class="form-group">
                <label for="endDate">End Date</label>
                <input id="endDate" v-model="dietForm.endDate" type="date" />
              </div>
            </div>

            <div class="form-group">
              <label for="notes">Additional Notes</label>
              <textarea
                id="notes"
                v-model="dietForm.notes"
                rows="3"
                placeholder="Add any additional notes or instructions..."
              ></textarea>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="closeForm">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                {{ isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Create' }} Diet Plan
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.diet-details-page {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
}

.page-header p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 14px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

.stat-value.success {
  color: #15803d;
}

.stat-value.info {
  color: #2563eb;
}

.stat-label {
  margin-top: 6px;
  color: #64748b;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input,
.filter-select {
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.filter-select {
  min-width: 150px;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
}

.diet-plan-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s;
}

.diet-plan-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.plan-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
}

.member-name {
  margin: 4px 0 0;
  font-size: 14px;
  color: #64748b;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.completed {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.inactive {
  background: #f1f5f9;
  color: #475569;
}

.card-body {
  flex: 1;
}

.plan-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.info-row .label {
  color: #64748b;
  font-weight: 500;
}

.info-row .value {
  color: #0f172a;
  font-weight: 500;
}

.goal-badge {
  padding: 4px 10px;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.macros {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.macro-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.macro-label {
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.macro-value {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.meals-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.meal-item {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.meal-label {
  font-weight: 600;
  color: #475569;
  min-width: 80px;
}

.meal-value {
  color: #1e293b;
  flex: 1;
}

.dates {
  display: flex;
  gap: 16px;
  font-size: 13px;
}

.date-item {
  display: flex;
  gap: 6px;
}

.date-item .label {
  color: #64748b;
}

.date-item .value {
  color: #0f172a;
  font-weight: 500;
}

.card-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  flex: 1;
}

.btn-primary {
  background: #3b82f6;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.btn-danger {
  background: #ef4444;
  color: #fff;
}

.btn-danger:hover {
  background: #dc2626;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
  grid-column: 1 / -1;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 10;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #64748b;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.close-btn:hover {
  background: #f1f5f9;
}

.diet-form {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.diet-form h4 {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
  margin-bottom: 8px;
}

.required {
  color: #dc2626;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  color: #0f172a;
  background: #fff;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.macros-input,
.meals-input {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  margin-top: 8px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .diet-details-page {
    padding: 16px;
  }

  .plans-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .filters {
    flex-direction: column;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .macros {
    grid-template-columns: 1fr;
  }
}
</style>
