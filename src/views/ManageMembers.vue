<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { memberService, type Member } from '../firebase/services'

// Map membership types from Firebase to display format
const mapMembershipType = (type: string): 'Basic' | 'Premium' | 'Gold' | 'Platinum' => {
  const typeMap: Record<string, 'Basic' | 'Premium' | 'Gold' | 'Platinum'> = {
    basic: 'Basic',
    premium: 'Premium',
    gold: 'Gold',
    platinum: 'Platinum',
  }
  return typeMap[type.toLowerCase()] || 'Basic'
}

// Convert Firebase Member to display format
interface DisplayMember {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  membership: 'Basic' | 'Premium' | 'Gold' | 'Platinum'
  startDate: string
  endDate: string
  status: 'Active' | 'Inactive' | 'Expired'
  dues: number
  lastCheckIn?: string
}

const members = ref<DisplayMember[]>([])
const isLoading = ref(true)

// Load members from Firebase
const loadMembers = async () => {
  try {
    isLoading.value = true
    const firebaseMembers = await memberService.getAllMembers()

    // Convert to display format
    members.value = firebaseMembers.map((member) => ({
      id: member.id || '',
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      membership: mapMembershipType(member.membershipType),
      startDate: member.startDate,
      endDate: member.endDate,
      status: member.status,
      dues: member.dues || 0,
      lastCheckIn: member.lastCheckIn,
    }))
  } catch (error) {
    console.error('Error loading members:', error)
    alert('Failed to load members. Please refresh the page.')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadMembers()
})

const searchTerm = ref('')
const membershipFilter = ref<'All' | DisplayMember['membership']>('All')
const statusFilter = ref<'All' | DisplayMember['status']>('All')

const quickStats = computed(() => {
  const total = members.value.length
  const active = members.value.filter((member) => member.status === 'Active').length
  const expired = members.value.filter((member) => member.status === 'Expired').length
  const dues = members.value.reduce((sum, member) => sum + member.dues, 0)

  return {
    total,
    active,
    expired,
    dues,
  }
})

const filters = reactive([
  { label: 'All', value: 'All' as const },
  { label: 'Basic', value: 'Basic' as const },
  { label: 'Premium', value: 'Premium' as const },
  { label: 'Gold', value: 'Gold' as const },
  { label: 'Platinum', value: 'Platinum' as const },
])

const statusOptions = reactive([
  { label: 'All', value: 'All' as const },
  { label: 'Active', value: 'Active' as const },
  { label: 'Inactive', value: 'Inactive' as const },
  { label: 'Expired', value: 'Expired' as const },
])

const filteredMembers = computed(() => {
  return members.value.filter((member) => {
    const matchesSearch =
      `${member.firstName} ${member.lastName}`
        .toLowerCase()
        .includes(searchTerm.value.toLowerCase().trim()) ||
      member.email.includes(searchTerm.value.toLowerCase().trim())

    const matchesMembership =
      membershipFilter.value === 'All' || member.membership === membershipFilter.value

    const matchesStatus = statusFilter.value === 'All' || member.status === statusFilter.value

    return matchesSearch && matchesMembership && matchesStatus
  })
})

const selectedMember = ref<DisplayMember | null>(null)
const fullMemberData = ref<Member | null>(null)
const showDetails = ref(false)
const isEditMode = ref(false)
const isUpdating = ref(false)

// Edit form data
const editForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  membershipType: '',
  startDate: '',
  endDate: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  medicalConditions: '',
  dues: 0,
})

const membershipTypes = [
  { value: 'basic', label: 'Basic (Monthly)' },
  { value: 'premium', label: 'Premium (3 Months)' },
  { value: 'gold', label: 'Gold (6 Months)' },
  { value: 'platinum', label: 'Platinum (Yearly)' },
]

const openDetails = async (member: DisplayMember) => {
  selectedMember.value = member
  showDetails.value = true
  isEditMode.value = false

  // Load full member data from Firebase
  try {
    const fullData = await memberService.getMemberById(member.id)
    if (fullData) {
      fullMemberData.value = fullData
      // Populate edit form
      editForm.value = {
        firstName: fullData.firstName,
        lastName: fullData.lastName,
        email: fullData.email,
        phone: fullData.phone,
        dateOfBirth: fullData.dateOfBirth,
        gender: fullData.gender,
        address: fullData.address,
        city: fullData.city,
        state: fullData.state,
        zipCode: fullData.zipCode,
        membershipType: fullData.membershipType,
        startDate: fullData.startDate,
        endDate: fullData.endDate,
        emergencyContactName: fullData.emergencyContactName,
        emergencyContactPhone: fullData.emergencyContactPhone,
        medicalConditions: fullData.medicalConditions || '',
        dues: fullData.dues || 0,
      }
    }
  } catch (error) {
    console.error('Error loading member details:', error)
  }
}

const closeDetails = () => {
  showDetails.value = false
  selectedMember.value = null
  fullMemberData.value = null
  isEditMode.value = false
}

const enableEditMode = () => {
  isEditMode.value = true
}

const cancelEdit = () => {
  isEditMode.value = false
  // Reset form to original values
  if (fullMemberData.value) {
    editForm.value = {
      firstName: fullMemberData.value.firstName,
      lastName: fullMemberData.value.lastName,
      email: fullMemberData.value.email,
      phone: fullMemberData.value.phone,
      dateOfBirth: fullMemberData.value.dateOfBirth,
      gender: fullMemberData.value.gender,
      address: fullMemberData.value.address,
      city: fullMemberData.value.city,
      state: fullMemberData.value.state,
      zipCode: fullMemberData.value.zipCode,
      membershipType: fullMemberData.value.membershipType,
      startDate: fullMemberData.value.startDate,
      endDate: fullMemberData.value.endDate,
      emergencyContactName: fullMemberData.value.emergencyContactName,
      emergencyContactPhone: fullMemberData.value.emergencyContactPhone,
      medicalConditions: fullMemberData.value.medicalConditions || '',
      dues: fullMemberData.value.dues || 0,
    }
  }
}

const updateMember = async () => {
  if (!selectedMember.value) return

  isUpdating.value = true

  try {
    // Calculate new status based on end date
    const newStatus = memberService.calculateStatus(editForm.value.endDate)

    // Update member in Firebase
    await memberService.updateMember(selectedMember.value.id, {
      firstName: editForm.value.firstName,
      lastName: editForm.value.lastName,
      email: editForm.value.email,
      phone: editForm.value.phone,
      dateOfBirth: editForm.value.dateOfBirth,
      gender: editForm.value.gender,
      address: editForm.value.address,
      city: editForm.value.city,
      state: editForm.value.state,
      zipCode: editForm.value.zipCode,
      membershipType: editForm.value.membershipType,
      startDate: editForm.value.startDate,
      endDate: editForm.value.endDate,
      emergencyContactName: editForm.value.emergencyContactName,
      emergencyContactPhone: editForm.value.emergencyContactPhone,
      medicalConditions: editForm.value.medicalConditions,
      dues: editForm.value.dues,
      status: newStatus,
    })

    // Reload members list
    await loadMembers()

    // Update selected member display
    const updatedMember = members.value.find((m) => m.id === selectedMember.value?.id)
    if (updatedMember) {
      selectedMember.value = updatedMember
    }

    // Reload full member data
    const fullData = await memberService.getMemberById(selectedMember.value.id)
    if (fullData) {
      fullMemberData.value = fullData
    }

    isEditMode.value = false
    alert('Member updated successfully!')
  } catch (error) {
    console.error('Error updating member:', error)
    alert('Failed to update member. Please try again.')
  } finally {
    isUpdating.value = false
  }
}

const deleteMember = async (memberId: string) => {
  const member = members.value.find((item) => item.id === memberId)
  if (!member) {
    return
  }

  const confirmed = window.confirm(
    `Are you sure you want to remove ${member.firstName} ${member.lastName} from the members list?`,
  )

  if (!confirmed) {
    return
  }

  try {
    await memberService.deleteMember(memberId)
    members.value = members.value.filter((item) => item.id !== memberId)
    if (selectedMember.value?.id === memberId) {
      closeDetails()
    }
    alert('Member deleted successfully!')
  } catch (error) {
    console.error('Error deleting member:', error)
    alert('Failed to delete member. Please try again.')
  }
}

const toggleMemberStatus = async () => {
  if (!selectedMember.value) return

  const currentStatus = selectedMember.value.status
  const newStatus: 'Active' | 'Inactive' | 'Expired' =
    currentStatus === 'Active' ? 'Inactive' : 'Active'

  const memberId = selectedMember.value.id

  try {
    await memberService.updateMember(memberId, { status: newStatus })

    // Update local state
    const memberIndex = members.value.findIndex((m) => m.id === memberId)
    if (memberIndex !== -1 && members.value[memberIndex]) {
      members.value[memberIndex].status = newStatus
    }

    // Update selected member
    if (selectedMember.value) {
      selectedMember.value.status = newStatus
    }

    alert(`Member status updated to ${newStatus}`)
  } catch (error) {
    console.error('Error updating member status:', error)
    alert('Failed to update member status. Please try again.')
  }
}

const exportMembers = () => {
  alert('Exporting members list... (hook into report export logic)')
}
</script>

<template>
  <div class="manage-members-page">
    <header class="page-header">
      <div>
        <h2>Members Directory</h2>
        <p>Search, filter, and manage all gym members</p>
      </div>
      <div class="actions">
        <button type="button" class="btn" @click="exportMembers">Export Members</button>
      </div>
    </header>

    <section class="stats">
      <article class="stat-card">
        <div class="stat-value">{{ quickStats.total }}</div>
        <div class="stat-label">Total Members</div>
      </article>
      <article class="stat-card">
        <div class="stat-value success">{{ quickStats.active }}</div>
        <div class="stat-label">Active Members</div>
      </article>
      <article class="stat-card">
        <div class="stat-value warning">{{ quickStats.expired }}</div>
        <div class="stat-label">Expired Memberships</div>
      </article>
      <article class="stat-card">
        <div class="stat-value info">₹{{ quickStats.dues.toLocaleString('en-IN') }}</div>
        <div class="stat-label">Pending Dues</div>
      </article>
    </section>

    <section class="filters">
      <div class="search">
        <input v-model="searchTerm" type="text" placeholder="Search members by name or email..." />
      </div>
      <div class="selectors">
        <select v-model="membershipFilter">
          <option v-for="option in filters" :key="option.value" :value="option.value">
            {{ option.label }} Membership
          </option>
        </select>
        <select v-model="statusFilter">
          <option v-for="option in statusOptions" :key="option.value" :value="option.value">
            {{ option.label }} Status
          </option>
        </select>
      </div>
    </section>

    <section class="members-table">
      <div v-if="isLoading" class="loading-state">
        <p>Loading members...</p>
      </div>
      <table v-else>
        <thead>
          <tr>
            <th>Member</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Membership</th>
            <th>Validity</th>
            <th>Status</th>
            <th>Dues</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredMembers.length === 0">
            <td colspan="8" class="empty-state">No members found for the selected filters.</td>
          </tr>
          <tr v-for="member in filteredMembers" :key="member.id">
            <td>
              <div class="member-info">
                <div class="avatar">
                  {{ member.firstName.slice(0, 1) }}{{ member.lastName.slice(0, 1) }}
                </div>
                <div>
                  <div class="name">{{ member.firstName }} {{ member.lastName }}</div>
                  <div class="sub">ID: {{ member.id.slice(0, 8) }}</div>
                </div>
              </div>
            </td>
            <td>{{ member.email }}</td>
            <td>{{ member.phone }}</td>
            <td>{{ member.membership }}</td>
            <td>
              <span class="sub">{{ member.startDate }} → {{ member.endDate }}</span>
            </td>
            <td>
              <span :class="['badge', member.status.toLowerCase()]">{{ member.status }}</span>
            </td>
            <td>
              <span v-if="member.dues === 0" class="badge success">No Dues</span>
              <span v-else class="badge warning">₹{{ member.dues.toLocaleString('en-IN') }}</span>
            </td>
            <td>
              <div class="row-actions">
                <button type="button" class="btn-link" @click="openDetails(member)">View</button>
                <button type="button" class="btn-link danger" @click="deleteMember(member.id)">
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <transition name="slide-up">
      <aside v-if="showDetails && selectedMember" class="member-drawer">
        <header class="drawer-header">
          <div>
            <div class="drawer-title">
              {{ selectedMember.firstName }} {{ selectedMember.lastName }}
            </div>
            <div class="drawer-subtitle">Member ID: {{ selectedMember.id.slice(0, 8) }}</div>
          </div>
          <button type="button" class="close" @click="closeDetails">×</button>
        </header>

        <div class="drawer-content">
          <!-- View Mode -->
          <template v-if="!isEditMode">
            <section>
              <h4>Personal Information</h4>
              <div class="info-grid">
                <div>
                  <span class="label">First Name</span>
                  <span class="value">{{
                    fullMemberData?.firstName || selectedMember.firstName
                  }}</span>
                </div>
                <div>
                  <span class="label">Last Name</span>
                  <span class="value">{{
                    fullMemberData?.lastName || selectedMember.lastName
                  }}</span>
                </div>
                <div>
                  <span class="label">Date of Birth</span>
                  <span class="value">{{ fullMemberData?.dateOfBirth || 'N/A' }}</span>
                </div>
                <div>
                  <span class="label">Gender</span>
                  <span class="value">{{ fullMemberData?.gender || 'N/A' }}</span>
                </div>
              </div>
            </section>

            <section>
              <h4>Contact Information</h4>
              <div class="info-grid">
                <div>
                  <span class="label">Email</span>
                  <span class="value">{{ selectedMember.email }}</span>
                </div>
                <div>
                  <span class="label">Phone</span>
                  <span class="value">{{ selectedMember.phone }}</span>
                </div>
                <div>
                  <span class="label">Address</span>
                  <span class="value">{{ fullMemberData?.address || 'N/A' }}</span>
                </div>
                <div>
                  <span class="label">City</span>
                  <span class="value">{{ fullMemberData?.city || 'N/A' }}</span>
                </div>
                <div>
                  <span class="label">State</span>
                  <span class="value">{{ fullMemberData?.state || 'N/A' }}</span>
                </div>
                <div>
                  <span class="label">Zip Code</span>
                  <span class="value">{{ fullMemberData?.zipCode || 'N/A' }}</span>
                </div>
              </div>
            </section>

            <section>
              <h4>Membership Details</h4>
              <div class="info-grid">
                <div>
                  <span class="label">Plan</span>
                  <span class="value">{{ selectedMember.membership }}</span>
                </div>
                <div>
                  <span class="label">Status</span>
                  <span :class="['value', 'badge', selectedMember.status.toLowerCase()]">
                    {{ selectedMember.status }}
                  </span>
                </div>
                <div>
                  <span class="label">Start Date</span>
                  <span class="value">{{ selectedMember.startDate }}</span>
                </div>
                <div>
                  <span class="label">End Date</span>
                  <span class="value">{{ selectedMember.endDate }}</span>
                </div>
                <div>
                  <span class="label">Pending Dues</span>
                  <span class="value">
                    <span v-if="selectedMember.dues === 0" class="badge success">No Dues</span>
                    <span v-else class="badge warning">
                      ₹{{ selectedMember.dues.toLocaleString('en-IN') }}
                    </span>
                  </span>
                </div>
                <div>
                  <span class="label">Last Check-In</span>
                  <span class="value">{{ selectedMember.lastCheckIn || 'N/A' }}</span>
                </div>
              </div>
            </section>

            <section v-if="fullMemberData?.emergencyContactName">
              <h4>Emergency Contact</h4>
              <div class="info-grid">
                <div>
                  <span class="label">Contact Name</span>
                  <span class="value">{{ fullMemberData.emergencyContactName }}</span>
                </div>
                <div>
                  <span class="label">Contact Phone</span>
                  <span class="value">{{ fullMemberData.emergencyContactPhone }}</span>
                </div>
              </div>
            </section>

            <section v-if="fullMemberData?.medicalConditions">
              <h4>Medical Conditions</h4>
              <div class="info-text">
                <span class="value">{{ fullMemberData.medicalConditions }}</span>
              </div>
            </section>
          </template>

          <!-- Edit Mode -->
          <template v-else>
            <form @submit.prevent="updateMember" class="edit-form">
              <section>
                <h4>Personal Information</h4>
                <div class="form-grid">
                  <div class="form-group">
                    <label>First Name</label>
                    <input v-model="editForm.firstName" type="text" required />
                  </div>
                  <div class="form-group">
                    <label>Last Name</label>
                    <input v-model="editForm.lastName" type="text" required />
                  </div>
                  <div class="form-group">
                    <label>Date of Birth</label>
                    <input v-model="editForm.dateOfBirth" type="date" required />
                  </div>
                  <div class="form-group">
                    <label>Gender</label>
                    <select v-model="editForm.gender" required>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </section>

              <section>
                <h4>Contact Information</h4>
                <div class="form-grid">
                  <div class="form-group">
                    <label>Email</label>
                    <input v-model="editForm.email" type="email" required />
                  </div>
                  <div class="form-group">
                    <label>Phone</label>
                    <input v-model="editForm.phone" type="tel" required />
                  </div>
                  <div class="form-group full-width">
                    <label>Address</label>
                    <input v-model="editForm.address" type="text" required />
                  </div>
                  <div class="form-group">
                    <label>City</label>
                    <input v-model="editForm.city" type="text" required />
                  </div>
                  <div class="form-group">
                    <label>State</label>
                    <input v-model="editForm.state" type="text" required />
                  </div>
                  <div class="form-group">
                    <label>Zip Code</label>
                    <input v-model="editForm.zipCode" type="text" required />
                  </div>
                </div>
              </section>

              <section>
                <h4>Membership Details</h4>
                <div class="form-grid">
                  <div class="form-group">
                    <label>Membership Type</label>
                    <select v-model="editForm.membershipType" required>
                      <option value="">Select membership</option>
                      <option v-for="type in membershipTypes" :key="type.value" :value="type.value">
                        {{ type.label }}
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Start Date</label>
                    <input v-model="editForm.startDate" type="date" required />
                  </div>
                  <div class="form-group">
                    <label>End Date</label>
                    <input v-model="editForm.endDate" type="date" required />
                  </div>
                  <div class="form-group">
                    <label>Pending Dues (₹)</label>
                    <input v-model.number="editForm.dues" type="number" min="0" />
                  </div>
                </div>
              </section>

              <section>
                <h4>Emergency Contact</h4>
                <div class="form-grid">
                  <div class="form-group">
                    <label>Contact Name</label>
                    <input v-model="editForm.emergencyContactName" type="text" required />
                  </div>
                  <div class="form-group">
                    <label>Contact Phone</label>
                    <input v-model="editForm.emergencyContactPhone" type="tel" required />
                  </div>
                </div>
              </section>

              <section>
                <h4>Medical Conditions</h4>
                <div class="form-group full-width">
                  <label>Medical Conditions (Optional)</label>
                  <textarea v-model="editForm.medicalConditions" rows="4"></textarea>
                </div>
              </section>
            </form>
          </template>
        </div>

        <footer class="drawer-footer">
          <template v-if="!isEditMode">
            <button type="button" class="btn" @click="closeDetails">Close</button>
            <button type="button" class="btn primary" @click="enableEditMode">Edit</button>
            <button
              type="button"
              class="btn"
              :class="selectedMember.status === 'Active' ? 'btn-warning' : 'btn-success'"
              @click="toggleMemberStatus"
            >
              {{ selectedMember.status === 'Active' ? 'Set Inactive' : 'Set Active' }}
            </button>
            <button type="button" class="btn primary">Send Reminder</button>
          </template>
          <template v-else>
            <button type="button" class="btn" @click="cancelEdit" :disabled="isUpdating">
              Cancel
            </button>
            <button type="button" class="btn primary" @click="updateMember" :disabled="isUpdating">
              {{ isUpdating ? 'Saving...' : 'Save Changes' }}
            </button>
          </template>
        </footer>
      </aside>
    </transition>
  </div>
</template>

<style scoped>
.manage-members-page {
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

.actions .btn {
  background: #1d4ed8;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.actions .btn:hover {
  background: #1e40af;
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

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.search {
  flex: 1 1 280px;
}

.search input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #fff;
  font-size: 14px;
  transition:
    border 0.2s,
    box-shadow 0.2s;
}

.search input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.selectors {
  display: flex;
  gap: 10px;
}

select {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #fff;
  font-size: 14px;
  cursor: pointer;
}

.members-table {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f8fafc;
}

th,
td {
  padding: 14px 16px;
  text-align: left;
  font-size: 14px;
  color: #0f172a;
}

th {
  font-weight: 600;
  color: #475569;
}

tbody tr:not(:last-child) td {
  border-bottom: 1px solid #e2e8f0;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #4338ca);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 600;
}

.name {
  font-weight: 600;
}

.sub {
  font-size: 12px;
  color: #64748b;
}

.badge {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.badge.active {
  background: #dcfce7;
  color: #166534;
}

.badge.inactive {
  background: #f1f5f9;
  color: #475569;
}

.badge.expired {
  background: #fee2e2;
  color: #b91c1c;
}

.badge.success {
  background: #dcfce7;
  color: #166534;
}

.badge.warning {
  background: #fef3c7;
  color: #b45309;
}

.row-actions {
  display: flex;
  gap: 12px;
}

.btn-link {
  background: transparent;
  border: none;
  color: #2563eb;
  cursor: pointer;
  padding: 0;
  font-weight: 500;
}

.btn-link:hover {
  text-decoration: underline;
}

.btn-link.danger {
  color: #b91c1c;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}

.loading-state p {
  font-size: 16px;
}

.member-drawer {
  position: fixed;
  bottom: 0;
  right: 24px;
  width: min(420px, calc(100% - 48px));
  background: #fff;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -8px 30px rgba(15, 23, 42, 0.25);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.drawer-title {
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
}

.drawer-subtitle {
  font-size: 12px;
  color: #64748b;
}

.close {
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
  color: #475569;
}

.drawer-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.drawer-content section:not(:last-child) {
  margin-bottom: 24px;
}

.drawer-content h4 {
  margin: 0 0 12px;
  font-size: 16px;
  color: #1e293b;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.label {
  display: block;
  font-size: 12px;
  text-transform: uppercase;
  color: #94a3b8;
  margin-bottom: 4px;
}

.value {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
}

.info-text {
  margin-top: 8px;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
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

.form-group input:disabled,
.form-group select:disabled,
.form-group textarea:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
}

.drawer-footer .btn {
  padding: 10px 18px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.drawer-footer .btn.primary {
  background: #2563eb;
  color: #fff;
}

.drawer-footer .btn.primary:hover {
  background: #1d4ed8;
}

.drawer-footer .btn:not(.primary):not(.btn-warning):not(.btn-success) {
  background: #f1f5f9;
  color: #1e293b;
}

.drawer-footer .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.drawer-footer .btn.btn-warning {
  background: #f59e0b;
  color: #fff;
}

.drawer-footer .btn.btn-warning:hover {
  background: #d97706;
}

.drawer-footer .btn.btn-success {
  background: #10b981;
  color: #fff;
}

.drawer-footer .btn.btn-success:hover {
  background: #059669;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.2s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(24px);
  opacity: 0;
}

@media (max-width: 900px) {
  .selectors {
    width: 100%;
    justify-content: space-between;
  }

  .members-table {
    overflow-x: auto;
  }
}

@media (max-width: 600px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .selectors {
    flex-direction: column;
  }

  .manage-members-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }

  .member-drawer {
    right: 0;
    width: 100%;
    border-radius: 16px 16px 0 0;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
