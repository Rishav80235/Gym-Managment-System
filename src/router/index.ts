import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import MemberLayout from '../layouts/MemberLayout.vue'
import UserLayout from '../layouts/UserLayout.vue'
import AddMember from '../views/AddMember.vue'
import ManageMembers from '../views/ManageMembers.vue'
import CreateBills from '../views/CreateBills.vue'
import AssignFeePackage from '../views/AssignFeePackage.vue'
import MonthlyNotifications from '../views/MonthlyNotifications.vue'
import ReportExport from '../views/ReportExport.vue'
import SupplementStore from '../views/SupplementStore.vue'
import DietDetails from '../views/DietDetails.vue'
import PendingRegistrations from '../views/PendingRegistrations.vue'
import MemberDashboard from '../views/MemberDashboard.vue'
import MemberBillReceipts from '../views/MemberBillReceipts.vue'
import MemberBillNotifications from '../views/MemberBillNotifications.vue'
import ProfileSettings from '../views/ProfileSettings.vue'
import EditProfile from '../views/EditProfile.vue'
import UpgradePackage from '../views/UpgradePackage.vue'
import UserHome from '../views/UserHome.vue'
import UserDetails from '../views/UserDetails.vue'
import UserSearchRecords from '../views/UserSearchRecords.vue'
import Login from '../views/Login.vue'
import Signup from '../views/Signup.vue'
import type { AccountRole } from '../firebase/services'
import { getSession } from '../utils/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: Login, meta: { allowAnonymous: true } },
    { path: '/signup', name: 'signup', component: Signup, meta: { allowAnonymous: true } },
    {
      path: '/',
      component: AdminLayout,
      meta: { requiresAuth: true, roles: ['admin'] as AccountRole[] },
      children: [
        { path: '', redirect: { name: 'add-member' } },
        {
          path: 'add-member',
          name: 'add-member',
          component: AddMember,
          meta: { requiresAuth: true },
        },
        {
          path: 'manage-members',
          name: 'manage-members',
          component: ManageMembers,
          meta: { requiresAuth: true },
        },
        {
          path: 'create-bills',
          name: 'create-bills',
          component: CreateBills,
          meta: { requiresAuth: true },
        },
        {
          path: 'assign-fee',
          name: 'assign-fee',
          component: AssignFeePackage,
          meta: { requiresAuth: true },
        },
        {
          path: 'monthly-notifications',
          name: 'monthly-notifications',
          component: MonthlyNotifications,
          meta: { requiresAuth: true },
        },
        {
          path: 'report-export',
          name: 'report-export',
          component: ReportExport,
          meta: { requiresAuth: true },
        },
        {
          path: 'supplement-store',
          name: 'supplement-store',
          component: SupplementStore,
          meta: { requiresAuth: true },
        },
        {
          path: 'diet-details',
          name: 'diet-details',
          component: DietDetails,
          meta: { requiresAuth: true },
        },
        {
          path: 'pending-registrations',
          name: 'pending-registrations',
          component: PendingRegistrations,
          meta: { requiresAuth: true },
        },
        {
          path: 'profile',
          name: 'admin-profile',
          component: ProfileSettings,
          meta: { requiresAuth: true },
        },
        {
          path: 'profile/edit',
          name: 'admin-edit-profile',
          component: EditProfile,
          meta: { requiresAuth: true },
        },
        {
          path: 'profile/upgrade',
          name: 'admin-upgrade-package',
          component: UpgradePackage,
          meta: { requiresAuth: true },
        },
      ],
    },
    {
      path: '/member',
      component: MemberLayout,
      meta: { requiresAuth: true, roles: ['member'] as AccountRole[] },
      children: [
        {
          path: '',
          name: 'member-dashboard',
          component: MemberDashboard,
          meta: { requiresAuth: true },
        },
        {
          path: 'receipts',
          name: 'view-bill-receipts',
          component: MemberBillReceipts,
          meta: { requiresAuth: true },
        },
        {
          path: 'notifications',
          name: 'view-bill-notifications',
          component: MemberBillNotifications,
          meta: { requiresAuth: true },
        },
        {
          path: 'profile',
          name: 'member-profile',
          component: ProfileSettings,
          meta: { requiresAuth: true },
        },
        {
          path: 'profile/edit',
          name: 'member-edit-profile',
          component: EditProfile,
          meta: { requiresAuth: true },
        },
        {
          path: 'profile/upgrade',
          name: 'member-upgrade-package',
          component: UpgradePackage,
          meta: { requiresAuth: true },
        },
      ],
    },
    {
      path: '/user',
      component: UserLayout,
      meta: { requiresAuth: true, roles: ['user'] as AccountRole[] },
      children: [
        { path: '', name: 'user-home', component: UserHome, meta: { requiresAuth: true } },
        {
          path: 'details',
          name: 'user-details',
          component: UserDetails,
          meta: { requiresAuth: true },
        },
        {
          path: 'search',
          name: 'user-search-records',
          component: UserSearchRecords,
          meta: { requiresAuth: true },
        },
      ],
    },
  ],
})

const defaultRouteByRole: Record<AccountRole, string> = {
  admin: 'add-member',
  member: 'member-dashboard',
  user: 'user-home',
}

router.beforeEach((to, from, next) => {
  const session = getSession()
  const isPublic = Boolean(to.meta.allowAnonymous)

  if (!session && !isPublic) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  if (session && to.name && (to.name === 'login' || to.name === 'signup')) {
    return next({ name: defaultRouteByRole[session.role] })
  }

  const requiredRoles = (to.meta.roles as AccountRole[] | undefined) ?? []
  if (requiredRoles.length && session) {
    if (session.role === 'admin') {
      return next()
    }
    if (!requiredRoles.includes(session.role)) {
      return next({ name: defaultRouteByRole[session.role] })
    }
  }

  if (to.meta.requiresAuth && !session) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  return next()
})

export default router
