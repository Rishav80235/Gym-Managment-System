import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: 'AIzaSyDCtfQZtA_I6KJXGPAdEAdC0_XPdmWqcyM',
  authDomain: 'gym-management-system-ap-6.firebaseapp.com',
  databaseURL:
    'https://gym-management-system-ap-6-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'gym-management-system-ap-6',
  storageBucket: 'gym-management-system-ap-6.firebasestorage.app',
  messagingSenderId: '386046957475',
  appId: '1:386046957475:web:9fd898c4686e805dd02c16',
  measurementId: 'G-519P18JEQQ',
}

export const firebaseApp = initializeApp(firebaseConfig)

export const analyticsPromise =
  typeof window !== 'undefined'
    ? isSupported().then((supported) => (supported ? getAnalytics(firebaseApp) : null))
    : Promise.resolve(null)
