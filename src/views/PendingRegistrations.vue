<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { registrationRequestService, type RegistrationRequest } from '../firebase/services'
import type { Timestamp } from 'firebase/firestore'
import { getSession } from '../utils/auth'

const requests = ref<RegistrationRequest[]>([])
const isLoading = ref(true)
const statusFilter = ref<'All' | 'Pending' | 'Approved' | 'Rejected'>('All')
const searchTerm = ref('')
const isProcessing = ref<string | null>(null)

// Load registration requests
const loadRequests = async () => {
  try {
    isLoading.value = true
    requests.value = await registrationRequestService.getAllRequests()
  } catch (error) {
    console.error('Error loading registration requests:', error)
    alert('Failed to load registration requests. Please refresh the page.')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadRequests()
})

// Filtered requests
const filteredRequests = computed(() => {
  return requests.value.filter((request) => {
    const matchesSearch =
      `${request.firstName} ${request.lastName}`
        .toLowerCase()
        .includes(searchTerm.value.toLowerCase()) ||
      request.email.toLowerCase().includes(searchTerm.value.toLowerCase())

    const matchesStatus = statusFilter.value === 'All' || request.status === statusFilter.value

    return matchesSearch && matchesStatus
  })
})

// Stats
const stats = computed(() => {
  const total = requests.value.length
  const pending = requests.value.filter((r) => r.status === 'Pending').length
  const approved = requests.value.filter((r) => r.status === 'Approved').length
  const rejected = requests.value.filter((r) => r.status === 'Rejected').length

  return {
    total,
    pending,
    approved,
    rejected,
  }
})

// Approve request
const approveRequest = async (requestId: string) => {
  if (!requestId) return

  const session = getSession()
  if (!session) {
    alert('You must be logged in to approve requests.')
    return
  }

  const confirmed = window.confirm('Are you sure you want to approve this registration request?')
  if (!confirmed) return

  isProcessing.value = requestId

  try {
    await registrationRequestService.approveRequest(requestId, session.id)
    alert('Registration request approved successfully!')
    await loadRequests()
  } catch (error) {
    console.error('Error approving request:', error)
    if (error instanceof Error) {
      alert(`Failed to approve request: ${error.message}`)
    } else {
      alert('Failed to approve request. Please try again.')
    }
  } finally {
    isProcessing.value = null
  }
}

// Reject request
const rejectRequest = async (requestId: string) => {
  if (!requestId) return

  const session = getSession()
  if (!session) {
    alert('You must be logged in to reject requests.')
    return
  }

  const reason = prompt('Enter rejection reason (optional):')
  if (reason === null) return // User cancelled

  isProcessing.value = requestId

  try {
    await registrationRequestService.rejectRequest(requestId, session.id, reason || undefined)
    alert('Registration request rejected.')
    await loadRequests()
  } catch (error) {
    console.error('Error rejecting request:', error)
    alert('Failed to reject request. Please try again.')
  } finally {
    isProcessing.value = null
  }
}

// Delete request
const deleteRequest = async (requestId: string) => {
  if (!requestId) return

  const confirmed = window.confirm(
    'Are you sure you want to delete this registration request? This action cannot be undone.',
  )
  if (!confirmed) return

  isProcessing.value = requestId

  try {
    await registrationRequestService.deleteRequest(requestId)
    alert('Registration request deleted successfully!')
    await loadRequests()
  } catch (error) {
    console.error('Error deleting request:', error)
    alert('Failed to delete request. Please try again.')
  } finally {
    isProcessing.value = null
  }
}

// Format date
const formatDate = (timestamp: Timestamp | string | undefined) => {
  if (!timestamp) return 'N/A'
  let date: Date
  if (typeof timestamp === 'string') {
    date = new Date(timestamp)
  } else if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    date = (timestamp as Timestamp).toDate()
  } else {
    date = new Date(timestamp as string)
  }
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="pending-registrations-page">
    <header class="page-header">
      <div>
        <h2>Pending Registrations</h2>
        <p>Review and manage registration requests from new members and users</p>
      </div>
    </header>

    <!-- Stats -->
    <section class="stats">
      <article class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">Total Requests</div>
      </article>
      <article class="stat-card">
        <div class="stat-value warning">{{ stats.pending }}</div>
        <div class="stat-label">Pending</div>
      </article>
      <article class="stat-card">
        <div class="stat-value success">{{ stats.approved }}</div>
        <div class="stat-label">Approved</div>
      </article>
      <article class="stat-card">
        <div class="stat-value danger">{{ stats.rejected }}</div>
        <div class="stat-label">Rejected</div>
      </article>
    </section>

    <!-- Filters -->
    <section class="filters">
      <input
        v-model="searchTerm"
        type="text"
        placeholder="Search by name or email..."
        class="search-input"
      />
      <select v-model="statusFilter" class="filter-select">
        <option value="All">All Status</option>
        <option value="Pending">Pending</option>
        <option value="Approved">Approved</option>
        <option value="Rejected">Rejected</option>
      </select>
    </section>

    <!-- Requests List -->
    <section class="requests-section">
      <div v-if="isLoading" class="loading-state">
        <p>Loading registration requests...</p>
      </div>

      <div v-else-if="filteredRequests.length === 0" class="empty-state">
        <p>No registration requests found</p>
      </div>

      <div v-else class="requests-grid">
        <article
          v-for="request in filteredRequests"
          :key="request.id"
          class="request-card"
          :class="request.status.toLowerCase()"
        >
          <div class="card-header">
            <div>
              <div class="request-name">{{ request.firstName }} {{ request.lastName }}</div>
              <div class="request-email">{{ request.email }}</div>
            </div>
            <span :class="['status-badge', request.status.toLowerCase()]">
              {{ request.status }}
            </span>
          </div>

          <div class="card-body">
            <div class="request-detail">
              <span class="label">Role:</span>
              <span class="value">{{ request.role.toUpperCase() }}</span>
            </div>
            <div class="request-detail">
              <span class="label">Requested:</span>
              <span class="value">{{ formatDate(request.requestedAt) }}</span>
            </div>
            <div v-if="request.reviewedAt" class="request-detail">
              <span class="label">Reviewed:</span>
              <span class="value">{{ formatDate(request.reviewedAt) }}</span>
            </div>
            <div v-if="request.rejectionReason" class="request-detail">
              <span class="label">Rejection Reason:</span>
              <span class="value rejection-reason">{{ request.rejectionReason }}</span>
            </div>
          </div>

          <div class="card-actions">
            <button
              v-if="request.status === 'Pending'"
              type="button"
              class="btn btn-success"
              @click="approveRequest(request.id!)"
              :disabled="isProcessing === request.id"
            >
              {{ isProcessing === request.id ? 'Processing...' : 'Approve' }}
            </button>
            <button
              v-if="request.status === 'Pending'"
              type="button"
              class="btn btn-danger"
              @click="rejectRequest(request.id!)"
              :disabled="isProcessing === request.id"
            >
              {{ isProcessing === request.id ? 'Processing...' : 'Reject' }}
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              @click="deleteRequest(request.id!)"
              :disabled="isProcessing === request.id"
            >
              Delete
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pending-registrations-page {
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

.stat-value.danger {
  color: #dc2626;
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

.requests-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}

.requests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.request-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: box-shadow 0.2s;
}

.request-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.request-card.pending {
  border-left: 4px solid #f59e0b;
}

.request-card.approved {
  border-left: 4px solid #10b981;
}

.request-card.rejected {
  border-left: 4px solid #ef4444;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.request-name {
  font-weight: 600;
  color: #0f172a;
  font-size: 18px;
}

.request-email {
  font-size: 14px;
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

.status-badge.pending {
  background: #fef3c7;
  color: #b45309;
}

.status-badge.approved {
  background: #dcfce7;
  color: #166534;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #b91c1c;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.request-detail {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.request-detail .label {
  color: #64748b;
  font-weight: 500;
}

.request-detail .value {
  color: #0f172a;
  font-weight: 500;
  text-align: right;
}

.rejection-reason {
  color: #dc2626;
  font-style: italic;
}

.card-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  flex: 1;
}

.btn-success {
  background: #10b981;
  color: #fff;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
}

.btn-danger {
  background: #ef4444;
  color: #fff;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .pending-registrations-page {
    padding: 16px;
  }

  .requests-grid {
    grid-template-columns: 1fr;
  }

  .filters {
    flex-direction: column;
  }
}
</style>
