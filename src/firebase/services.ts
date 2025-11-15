import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  where,
  limit,
} from 'firebase/firestore'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { firebaseApp } from './index'

// Initialize Firestore
export const db = getFirestore(firebaseApp)

// Initialize Storage
export const storage = getStorage(firebaseApp)

// Account interface and service
export type AccountRole = 'admin' | 'member' | 'user'

export interface Account {
  id?: string
  accountId: string
  firstName: string
  lastName: string
  email: string
  normalizedEmail: string
  password: string
  role: AccountRole
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

const ACCOUNT_PREFIX: Record<AccountRole, string> = {
  admin: 'ADM',
  member: 'MEM',
  user: 'USR',
}

export const accountService = {
  generateAccountId(role: AccountRole): string {
    const prefix = ACCOUNT_PREFIX[role] ?? 'USR'
    const random = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0')
    return `${prefix}-${random}`
  },

  async getAccountByEmail(email: string): Promise<Account | null> {
    const normalizedEmail = email.trim().toLowerCase()
    const accountsRef = collection(db, 'accounts')
    const q = query(accountsRef, where('normalizedEmail', '==', normalizedEmail), limit(1))
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    const docSnap = snapshot.docs[0]
    if (!docSnap) return null
    const data = docSnap.data() as Account
    return { id: docSnap.id, ...data }
  },

  async emailExists(email: string): Promise<boolean> {
    const existing = await this.getAccountByEmail(email)
    return Boolean(existing)
  },

  async createAccount(
    payload: Omit<Account, 'id' | 'accountId' | 'normalizedEmail' | 'createdAt'>,
  ): Promise<{ id: string; accountId: string }> {
    const normalizedEmail = payload.email.trim().toLowerCase()
    if (await this.emailExists(normalizedEmail)) {
      throw new Error('An account with this email already exists.')
    }

    const accountId = this.generateAccountId(payload.role)
    const docRef = await addDoc(collection(db, 'accounts'), {
      ...payload,
      email: normalizedEmail,
      normalizedEmail,
      accountId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return { id: docRef.id, accountId }
  },

  async verifyCredentials(
    email: string,
    password: string,
  ): Promise<(Account & { id: string }) | null> {
    const account = await this.getAccountByEmail(email)
    if (!account) return null
    if (account.password !== password) return null
    return account as Account & { id: string }
  },

  async updateAccount(
    id: string,
    updates: Partial<Omit<Account, 'id' | 'accountId' | 'createdAt' | 'normalizedEmail'>>,
  ): Promise<void> {
    const payload: Partial<Account> & { updatedAt: Timestamp } = {
      updatedAt: Timestamp.now(),
    }

    if (updates.firstName !== undefined) payload.firstName = updates.firstName
    if (updates.lastName !== undefined) payload.lastName = updates.lastName

    if (updates.password !== undefined && updates.password !== '') {
      payload.password = updates.password
    }

    if (updates.role !== undefined) {
      payload.role = updates.role
    }

    if (updates.email !== undefined) {
      const normalizedEmail = updates.email.trim().toLowerCase()
      const accountsRef = collection(db, 'accounts')
      const q = query(accountsRef, where('normalizedEmail', '==', normalizedEmail), limit(1))
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        const existingDoc = snapshot.docs[0]
        if (existingDoc && existingDoc.id !== id) {
          throw new Error('An account with this email already exists.')
        }
      }
      payload.email = normalizedEmail
      payload.normalizedEmail = normalizedEmail
    }

    const accountRef = doc(db, 'accounts', id)
    await updateDoc(accountRef, payload)
  },
}

// Member interface
export interface Member {
  id?: string
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
  photoUrl?: string
  status: 'Active' | 'Inactive' | 'Expired'
  dues: number
  lastCheckIn?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

// Member Service
export const memberService = {
  // Add a new member
  async addMember(memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const memberWithTimestamp = {
        ...memberData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
      const docRef = await addDoc(collection(db, 'members'), memberWithTimestamp)
      return docRef.id
    } catch (error) {
      console.error('Error adding member:', error)
      throw error
    }
  },

  // Get all members
  async getAllMembers(): Promise<Member[]> {
    try {
      const q = query(collection(db, 'members'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const members: Member[] = []
      querySnapshot.forEach((doc) => {
        members.push({
          id: doc.id,
          ...doc.data(),
        } as Member)
      })
      return members
    } catch (error) {
      console.error('Error getting members:', error)
      throw error
    }
  },

  // Get a single member by ID
  async getMemberById(id: string): Promise<Member | null> {
    try {
      const q = query(collection(db, 'members'))
      const querySnapshot = await getDocs(q)
      const memberDoc = querySnapshot.docs.find((doc) => doc.id === id)
      if (memberDoc) {
        return {
          id: memberDoc.id,
          ...memberDoc.data(),
        } as Member
      }
      return null
    } catch (error) {
      console.error('Error getting member:', error)
      throw error
    }
  },

  // Update a member
  async updateMember(id: string, memberData: Partial<Member>): Promise<void> {
    try {
      const memberRef = doc(db, 'members', id)
      await updateDoc(memberRef, {
        ...memberData,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error('Error updating member:', error)
      throw error
    }
  },

  // Delete a member
  async deleteMember(id: string): Promise<void> {
    try {
      const memberRef = doc(db, 'members', id)
      await deleteDoc(memberRef)
    } catch (error) {
      console.error('Error deleting member:', error)
      throw error
    }
  },

  // Upload member photo
  async uploadPhoto(file: File, memberId: string): Promise<string> {
    try {
      const fileRef = storageRef(storage, `members/${memberId}/${file.name}`)
      await uploadBytes(fileRef, file)
      const downloadURL = await getDownloadURL(fileRef)
      return downloadURL
    } catch (error) {
      console.error('Error uploading photo:', error)
      throw error
    }
  },

  // Calculate membership status based on end date
  calculateStatus(endDate: string): 'Active' | 'Inactive' | 'Expired' {
    const today = new Date()
    const end = new Date(endDate)
    if (end < today) {
      return 'Expired'
    }
    return 'Active'
  },
}

// Bill interface
export interface Bill {
  id?: string
  memberId: string
  memberName: string
  billNumber: string
  amount: number
  description: string
  dueDate: string
  status: 'Pending' | 'Paid' | 'Overdue'
  paymentDate?: string
  paymentMethod?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

// Bill Service
export const billService = {
  // Create a new bill
  async createBill(
    billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
  ): Promise<string> {
    try {
      const dueDate = new Date(billData.dueDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      dueDate.setHours(0, 0, 0, 0)

      const status: 'Pending' | 'Paid' | 'Overdue' = dueDate < today ? 'Overdue' : 'Pending'

      const billWithTimestamp = {
        ...billData,
        status,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
      const docRef = await addDoc(collection(db, 'bills'), billWithTimestamp)

      // Update member dues
      const member = await memberService.getMemberById(billData.memberId)
      if (member) {
        const currentDues = member.dues || 0
        await memberService.updateMember(billData.memberId, {
          dues: currentDues + billData.amount,
        })
      }

      return docRef.id
    } catch (error) {
      console.error('Error creating bill:', error)
      throw error
    }
  },

  // Get all bills
  async getAllBills(): Promise<Bill[]> {
    try {
      const q = query(collection(db, 'bills'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const bills: Bill[] = []
      querySnapshot.forEach((doc) => {
        bills.push({
          id: doc.id,
          ...doc.data(),
        } as Bill)
      })
      return bills
    } catch (error) {
      console.error('Error getting bills:', error)
      throw error
    }
  },

  // Get bills by member ID
  async getBillsByMemberId(memberId: string): Promise<Bill[]> {
    try {
      const allBills = await this.getAllBills()
      return allBills.filter((bill) => bill.memberId === memberId)
    } catch (error) {
      console.error('Error getting member bills:', error)
      throw error
    }
  },

  // Update bill status to Paid
  async markBillAsPaid(billId: string, paymentMethod: string = 'Cash'): Promise<void> {
    try {
      const billRef = doc(db, 'bills', billId)
      const bill = await getDocs(query(collection(db, 'bills')))
      const billDoc = bill.docs.find((d) => d.id === billId)

      if (billDoc) {
        const billData = billDoc.data() as Bill
        await updateDoc(billRef, {
          status: 'Paid',
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod,
          updatedAt: Timestamp.now(),
        })

        // Update member dues
        const member = await memberService.getMemberById(billData.memberId)
        if (member) {
          const currentDues = Math.max(0, (member.dues || 0) - billData.amount)
          await memberService.updateMember(billData.memberId, {
            dues: currentDues,
          })
        }
      }
    } catch (error) {
      console.error('Error marking bill as paid:', error)
      throw error
    }
  },

  // Delete a bill
  async deleteBill(billId: string): Promise<void> {
    try {
      const billRef = doc(db, 'bills', billId)
      const bill = await getDocs(query(collection(db, 'bills')))
      const billDoc = bill.docs.find((d) => d.id === billId)

      if (billDoc) {
        const billData = billDoc.data() as Bill
        await deleteDoc(billRef)

        // Update member dues if bill was unpaid
        if (billData.status !== 'Paid') {
          const member = await memberService.getMemberById(billData.memberId)
          if (member) {
            const currentDues = Math.max(0, (member.dues || 0) - billData.amount)
            await memberService.updateMember(billData.memberId, {
              dues: currentDues,
            })
          }
        }
      }
    } catch (error) {
      console.error('Error deleting bill:', error)
      throw error
    }
  },

  // Generate bill number
  generateBillNumber(): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')
    return `BILL-${year}${month}${day}-${random}`
  },
}

// Fee Package interface
export interface FeePackage {
  id?: string
  memberId: string
  memberName: string
  packageType: 'basic' | 'premium' | 'gold' | 'platinum'
  packageName: string
  amount: number
  duration: number // in months
  startDate: string
  endDate: string
  status: 'Active' | 'Expired' | 'Cancelled'
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

// Fee Package Service
export const feePackageService = {
  // Package configurations
  packageConfigs: {
    basic: { name: 'Basic (Monthly)', duration: 1, defaultAmount: 1000 },
    premium: { name: 'Premium (3 Months)', duration: 3, defaultAmount: 2700 },
    gold: { name: 'Gold (6 Months)', duration: 6, defaultAmount: 5000 },
    platinum: { name: 'Platinum (Yearly)', duration: 12, defaultAmount: 9000 },
  },

  // Calculate end date based on start date and duration
  calculateEndDate(startDate: string, duration: number): string {
    const start = new Date(startDate)
    const end = new Date(start)
    end.setMonth(end.getMonth() + duration)
    const dateString = end.toISOString().split('T')[0]
    return dateString || startDate
  },

  // Assign fee package to member
  async assignPackage(
    packageData: Omit<FeePackage, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'endDate'>,
  ): Promise<string> {
    try {
      const endDate = this.calculateEndDate(packageData.startDate, packageData.duration)
      const today = new Date()
      const end = new Date(endDate)
      today.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)

      const status: 'Active' | 'Expired' | 'Cancelled' = end < today ? 'Expired' : 'Active'

      const packageWithTimestamp = {
        ...packageData,
        endDate,
        status,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      const docRef = await addDoc(collection(db, 'feePackages'), packageWithTimestamp)

      // Update member membership type and dates
      await memberService.updateMember(packageData.memberId, {
        membershipType: packageData.packageType,
        startDate: packageData.startDate,
        endDate,
        status: memberService.calculateStatus(endDate),
      })

      return docRef.id
    } catch (error) {
      console.error('Error assigning fee package:', error)
      throw error
    }
  },

  // Get all fee packages
  async getAllPackages(): Promise<FeePackage[]> {
    try {
      const q = query(collection(db, 'feePackages'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const packages: FeePackage[] = []
      querySnapshot.forEach((doc) => {
        packages.push({
          id: doc.id,
          ...doc.data(),
        } as FeePackage)
      })
      return packages
    } catch (error) {
      console.error('Error getting fee packages:', error)
      throw error
    }
  },

  // Get packages by member ID
  async getPackagesByMemberId(memberId: string): Promise<FeePackage[]> {
    try {
      const allPackages = await this.getAllPackages()
      return allPackages.filter((pkg) => pkg.memberId === memberId)
    } catch (error) {
      console.error('Error getting member packages:', error)
      throw error
    }
  },

  // Update fee package
  async updatePackage(id: string, packageData: Partial<FeePackage>): Promise<void> {
    try {
      const packageRef = doc(db, 'feePackages', id)
      const updateData: Partial<FeePackage> & { updatedAt: Timestamp } = {
        ...packageData,
        updatedAt: Timestamp.now(),
      }

      // Recalculate end date if start date or duration changed
      if (packageData.startDate || packageData.duration) {
        const currentPackage = await getDocs(query(collection(db, 'feePackages')))
        const pkgDoc = currentPackage.docs.find((d) => d.id === id)
        if (pkgDoc) {
          const pkg = pkgDoc.data() as FeePackage
          const startDate = packageData.startDate || pkg.startDate
          const duration = packageData.duration || pkg.duration
          updateData.endDate = this.calculateEndDate(startDate, duration)
          updateData.status = new Date(updateData.endDate) < new Date() ? 'Expired' : 'Active'
        }
      }

      await updateDoc(packageRef, updateData)

      // Update member if package is active
      if (updateData.status === 'Active' && packageData.memberId && updateData.endDate) {
        await memberService.updateMember(packageData.memberId, {
          membershipType: packageData.packageType || undefined,
          startDate: updateData.startDate || undefined,
          endDate: updateData.endDate,
          status: memberService.calculateStatus(updateData.endDate),
        })
      }
    } catch (error) {
      console.error('Error updating fee package:', error)
      throw error
    }
  },

  // Delete fee package
  async deletePackage(id: string): Promise<void> {
    try {
      const packageRef = doc(db, 'feePackages', id)
      await deleteDoc(packageRef)
    } catch (error) {
      console.error('Error deleting fee package:', error)
      throw error
    }
  },
}

// Notification interface
export interface Notification {
  id?: string
  title: string
  message: string
  type: 'Payment Reminder' | 'Membership Expiry' | 'General' | 'Custom'
  targetType: 'All Members' | 'Specific Member' | 'Active Members' | 'Expired Members'
  memberId?: string
  memberName?: string
  scheduledDate: string
  sendTime: string
  isRecurring: boolean
  recurrenceType?: 'Monthly' | 'Weekly' | 'Daily'
  status: 'Scheduled' | 'Sent' | 'Cancelled'
  sentAt?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

// Notification Service
export const notificationService = {
  // Create a notification
  async createNotification(
    notificationData: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'sentAt'>,
  ): Promise<string> {
    try {
      const notificationWithTimestamp = {
        ...notificationData,
        status: 'Scheduled' as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
      const docRef = await addDoc(collection(db, 'notifications'), notificationWithTimestamp)
      return docRef.id
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  },

  // Get all notifications
  async getAllNotifications(): Promise<Notification[]> {
    try {
      const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const notifications: Notification[] = []
      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
        } as Notification)
      })
      return notifications
    } catch (error) {
      console.error('Error getting notifications:', error)
      throw error
    }
  },

  // Get notifications by member ID
  async getNotificationsByMemberId(memberId: string): Promise<Notification[]> {
    try {
      const allNotifications = await this.getAllNotifications()
      return allNotifications.filter(
        (notif) => notif.memberId === memberId || notif.targetType === 'All Members',
      )
    } catch (error) {
      console.error('Error getting member notifications:', error)
      throw error
    }
  },

  // Update notification
  async updateNotification(id: string, notificationData: Partial<Notification>): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', id)
      await updateDoc(notificationRef, {
        ...notificationData,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error('Error updating notification:', error)
      throw error
    }
  },

  // Mark notification as sent
  async markAsSent(id: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', id)
      await updateDoc(notificationRef, {
        status: 'Sent',
        sentAt: new Date().toISOString(),
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error('Error marking notification as sent:', error)
      throw error
    }
  },

  // Delete notification
  async deleteNotification(id: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', id)
      await deleteDoc(notificationRef)
    } catch (error) {
      console.error('Error deleting notification:', error)
      throw error
    }
  },

  // Get members for notification target
  async getTargetMembers(targetType: string, memberId?: string): Promise<Member[]> {
    try {
      const allMembers = await memberService.getAllMembers()
      switch (targetType) {
        case 'All Members':
          return allMembers
        case 'Active Members':
          return allMembers.filter((m) => m.status === 'Active')
        case 'Expired Members':
          return allMembers.filter((m) => m.status === 'Expired')
        case 'Specific Member':
          if (memberId) {
            const member = allMembers.find((m) => m.id === memberId)
            return member ? [member] : []
          }
          return []
        default:
          return []
      }
    } catch (error) {
      console.error('Error getting target members:', error)
      return []
    }
  },
}

// Supplement interface
export interface Supplement {
  id?: string
  name: string
  brand: string
  category: string
  description: string
  price: number
  stock: number
  imageUrl?: string
  barcode?: string
  expiryDate?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

// Supplement Order interface
export interface SupplementOrder {
  id?: string
  memberId: string
  memberName: string
  items: Array<{
    supplementId: string
    supplementName: string
    quantity: number
    price: number
  }>
  totalAmount: number
  status: 'Pending' | 'Completed' | 'Cancelled'
  orderDate: string
  paymentMethod: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

// Supplement Service
export const supplementService = {
  // Add a supplement
  async addSupplement(
    supplementData: Omit<Supplement, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    try {
      const supplementWithTimestamp = {
        ...supplementData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
      const docRef = await addDoc(collection(db, 'supplements'), supplementWithTimestamp)
      return docRef.id
    } catch (error) {
      console.error('Error adding supplement:', error)
      throw error
    }
  },

  // Get all supplements
  async getAllSupplements(): Promise<Supplement[]> {
    try {
      const q = query(collection(db, 'supplements'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const supplements: Supplement[] = []
      querySnapshot.forEach((doc) => {
        supplements.push({
          id: doc.id,
          ...doc.data(),
        } as Supplement)
      })
      return supplements
    } catch (error) {
      console.error('Error getting supplements:', error)
      throw error
    }
  },

  // Get supplement by ID
  async getSupplementById(id: string): Promise<Supplement | null> {
    try {
      const q = query(collection(db, 'supplements'))
      const querySnapshot = await getDocs(q)
      const supplementDoc = querySnapshot.docs.find((doc) => doc.id === id)
      if (supplementDoc) {
        return {
          id: supplementDoc.id,
          ...supplementDoc.data(),
        } as Supplement
      }
      return null
    } catch (error) {
      console.error('Error getting supplement:', error)
      throw error
    }
  },

  // Update supplement
  async updateSupplement(id: string, supplementData: Partial<Supplement>): Promise<void> {
    try {
      const supplementRef = doc(db, 'supplements', id)
      await updateDoc(supplementRef, {
        ...supplementData,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error('Error updating supplement:', error)
      throw error
    }
  },

  // Delete supplement
  async deleteSupplement(id: string): Promise<void> {
    try {
      const supplementRef = doc(db, 'supplements', id)
      await deleteDoc(supplementRef)
    } catch (error) {
      console.error('Error deleting supplement:', error)
      throw error
    }
  },

  // Create order
  async createOrder(
    orderData: Omit<SupplementOrder, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
  ): Promise<string> {
    try {
      // Update stock for each item
      for (const item of orderData.items) {
        const supplement = await this.getSupplementById(item.supplementId)
        if (supplement) {
          const newStock = Math.max(0, supplement.stock - item.quantity)
          await this.updateSupplement(item.supplementId, { stock: newStock })
        }
      }

      const orderWithTimestamp = {
        ...orderData,
        status: 'Completed' as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
      const docRef = await addDoc(collection(db, 'supplementOrders'), orderWithTimestamp)
      return docRef.id
    } catch (error) {
      console.error('Error creating order:', error)
      throw error
    }
  },

  // Get all orders
  async getAllOrders(): Promise<SupplementOrder[]> {
    try {
      const q = query(collection(db, 'supplementOrders'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const orders: SupplementOrder[] = []
      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data(),
        } as SupplementOrder)
      })
      return orders
    } catch (error) {
      console.error('Error getting orders:', error)
      throw error
    }
  },
}

// Diet Plan interface
export interface DietPlan {
  id?: string
  memberId: string
  memberName: string
  planName: string
  goal: 'Weight Loss' | 'Muscle Gain' | 'Maintenance' | 'Cutting' | 'Bulking'
  dailyCalories: number
  protein: number // in grams
  carbs: number // in grams
  fats: number // in grams
  meals: {
    breakfast: string
    lunch: string
    dinner: string
    snacks: string
  }
  notes: string
  startDate: string
  endDate?: string
  status: 'Active' | 'Completed' | 'Inactive'
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

// Diet Plan Service
export const dietPlanService = {
  // Create a diet plan
  async createDietPlan(
    planData: Omit<DietPlan, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
  ): Promise<string> {
    try {
      const planWithTimestamp = {
        ...planData,
        status: 'Active' as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
      const docRef = await addDoc(collection(db, 'dietPlans'), planWithTimestamp)
      return docRef.id
    } catch (error) {
      console.error('Error creating diet plan:', error)
      throw error
    }
  },

  // Get all diet plans
  async getAllDietPlans(): Promise<DietPlan[]> {
    try {
      const q = query(collection(db, 'dietPlans'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const plans: DietPlan[] = []
      querySnapshot.forEach((doc) => {
        plans.push({
          id: doc.id,
          ...doc.data(),
        } as DietPlan)
      })
      return plans
    } catch (error) {
      console.error('Error getting diet plans:', error)
      throw error
    }
  },

  // Get diet plan by member ID
  async getDietPlanByMemberId(memberId: string): Promise<DietPlan | null> {
    try {
      const allPlans = await this.getAllDietPlans()
      const activePlan = allPlans.find((p) => p.memberId === memberId && p.status === 'Active')
      return activePlan || null
    } catch (error) {
      console.error('Error getting member diet plan:', error)
      throw error
    }
  },

  // Update diet plan
  async updateDietPlan(id: string, planData: Partial<DietPlan>): Promise<void> {
    try {
      const planRef = doc(db, 'dietPlans', id)
      await updateDoc(planRef, {
        ...planData,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error('Error updating diet plan:', error)
      throw error
    }
  },

  // Delete diet plan
  async deleteDietPlan(id: string): Promise<void> {
    try {
      const planRef = doc(db, 'dietPlans', id)
      await deleteDoc(planRef)
    } catch (error) {
      console.error('Error deleting diet plan:', error)
      throw error
    }
  },
}
