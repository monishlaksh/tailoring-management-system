import axios from 'axios'

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  withCredentials: true,
})

API.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const adminToken    = localStorage.getItem('adminToken')
    const customerToken = localStorage.getItem('customerToken')
    const token = adminToken || customerToken
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default API