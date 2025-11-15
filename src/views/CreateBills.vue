<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { memberService, billService, type Member, type Bill } from '../firebase/services'

const members = ref<Member[]>([])
const bills = ref<Bill[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)

// Form data
const billForm = ref({
  memberId: '',
  amount: 0,
  description: '',
  dueDate: '',
})

const searchTerm = ref('')
const statusFilter = ref<'All' | Bill['status']>('All')

// Load data
const loadMembers = async () => {
  try {
    const allMembers = await memberService.getAllMembers()
    members.value = allMembers.filter((m) => m.status === 'Active')
  } catch (error) {
    console.error('Error loading members:', error)
  }
}

const loadBills = async () => {
  try {
    isLoading.value = true
    bills.value = await billService.getAllBills()
  } catch (error) {
    console.error('Error loading bills:', error)
    alert('Failed to load bills. Please refresh the page.')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadMembers()
  await loadBills()
})

// Filtered bills
const filteredBills = computed(() => {
  return bills.value.filter((bill) => {
    const matchesSearch =
      bill.memberName.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      bill.billNumber.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      bill.description.toLowerCase().includes(searchTerm.value.toLowerCase())

    const matchesStatus = statusFilter.value === 'All' || bill.status === statusFilter.value

    return matchesSearch && matchesStatus
  })
})

// Stats
const stats = computed(() => {
  const total = bills.value.length
  const pending = bills.value.filter((b) => b.status === 'Pending').length
  const paid = bills.value.filter((b) => b.status === 'Paid').length
  const overdue = bills.value.filter((b) => b.status === 'Overdue').length
  const totalAmount = bills.value.reduce((sum, b) => sum + b.amount, 0)
  const pendingAmount = bills.value
    .filter((b) => b.status === 'Pending' || b.status === 'Overdue')
    .reduce((sum, b) => sum + b.amount, 0)

  return {
    total,
    pending,
    paid,
    overdue,
    totalAmount,
    pendingAmount,
  }
})

// Create bill
const createBill = async () => {
  if (!billForm.value.memberId || !billForm.value.amount || !billForm.value.dueDate) {
    alert('Please fill in all required fields')
    return
  }

  isSubmitting.value = true

  try {
    const selectedMember = members.value.find((m) => m.id === billForm.value.memberId)
    if (!selectedMember) {
      alert('Member not found')
      return
    }

    const billNumber = billService.generateBillNumber()
    const memberName = `${selectedMember.firstName} ${selectedMember.lastName}`

    await billService.createBill({
      memberId: billForm.value.memberId,
      memberName,
      billNumber,
      amount: billForm.value.amount,
      description: billForm.value.description || 'Membership fee',
      dueDate: billForm.value.dueDate,
    })

    alert('Bill created successfully!')

    // Reset form
    billForm.value = {
      memberId: '',
      amount: 0,
      description: '',
      dueDate: '',
    }

    // Reload bills and members
    await loadBills()
    await loadMembers()
  } catch (error) {
    console.error('Error creating bill:', error)
    alert('Failed to create bill. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

// Mark bill as paid
const markAsPaid = async (billId: string) => {
  const paymentMethod = prompt('Enter payment method (Cash/Card/Online):', 'Cash')
  if (!paymentMethod) return

  try {
    await billService.markBillAsPaid(billId, paymentMethod)
    alert('Bill marked as paid!')
    await loadBills()
    await loadMembers()
  } catch (error) {
    console.error('Error marking bill as paid:', error)
    alert('Failed to update bill. Please try again.')
  }
}

// Delete bill
const deleteBill = async (billId: string) => {
  const bill = bills.value.find((b) => b.id === billId)
  if (!bill) return

  const confirmed = window.confirm(`Are you sure you want to delete bill ${bill.billNumber}?`)

  if (!confirmed) return

  try {
    await billService.deleteBill(billId)
    alert('Bill deleted successfully!')
    await loadBills()
    await loadMembers()
  } catch (error) {
    console.error('Error deleting bill:', error)
    alert('Failed to delete bill. Please try again.')
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
  <div class="create-bills-page">
    <header class="page-header">
      <div>
        <h2>Create Bills</h2>
        <p>Generate invoices and track payments for gym members</p>
      </div>
    </header>

    <!-- Stats -->
    <section class="stats">
      <article class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">Total Bills</div>
      </article>
      <article class="stat-card">
        <div class="stat-value warning">{{ stats.pending }}</div>
        <div class="stat-label">Pending</div>
      </article>
      <article class="stat-card">
        <div class="stat-value success">{{ stats.paid }}</div>
        <div class="stat-label">Paid</div>
      </article>
      <article class="stat-card">
        <div class="stat-value danger">{{ stats.overdue }}</div>
        <div class="stat-label">Overdue</div>
      </article>
      <article class="stat-card">
        <div class="stat-value info">₹{{ stats.pendingAmount.toLocaleString('en-IN') }}</div>
        <div class="stat-label">Pending Amount</div>
      </article>
    </section>

    <div class="content-grid">
      <!-- Create Bill Form -->
      <section class="create-form-section">
        <h3>Create New Bill</h3>
        <form @submit.prevent="createBill" class="bill-form">
          <div class="form-group">
            <label for="memberId">Select Member <span class="required">*</span></label>
            <select id="memberId" v-model="billForm.memberId" required>
              <option value="">Choose a member...</option>
              <option v-for="member in members" :key="member.id" :value="member.id">
                {{ member.firstName }} {{ member.lastName }} - {{ member.email }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="amount">Amount (₹) <span class="required">*</span></label>
            <input
              id="amount"
              v-model.number="billForm.amount"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="Enter amount"
            />
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              v-model="billForm.description"
              rows="3"
              placeholder="Membership fee, Personal training, etc."
            ></textarea>
          </div>

          <div class="form-group">
            <label for="dueDate">Due Date <span class="required">*</span></label>
            <input id="dueDate" v-model="billForm.dueDate" type="date" required />
          </div>

          <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
            {{ isSubmitting ? 'Creating...' : 'Create Bill' }}
          </button>
        </form>
      </section>

      <!-- Bills List -->
      <section class="bills-list-section">
        <div class="section-header">
          <h3>All Bills</h3>
          <div class="filters">
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Search bills..."
              class="search-input"
            />
            <select v-model="statusFilter" class="filter-select">
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div v-if="isLoading" class="loading-state">
          <p>Loading bills...</p>
        </div>

        <div v-else-if="filteredBills.length === 0" class="empty-state">
          <p>No bills found</p>
        </div>

        <div v-else class="bills-grid">
          <article v-for="bill in filteredBills" :key="bill.id" class="bill-card">
            <div class="bill-header">
              <div>
                <div class="bill-number">{{ bill.billNumber }}</div>
                <div class="bill-member">{{ bill.memberName }}</div>
              </div>
              <span :class="['status-badge', bill.status.toLowerCase()]">
                {{ bill.status }}
              </span>
            </div>

            <div class="bill-body">
              <div class="bill-detail">
                <span class="label">Amount:</span>
                <span class="value">₹{{ bill.amount.toLocaleString('en-IN') }}</span>
              </div>
              <div class="bill-detail">
                <span class="label">Description:</span>
                <span class="value">{{ bill.description || 'N/A' }}</span>
              </div>
              <div class="bill-detail">
                <span class="label">Due Date:</span>
                <span class="value">{{ formatDate(bill.dueDate) }}</span>
              </div>
              <div v-if="bill.paymentDate" class="bill-detail">
                <span class="label">Paid On:</span>
                <span class="value">{{ formatDate(bill.paymentDate) }}</span>
              </div>
              <div v-if="bill.paymentMethod" class="bill-detail">
                <span class="label">Payment Method:</span>
                <span class="value">{{ bill.paymentMethod }}</span>
              </div>
            </div>

            <div class="bill-actions">
              <button
                v-if="bill.status !== 'Paid'"
                type="button"
                class="btn btn-success"
                @click="markAsPaid(bill.id!)"
              >
                Mark as Paid
              </button>
              <button type="button" class="btn btn-danger" @click="deleteBill(bill.id!)">
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
.create-bills-page {
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

.create-form-section,
.bills-list-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.create-form-section h3,
.bills-list-section h3 {
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
}

.bill-form {
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

.btn-success {
  background: #10b981;
  color: #fff;
}

.btn-success:hover {
  background: #059669;
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

.bills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.bill-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bill-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.bill-number {
  font-weight: 600;
  color: #0f172a;
  font-size: 14px;
}

.bill-member {
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

.status-badge.pending {
  background: #fef3c7;
  color: #b45309;
}

.status-badge.paid {
  background: #dcfce7;
  color: #166534;
}

.status-badge.overdue {
  background: #fee2e2;
  color: #b91c1c;
}

.bill-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.bill-detail {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.bill-detail .label {
  color: #64748b;
}

.bill-detail .value {
  color: #0f172a;
  font-weight: 500;
}

.bill-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.bill-actions .btn {
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
  .create-bills-page {
    padding: 16px;
  }

  .bills-grid {
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
