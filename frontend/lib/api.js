import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ||
  'https://tailoring-management-apwh.onrender.com'

// ── Admin API ─────────────────────────────────────────────────
export const adminAPI = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type':'application/json' },
})

adminAPI.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('adminToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Employee API ──────────────────────────────────────────────
export const employeeAPI = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type':'application/json' },
})

employeeAPI.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('employeeToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Customer API ──────────────────────────────────────────────
export const customerAPI = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type':'application/json' },
})

customerAPI.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('customerToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default adminAPI