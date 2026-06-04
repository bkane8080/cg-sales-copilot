import axios from 'axios'

const api = axios.create({ baseURL: '' })

export const getStores = () => api.get('/api/stores')
export const getStore = (id) => api.get(`/api/stores/${id}`)
export const getStoreKPIs = (id) => api.get(`/api/stores/${id}/kpis`)
export const getStorePerformance = (id) => api.get(`/api/stores/${id}/performance`)
export const getVisits = (repId) => api.get('/api/visits', { params: { rep_id: repId } })
export const getReps = () => api.get('/api/reps')
export const getProducts = () => api.get('/api/products')
export const addUrgentVisit = (data) => api.post('/api/visits/urgent', data)
export const auditVisit = (id, score) => api.post(`/api/visits/${id}/audit`, { compliance_score: score })
export const chatWithAgent = (message, storeId) => api.post('/api/agent/interact', { message, store_id: storeId })
export const getCrossRetailerAnalytics = () => api.get('/api/analytics/cross-retailer')
export const getNPDTracker = () => api.get('/api/analytics/npd-tracker')
export const simulatePromo = (data) => api.post('/api/analytics/promo-simulator', data)
export const generatePPT = () => api.post('/api/reports/generate-ppt', {}, { responseType: 'blob' })

export default api
