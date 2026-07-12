import axios from 'axios'

const BASE_URL = 'https://tailoring-management-apwh.onrender.com'

// ── Admin API — always uses adminToken ──────────────────────
export const adminAPI = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

adminAPI.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('adminToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Employee API — always uses employeeToken ─────────────────
export const employeeAPI = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

employeeAPI.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('employeeToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Customer API — always uses customerToken ─────────────────
// In lib/api.js — verify customerAPI exists:
export const customerAPI = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://tailoring-management-apwh.onrender.com',
  headers: { 'Content-Type': 'application/json' },
})

customerAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('customerToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
// ── Default export for backward compatibility ────────────────
// Only used by pages that haven't been updated yet
const API = adminAPI
export default API