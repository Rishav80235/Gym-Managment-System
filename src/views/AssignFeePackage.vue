<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  memberService,
  feePackageService,
  type Member,
  type FeePackage,
} from '../firebase/services'

const members = ref<Member[]>([])
const packages = ref<FeePackage[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)

// Form data
const packageForm = ref({
  memberId: '',
  packageType: '' as 'basic' | 'premium' | 'gold' | 'platinum' | '',
  amount: 0,
  startDate: '',
})

const searchTerm = ref('')
const statusFilter = ref<'All' | FeePackage['status']>('All')
const packageTypeFilter = ref<'All' | FeePackage['packageType']>('All')

// Load data
const loadMembers = async () => {
  try {
    members.value = await memberService.getAllMembers()
  } catch (error) {
    console.error('Error loading members:', error)
  }
}

const loadPackages = async () => {
  try {
    isLoading.value = true
    packages.value = await feePackageService.getAllPackages()
  } catch (error) {
    console.error('Error loading packages:', error)
    alert('Failed to load packages. Please refresh the page.')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadMembers()
  await loadPackages()
})

// Package type change handler
const onPackageTypeChange = () => {
  if (packageForm.value.packageType) {
    const config = feePackageService.packageConfigs[packageForm.value.packageType]
    packageForm.value.amount = config.defaultAmount
  }
}

// Filtered packages
const filteredPackages = computed(() => {
  return packages.value.filter((pkg) => {
    const matchesSearch =
      pkg.memberName.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      pkg.packageName.toLowerCase().includes(searchTerm.value.toLowerCase())

    const matchesStatus = statusFilter.value === 'All' || pkg.status === statusFilter.value

    const matchesType =
      packageTypeFilter.value === 'All' || pkg.packageType === packageTypeFilter.value

    return matchesSearch && matchesStatus && matchesType
  })
})

// Stats
const stats = computed(() => {
  const total = packages.value.length
  const active = packages.value.filter((p) => p.status === 'Active').length
  const expired = packages.value.filter((p) => p.status === 'Expired').length
  const totalRevenue = packages.value.reduce((sum, p) => sum + p.amount, 0)

  return {
    total,
    active,
    expired,
    totalRevenue,
  }
})

// Assign package
const assignPackage = async () => {
  if (
    !packageForm.value.memberId ||
    !packageForm.value.packageType ||
    !packageForm.value.startDate
  ) {
    alert('Please fill in all required fields')
    return
  }

  isSubmitting.value = true

  try {
    const selectedMember = members.value.find((m) => m.id === packageForm.value.memberId)
    if (!selectedMember) {
      alert('Member not found')
      return
    }

    const config = feePackageService.packageConfigs[packageForm.value.packageType]
    const memberName = `${selectedMember.firstName} ${selectedMember.lastName}`

    await feePackageService.assignPackage({
      memberId: packageForm.value.memberId,
      memberName,
      packageType: packageForm.value.packageType,
      packageName: config.name,
      amount: packageForm.value.amount,
      duration: config.duration,
      startDate: packageForm.value.startDate,
    })

    alert('Fee package assigned successfully!')

    // Reset form
    packageForm.value = {
      memberId: '',
      packageType: '' as 'basic' | 'premium' | 'gold' | 'platinum' | '',
      amount: 0,
      startDate: '',
    }

    // Reload packages and members
    await loadPackages()
    await loadMembers()
  } catch (error) {
    console.error('Error assigning package:', error)
    alert('Failed to assign package. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

// Delete package
const deletePackage = async (packageId: string) => {
  const pkg = packages.value.find((p) => p.id === packageId)
  if (!pkg) return

  const confirmed = window.confirm(
    `Are you sure you want to delete the fee package for ${pkg.memberName}?`,
  )

  if (!confirmed) return

  try {
    await feePackageService.deletePackage(packageId)
    alert('Fee package deleted successfully!')
    await loadPackages()
  } catch (error) {
    console.error('Error deleting package:', error)
    alert('Failed to delete package. Please try again.')
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

// Get package config
const getPackageConfig = (type: string) => {
  return feePackageService.packageConfigs[type as keyof typeof feePackageService.packageConfigs]
}
</script>

<template>
  <div class="assign-fee-page">
    <header class="page-header">
      <div>
        <h2>Assign Fee Package</h2>
        <p>Assign membership packages to gym members</p>
      </div>
    </header>

    <!-- Stats -->
    <section class="stats">
      <article class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">Total Packages</div>
      </article>
      <article class="stat-card">
        <div class="stat-value success">{{ stats.active }}</div>
        <div class="stat-label">Active</div>
      </article>
      <article class="stat-card">
        <div class="stat-value warning">{{ stats.expired }}</div>
        <div class="stat-label">Expired</div>
      </article>
      <article class="stat-card">
        <div class="stat-value info">₹{{ stats.totalRevenue.toLocaleString('en-IN') }}</div>
        <div class="stat-label">Total Revenue</div>
      </article>
    </section>

    <div class="content-grid">
      <!-- Assign Package Form -->
      <section class="assign-form-section">
        <h3>Assign New Package</h3>
        <form @submit.prevent="assignPackage" class="package-form">
          <div class="form-group">
            <label for="memberId">Select Member <span class="required">*</span></label>
            <select id="memberId" v-model="packageForm.memberId" required>
              <option value="">Choose a member...</option>
              <option v-for="member in members" :key="member.id" :value="member.id">
                {{ member.firstName }} {{ member.lastName }} - {{ member.email }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="packageType">Package Type <span class="required">*</span></label>
            <select
              id="packageType"
              v-model="packageForm.packageType"
              required
              @change="onPackageTypeChange"
            >
              <option value="">Select package type...</option>
              <option value="basic">Basic (Monthly) - ₹1,000</option>
              <option value="premium">Premium (3 Months) - ₹2,700</option>
              <option value="gold">Gold (6 Months) - ₹5,000</option>
              <option value="platinum">Platinum (Yearly) - ₹9,000</option>
            </select>
            <div v-if="packageForm.packageType" class="package-info">
              <small>
                Duration: {{ getPackageConfig(packageForm.packageType)?.duration }} month(s)
              </small>
            </div>
          </div>

          <div class="form-group">
            <label for="amount">Amount (₹) <span class="required">*</span></label>
            <input
              id="amount"
              v-model.number="packageForm.amount"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="Enter amount"
            />
          </div>

          <div class="form-group">
            <label for="startDate">Start Date <span class="required">*</span></label>
            <input id="startDate" v-model="packageForm.startDate" type="date" required />
            <div v-if="packageForm.startDate && packageForm.packageType" class="package-info">
              <small>
                End Date:
                {{
                  formatDate(
                    feePackageService.calculateEndDate(
                      packageForm.startDate,
                      getPackageConfig(packageForm.packageType)?.duration || 1,
                    ),
                  )
                }}
              </small>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
            {{ isSubmitting ? 'Assigning...' : 'Assign Package' }}
          </button>
        </form>
      </section>

      <!-- Packages List -->
      <section class="packages-list-section">
        <div class="section-header">
          <h3>Assigned Packages</h3>
          <div class="filters">
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Search packages..."
              class="search-input"
            />
            <select v-model="statusFilter" class="filter-select">
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select v-model="packageTypeFilter" class="filter-select">
              <option value="All">All Types</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
            </select>
          </div>
        </div>

        <div v-if="isLoading" class="loading-state">
          <p>Loading packages...</p>
        </div>

        <div v-else-if="filteredPackages.length === 0" class="empty-state">
          <p>No packages found</p>
        </div>

        <div v-else class="packages-grid">
          <article v-for="pkg in filteredPackages" :key="pkg.id" class="package-card">
            <div class="package-header">
              <div>
                <div class="package-name">{{ pkg.packageName }}</div>
                <div class="package-member">{{ pkg.memberName }}</div>
              </div>
              <span :class="['status-badge', pkg.status.toLowerCase()]">
                {{ pkg.status }}
              </span>
            </div>

            <div class="package-body">
              <div class="package-detail">
                <span class="label">Amount:</span>
                <span class="value">₹{{ pkg.amount.toLocaleString('en-IN') }}</span>
              </div>
              <div class="package-detail">
                <span class="label">Duration:</span>
                <span class="value">{{ pkg.duration }} month(s)</span>
              </div>
              <div class="package-detail">
                <span class="label">Start Date:</span>
                <span class="value">{{ formatDate(pkg.startDate) }}</span>
              </div>
              <div class="package-detail">
                <span class="label">End Date:</span>
                <span class="value">{{ formatDate(pkg.endDate) }}</span>
              </div>
            </div>

            <div class="package-actions">
              <button type="button" class="btn btn-danger" @click="deletePackage(pkg.id!)">
                Delete
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.assign-fee-page {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
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

.stat-value.warning {
  color: #b91c1c;
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

.content-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
}

.assign-form-section,
.packages-list-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.assign-form-section h3,
.packages-list-section h3 {
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
}

.package-form {
  display: flex;
  flex-direction: column;
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

.package-info {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.form-group input,
.form-group select {
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
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
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

.btn-danger {
  background: #ef4444;
  color: #fff;
}

.btn-danger:hover {
  background: #dc2626;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.filters {
  display: flex;
  gap: 12px;
}

.search-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
}

.search-input {
  min-width: 200px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}

.packages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.package-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.package-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.package-name {
  font-weight: 600;
  color: #0f172a;
  font-size: 14px;
}

.package-member {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
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

.status-badge.expired {
  background: #fee2e2;
  color: #b91c1c;
}

.status-badge.cancelled {
  background: #f1f5f9;
  color: #475569;
}

.package-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.package-detail {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.package-detail .label {
  color: #64748b;
}

.package-detail .value {
  color: #0f172a;
  font-weight: 500;
}

.package-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.package-actions .btn {
  flex: 1;
  padding: 8px 16px;
  font-size: 12px;
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .assign-fee-page {
    padding: 16px;
  }

  .packages-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .filters {
    flex-direction: column;
  }
}
</style>
