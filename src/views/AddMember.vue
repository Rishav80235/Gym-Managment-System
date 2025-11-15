<script setup lang="ts">
import { ref } from 'vue'
import { memberService } from '../firebase/services'

interface MemberForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  address: string
  city: string
  state: string
  zipCode: string
  membershipType: string
  startDate: string
  endDate: string
  emergencyContactName: string
  emergencyContactPhone: string
  medicalConditions: string
  photo: File | null
}

const form = ref<MemberForm>({
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
  photo: null,
})

const errors = ref<Partial<Record<keyof MemberForm, string>>>({})
const isSubmitting = ref(false)
const photoPreview = ref<string | null>(null)

const membershipTypes = [
  { value: 'basic', label: 'Basic (Monthly)' },
  { value: 'premium', label: 'Premium (3 Months)' },
  { value: 'gold', label: 'Gold (6 Months)' },
  { value: 'platinum', label: 'Platinum (Yearly)' },
]

const validateForm = (): boolean => {
  errors.value = {}

  if (!form.value.firstName.trim()) errors.value.firstName = 'First name is required'
  if (!form.value.lastName.trim()) errors.value.lastName = 'Last name is required'
  if (!form.value.email.trim()) {
    errors.value.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Invalid email format'
  }
  if (!form.value.phone.trim()) {
    errors.value.phone = 'Phone is required'
  } else if (!/^\d{10}$/.test(form.value.phone.replace(/\D/g, ''))) {
    errors.value.phone = 'Invalid phone number'
  }
  if (!form.value.dateOfBirth) errors.value.dateOfBirth = 'Date of birth is required'
  if (!form.value.gender) errors.value.gender = 'Gender is required'
  if (!form.value.address.trim()) errors.value.address = 'Address is required'
  if (!form.value.city.trim()) errors.value.city = 'City is required'
  if (!form.value.state.trim()) errors.value.state = 'State is required'
  if (!form.value.zipCode.trim()) errors.value.zipCode = 'Zip code is required'
  if (!form.value.membershipType) errors.value.membershipType = 'Membership type is required'
  if (!form.value.startDate) errors.value.startDate = 'Start date is required'
  if (!form.value.endDate) errors.value.endDate = 'End date is required'
  if (!form.value.emergencyContactName.trim())
    errors.value.emergencyContactName = 'Emergency contact name is required'
  if (!form.value.emergencyContactPhone.trim()) {
    errors.value.emergencyContactPhone = 'Emergency contact phone is required'
  } else if (!/^\d{10}$/.test(form.value.emergencyContactPhone.replace(/\D/g, ''))) {
    errors.value.emergencyContactPhone = 'Invalid phone number'
  }

  return Object.keys(errors.value).length === 0
}

const handlePhotoChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    form.value.photo = file
    const reader = new FileReader()
    reader.onload = (e) => {
      photoPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const resetForm = () => {
  form.value = {
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
    photo: null,
  }
  photoPreview.value = null
  errors.value = {}
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    // Calculate status based on end date
    const status = memberService.calculateStatus(form.value.endDate)

    // Prepare member data
    const memberData = {
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      email: form.value.email,
      phone: form.value.phone,
      dateOfBirth: form.value.dateOfBirth,
      gender: form.value.gender,
      address: form.value.address,
      city: form.value.city,
      state: form.value.state,
      zipCode: form.value.zipCode,
      membershipType: form.value.membershipType,
      startDate: form.value.startDate,
      endDate: form.value.endDate,
      emergencyContactName: form.value.emergencyContactName,
      emergencyContactPhone: form.value.emergencyContactPhone,
      medicalConditions: form.value.medicalConditions,
      status: status,
      dues: 0,
    }

    // Add member to Firebase first to get the ID
    const memberId = await memberService.addMember(memberData)

    // Upload photo if provided (after we have the member ID)
    if (form.value.photo) {
      try {
        const photoUrl = await memberService.uploadPhoto(form.value.photo, memberId)
        await memberService.updateMember(memberId, { photoUrl })
      } catch (photoError) {
        console.error('Error uploading photo:', photoError)
        // Continue even if photo upload fails
      }
    }

    alert('Member added successfully!')
    console.log('Member added with ID:', memberId)

    // Reset form
    resetForm()
  } catch (error) {
    console.error('Error adding member:', error)
    alert('Failed to add member. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

const formatPhone = (event: Event, field: 'phone' | 'emergencyContactPhone') => {
  const target = event.target as HTMLInputElement
  if (target) {
    const digits = target.value.replace(/\D/g, '')
    if (digits.length <= 10) {
      form.value[field] = digits
    }
  }
}
</script>

<template>
  <div class="add-member-page">
    <div class="page-header">
      <h2>Add New Member</h2>
      <p>Fill in the details to register a new gym member</p>
    </div>

    <form @submit.prevent="handleSubmit" class="member-form">
      <!-- Personal Information Section -->
      <section class="form-section">
        <h3 class="section-title">Personal Information</h3>
        <div class="form-grid">
          <div class="form-group">
            <label for="firstName">First Name <span class="required">*</span></label>
            <input
              id="firstName"
              v-model="form.firstName"
              type="text"
              placeholder="Enter first name"
              :class="{ error: errors.firstName }"
            />
            <span v-if="errors.firstName" class="error-message">{{ errors.firstName }}</span>
          </div>

          <div class="form-group">
            <label for="lastName">Last Name <span class="required">*</span></label>
            <input
              id="lastName"
              v-model="form.lastName"
              type="text"
              placeholder="Enter last name"
              :class="{ error: errors.lastName }"
            />
            <span v-if="errors.lastName" class="error-message">{{ errors.lastName }}</span>
          </div>

          <div class="form-group">
            <label for="email">Email <span class="required">*</span></label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="member@example.com"
              :class="{ error: errors.email }"
            />
            <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
          </div>

          <div class="form-group">
            <label for="phone">Phone <span class="required">*</span></label>
            <input
              id="phone"
              v-model="form.phone"
              type="tel"
              placeholder="1234567890"
              maxlength="10"
              :class="{ error: errors.phone }"
              @input="formatPhone($event, 'phone')"
            />
            <span v-if="errors.phone" class="error-message">{{ errors.phone }}</span>
          </div>

          <div class="form-group">
            <label for="dateOfBirth">Date of Birth <span class="required">*</span></label>
            <input
              id="dateOfBirth"
              v-model="form.dateOfBirth"
              type="date"
              :class="{ error: errors.dateOfBirth }"
            />
            <span v-if="errors.dateOfBirth" class="error-message">{{ errors.dateOfBirth }}</span>
          </div>

          <div class="form-group">
            <label for="gender">Gender <span class="required">*</span></label>
            <select id="gender" v-model="form.gender" :class="{ error: errors.gender }">
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
            <span v-if="errors.gender" class="error-message">{{ errors.gender }}</span>
          </div>
        </div>
      </section>

      <!-- Address Section -->
      <section class="form-section">
        <h3 class="section-title">Address</h3>
        <div class="form-grid">
          <div class="form-group full-width">
            <label for="address">Street Address <span class="required">*</span></label>
            <input
              id="address"
              v-model="form.address"
              type="text"
              placeholder="123 Main Street"
              :class="{ error: errors.address }"
            />
            <span v-if="errors.address" class="error-message">{{ errors.address }}</span>
          </div>

          <div class="form-group">
            <label for="city">City <span class="required">*</span></label>
            <input
              id="city"
              v-model="form.city"
              type="text"
              placeholder="Enter city"
              :class="{ error: errors.city }"
            />
            <span v-if="errors.city" class="error-message">{{ errors.city }}</span>
          </div>

          <div class="form-group">
            <label for="state">State <span class="required">*</span></label>
            <input
              id="state"
              v-model="form.state"
              type="text"
              placeholder="Enter state"
              :class="{ error: errors.state }"
            />
            <span v-if="errors.state" class="error-message">{{ errors.state }}</span>
          </div>

          <div class="form-group">
            <label for="zipCode">Zip Code <span class="required">*</span></label>
            <input
              id="zipCode"
              v-model="form.zipCode"
              type="text"
              placeholder="12345"
              :class="{ error: errors.zipCode }"
            />
            <span v-if="errors.zipCode" class="error-message">{{ errors.zipCode }}</span>
          </div>
        </div>
      </section>

      <!-- Membership Details Section -->
      <section class="form-section">
        <h3 class="section-title">Membership Details</h3>
        <div class="form-grid">
          <div class="form-group">
            <label for="membershipType">Membership Type <span class="required">*</span></label>
            <select
              id="membershipType"
              v-model="form.membershipType"
              :class="{ error: errors.membershipType }"
            >
              <option value="">Select membership type</option>
              <option v-for="type in membershipTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
            <span v-if="errors.membershipType" class="error-message">{{
              errors.membershipType
            }}</span>
          </div>

          <div class="form-group">
            <label for="startDate">Start Date <span class="required">*</span></label>
            <input
              id="startDate"
              v-model="form.startDate"
              type="date"
              :class="{ error: errors.startDate }"
            />
            <span v-if="errors.startDate" class="error-message">{{ errors.startDate }}</span>
          </div>

          <div class="form-group">
            <label for="endDate">End Date <span class="required">*</span></label>
            <input
              id="endDate"
              v-model="form.endDate"
              type="date"
              :class="{ error: errors.endDate }"
            />
            <span v-if="errors.endDate" class="error-message">{{ errors.endDate }}</span>
          </div>
        </div>
      </section>

      <!-- Emergency Contact Section -->
      <section class="form-section">
        <h3 class="section-title">Emergency Contact</h3>
        <div class="form-grid">
          <div class="form-group">
            <label for="emergencyContactName">Contact Name <span class="required">*</span></label>
            <input
              id="emergencyContactName"
              v-model="form.emergencyContactName"
              type="text"
              placeholder="Enter contact name"
              :class="{ error: errors.emergencyContactName }"
            />
            <span v-if="errors.emergencyContactName" class="error-message">{{
              errors.emergencyContactName
            }}</span>
          </div>

          <div class="form-group">
            <label for="emergencyContactPhone">Contact Phone <span class="required">*</span></label>
            <input
              id="emergencyContactPhone"
              v-model="form.emergencyContactPhone"
              type="tel"
              placeholder="1234567890"
              maxlength="10"
              :class="{ error: errors.emergencyContactPhone }"
              @input="formatPhone($event, 'emergencyContactPhone')"
            />
            <span v-if="errors.emergencyContactPhone" class="error-message">{{
              errors.emergencyContactPhone
            }}</span>
          </div>
        </div>
      </section>

      <!-- Additional Information Section -->
      <section class="form-section">
        <h3 class="section-title">Additional Information</h3>
        <div class="form-grid">
          <div class="form-group full-width">
            <label for="medicalConditions">Medical Conditions (Optional)</label>
            <textarea
              id="medicalConditions"
              v-model="form.medicalConditions"
              rows="4"
              placeholder="List any medical conditions or allergies..."
            ></textarea>
          </div>

          <div class="form-group full-width">
            <label for="photo">Member Photo (Optional)</label>
            <div class="photo-upload">
              <input
                id="photo"
                type="file"
                accept="image/*"
                @change="handlePhotoChange"
                class="file-input"
              />
              <label for="photo" class="file-label">
                <span v-if="!photoPreview">Choose Photo</span>
                <span v-else>Change Photo</span>
              </label>
              <div v-if="photoPreview" class="photo-preview">
                <img :src="photoPreview" alt="Member photo preview" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="resetForm">Reset Form</button>
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          <span v-if="isSubmitting">Adding Member...</span>
          <span v-else>Add Member</span>
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.add-member-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px;
}

.page-header p {
  color: #64748b;
  margin: 0;
  font-size: 14px;
}

.member-form {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 40px;
  padding-bottom: 32px;
  border-bottom: 1px solid #e2e8f0;
}

.form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 24px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f1f5f9;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

label {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
  margin-bottom: 8px;
}

.required {
  color: #dc2626;
}

input[type='text'],
input[type='email'],
input[type='tel'],
input[type='date'],
select,
textarea {
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  color: #0f172a;
  background: #fff;
  transition: all 0.2s;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

input.error,
select.error,
textarea.error {
  border-color: #dc2626;
}

input.error:focus,
select.error:focus,
textarea.error:focus {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.error-message {
  color: #dc2626;
  font-size: 12px;
  margin-top: 4px;
}

textarea {
  resize: vertical;
  font-family: inherit;
}

.photo-upload {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-input {
  display: none;
}

.file-label {
  display: inline-block;
  padding: 10px 20px;
  background: #f1f5f9;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  font-size: 14px;
  color: #475569;
  transition: all 0.2s;
  width: fit-content;
}

.file-label:hover {
  background: #e2e8f0;
  border-color: #94a3b8;
}

.photo-preview {
  width: 150px;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e2e8f0;
}

.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
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

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-group.full-width {
    grid-column: 1;
  }

  .add-member-page {
    padding: 16px;
  }

  .member-form {
    padding: 20px;
  }
}
</style>
