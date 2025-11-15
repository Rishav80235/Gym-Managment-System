<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  memberService,
  supplementService,
  type Member,
  type Supplement,
  type SupplementOrder,
} from '../firebase/services'

const supplements = ref<Supplement[]>([])
const orders = ref<SupplementOrder[]>([])
const members = ref<Member[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const showAddForm = ref(false)
const isEditMode = ref(false)
const editingSupplement = ref<Supplement | null>(null)

// Form data
const supplementForm = ref({
  name: '',
  brand: '',
  category: '',
  description: '',
  price: 0,
  stock: 0,
  barcode: '',
  expiryDate: '',
})

const searchTerm = ref('')
const categoryFilter = ref('All')
const stockFilter = ref('All')

// Categories
const categories = [
  'Protein',
  'Creatine',
  'Pre-Workout',
  'Post-Workout',
  'Vitamins',
  'Amino Acids',
  'Fat Burners',
  'Other',
]

// Load data
const loadSupplements = async () => {
  try {
    isLoading.value = true
    supplements.value = await supplementService.getAllSupplements()
  } catch (error) {
    console.error('Error loading supplements:', error)
    alert('Failed to load supplements. Please refresh the page.')
  } finally {
    isLoading.value = false
  }
}

const loadOrders = async () => {
  try {
    orders.value = await supplementService.getAllOrders()
  } catch (error) {
    console.error('Error loading orders:', error)
  }
}

const loadMembers = async () => {
  try {
    members.value = await memberService.getAllMembers()
  } catch (error) {
    console.error('Error loading members:', error)
  }
}

onMounted(async () => {
  await Promise.all([loadSupplements(), loadOrders(), loadMembers()])
})

// Filtered supplements
const filteredSupplements = computed(() => {
  return supplements.value.filter((supplement) => {
    const matchesSearch =
      supplement.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      supplement.brand.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      supplement.category.toLowerCase().includes(searchTerm.value.toLowerCase())

    const matchesCategory =
      categoryFilter.value === 'All' || supplement.category === categoryFilter.value

    const matchesStock =
      stockFilter.value === 'All' ||
      (stockFilter.value === 'In Stock' && supplement.stock > 0) ||
      (stockFilter.value === 'Out of Stock' && supplement.stock === 0) ||
      (stockFilter.value === 'Low Stock' && supplement.stock > 0 && supplement.stock <= 10)

    return matchesSearch && matchesCategory && matchesStock
  })
})

// Stats
const stats = computed(() => {
  const total = supplements.value.length
  const inStock = supplements.value.filter((s) => s.stock > 0).length
  const outOfStock = supplements.value.filter((s) => s.stock === 0).length
  const lowStock = supplements.value.filter((s) => s.stock > 0 && s.stock <= 10).length
  const totalValue = supplements.value.reduce((sum, s) => sum + s.price * s.stock, 0)
  const totalSales = orders.value.reduce((sum, o) => sum + o.totalAmount, 0)

  return {
    total,
    inStock,
    outOfStock,
    lowStock,
    totalValue,
    totalSales,
  }
})

// Open add form
const openAddForm = () => {
  showAddForm.value = true
  isEditMode.value = false
  editingSupplement.value = null
  resetForm()
}

// Open edit form
const openEditForm = (supplement: Supplement) => {
  showAddForm.value = true
  isEditMode.value = true
  editingSupplement.value = supplement
  supplementForm.value = {
    name: supplement.name,
    brand: supplement.brand,
    category: supplement.category,
    description: supplement.description,
    price: supplement.price,
    stock: supplement.stock,
    barcode: supplement.barcode || '',
    expiryDate: supplement.expiryDate || '',
  }
}

// Close form
const closeForm = () => {
  showAddForm.value = false
  isEditMode.value = false
  editingSupplement.value = null
  resetForm()
}

// Reset form
const resetForm = () => {
  supplementForm.value = {
    name: '',
    brand: '',
    category: '',
    description: '',
    price: 0,
    stock: 0,
    barcode: '',
    expiryDate: '',
  }
}

// Save supplement
const saveSupplement = async () => {
  if (
    !supplementForm.value.name ||
    !supplementForm.value.brand ||
    !supplementForm.value.category ||
    supplementForm.value.price <= 0
  ) {
    alert('Please fill in all required fields')
    return
  }

  isSubmitting.value = true

  try {
    if (isEditMode.value && editingSupplement.value?.id) {
      await supplementService.updateSupplement(editingSupplement.value.id, {
        ...supplementForm.value,
      })
      alert('Supplement updated successfully!')
    } else {
      await supplementService.addSupplement({
        ...supplementForm.value,
      })
      alert('Supplement added successfully!')
    }

    await loadSupplements()
    closeForm()
  } catch (error) {
    console.error('Error saving supplement:', error)
    alert('Failed to save supplement. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

// Delete supplement
const deleteSupplement = async (id: string) => {
  const supplement = supplements.value.find((s) => s.id === id)
  if (!supplement) return

  const confirmed = window.confirm(`Are you sure you want to delete ${supplement.name}?`)

  if (!confirmed) return

  try {
    await supplementService.deleteSupplement(id)
    alert('Supplement deleted successfully!')
    await loadSupplements()
  } catch (error) {
    console.error('Error deleting supplement:', error)
    alert('Failed to delete supplement. Please try again.')
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
  <div class="supplement-store-page">
    <header class="page-header">
      <div>
        <h2>Supplement Store</h2>
        <p>Manage supplement inventory and track sales</p>
      </div>
      <button type="button" class="btn btn-primary" @click="openAddForm">Add Supplement</button>
    </header>

    <!-- Stats -->
    <section class="stats">
      <article class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">Total Products</div>
      </article>
      <article class="stat-card">
        <div class="stat-value success">{{ stats.inStock }}</div>
        <div class="stat-label">In Stock</div>
      </article>
      <article class="stat-card">
        <div class="stat-value warning">{{ stats.lowStock }}</div>
        <div class="stat-label">Low Stock</div>
      </article>
      <article class="stat-card">
        <div class="stat-value danger">{{ stats.outOfStock }}</div>
        <div class="stat-label">Out of Stock</div>
      </article>
      <article class="stat-card">
        <div class="stat-value info">₹{{ stats.totalValue.toLocaleString('en-IN') }}</div>
        <div class="stat-label">Inventory Value</div>
      </article>
      <article class="stat-card">
        <div class="stat-value success">₹{{ stats.totalSales.toLocaleString('en-IN') }}</div>
        <div class="stat-label">Total Sales</div>
      </article>
    </section>

    <!-- Filters -->
    <section class="filters">
      <input
        v-model="searchTerm"
        type="text"
        placeholder="Search supplements..."
        class="search-input"
      />
      <select v-model="categoryFilter" class="filter-select">
        <option value="All">All Categories</option>
        <option v-for="cat in categories" :key="cat" :value="cat">
          {{ cat }}
        </option>
      </select>
      <select v-model="stockFilter" class="filter-select">
        <option value="All">All Stock</option>
        <option value="In Stock">In Stock</option>
        <option value="Low Stock">Low Stock</option>
        <option value="Out of Stock">Out of Stock</option>
      </select>
    </section>

    <!-- Supplements Grid -->
    <section class="supplements-grid">
      <div v-if="isLoading" class="loading-state">
        <p>Loading supplements...</p>
      </div>

      <div v-else-if="filteredSupplements.length === 0" class="empty-state">
        <p>No supplements found</p>
      </div>

      <article
        v-for="supplement in filteredSupplements"
        :key="supplement.id"
        class="supplement-card"
      >
        <div class="card-header">
          <div>
            <h3 class="product-name">{{ supplement.name }}</h3>
            <p class="product-brand">{{ supplement.brand }}</p>
          </div>
          <span
            :class="[
              'stock-badge',
              supplement.stock === 0 ? 'out' : supplement.stock <= 10 ? 'low' : 'in',
            ]"
          >
            {{
              supplement.stock === 0
                ? 'Out of Stock'
                : supplement.stock <= 10
                  ? 'Low Stock'
                  : 'In Stock'
            }}
          </span>
        </div>

        <div class="card-body">
          <div class="product-info">
            <div class="info-item">
              <span class="label">Category:</span>
              <span class="value">{{ supplement.category }}</span>
            </div>
            <div class="info-item">
              <span class="label">Price:</span>
              <span class="value price">₹{{ supplement.price.toLocaleString('en-IN') }}</span>
            </div>
            <div class="info-item">
              <span class="label">Stock:</span>
              <span class="value">{{ supplement.stock }} units</span>
            </div>
            <div v-if="supplement.expiryDate" class="info-item">
              <span class="label">Expiry:</span>
              <span class="value">{{ formatDate(supplement.expiryDate) }}</span>
            </div>
            <div v-if="supplement.description" class="info-item description">
              <span class="value">{{ supplement.description }}</span>
            </div>
          </div>
        </div>

        <div class="card-actions">
          <button type="button" class="btn btn-secondary" @click="openEditForm(supplement)">
            Edit
          </button>
          <button type="button" class="btn btn-danger" @click="deleteSupplement(supplement.id!)">
            Delete
          </button>
        </div>
      </article>
    </section>

    <!-- Add/Edit Form Modal -->
    <transition name="fade">
      <div v-if="showAddForm" class="modal-overlay" @click.self="closeForm">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ isEditMode ? 'Edit Supplement' : 'Add New Supplement' }}</h3>
            <button type="button" class="close-btn" @click="closeForm">×</button>
          </div>

          <form @submit.prevent="saveSupplement" class="supplement-form">
            <div class="form-row">
              <div class="form-group">
                <label for="name">Product Name <span class="required">*</span></label>
                <input
                  id="name"
                  v-model="supplementForm.name"
                  type="text"
                  required
                  placeholder="Enter product name"
                />
              </div>

              <div class="form-group">
                <label for="brand">Brand <span class="required">*</span></label>
                <input
                  id="brand"
                  v-model="supplementForm.brand"
                  type="text"
                  required
                  placeholder="Enter brand name"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="category">Category <span class="required">*</span></label>
                <select id="category" v-model="supplementForm.category" required>
                  <option value="">Select category</option>
                  <option v-for="cat in categories" :key="cat" :value="cat">
                    {{ cat }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="price">Price (₹) <span class="required">*</span></label>
                <input
                  id="price"
                  v-model.number="supplementForm.price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="Enter price"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="stock">Stock Quantity <span class="required">*</span></label>
                <input
                  id="stock"
                  v-model.number="supplementForm.stock"
                  type="number"
                  min="0"
                  required
                  placeholder="Enter stock quantity"
                />
              </div>

              <div class="form-group">
                <label for="barcode">Barcode</label>
                <input
                  id="barcode"
                  v-model="supplementForm.barcode"
                  type="text"
                  placeholder="Enter barcode (optional)"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="expiryDate">Expiry Date</label>
              <input
                id="expiryDate"
                v-model="supplementForm.expiryDate"
                type="date"
                placeholder="Select expiry date (optional)"
              />
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea
                id="description"
                v-model="supplementForm.description"
                rows="3"
                placeholder="Enter product description (optional)"
              ></textarea>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="closeForm">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                {{ isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Add' }} Supplement
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.supplement-store-page {
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

.supplements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.supplement-card {
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

.supplement-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.product-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
}

.product-brand {
  margin: 4px 0 0;
  font-size: 14px;
  color: #64748b;
}

.stock-badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.stock-badge.in {
  background: #dcfce7;
  color: #166534;
}

.stock-badge.low {
  background: #fef3c7;
  color: #b45309;
}

.stock-badge.out {
  background: #fee2e2;
  color: #b91c1c;
}

.card-body {
  flex: 1;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.info-item.description {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
  flex-direction: column;
  gap: 4px;
}

.info-item .label {
  color: #64748b;
  font-weight: 500;
}

.info-item .value {
  color: #0f172a;
  font-weight: 500;
}

.info-item .value.price {
  color: #2563eb;
  font-weight: 700;
  font-size: 16px;
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
  max-width: 600px;
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

.supplement-form {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  .supplement-store-page {
    padding: 16px;
  }

  .supplements-grid {
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
}
</style>
