import axios from 'axios'

const api = axios.create({ baseURL: '' })

export const getStores = () => api.get('/api/stores')
export const getStore = (id) => api.get(`/api/stores/${id}`)
export const getStoreKPIs = (id) => api.get(`/api/stores/${id}/kpis`)
export const getStorePerformance = (id) => api.get(`/api/stores/${id}/performance`)
export const getVisits = (repId) => api.get('/api/visits', { params: { rep_id: repId } })
export const getProducts = () => api.get('/api/products')
export const auditVisit = (id, score) => api.post(`/api/visits/${id}/audit`, { compliance_score: score })
export const chatWithAgent = (message, storeId) => api.post('/api/agent/interact', { message, store_id: storeId })
export const createVisit = (data) => api.post('/api/visits', data)

export default api
