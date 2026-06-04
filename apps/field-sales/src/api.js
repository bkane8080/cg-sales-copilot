import axios from 'axios'

const api = axios.create({ baseURL: '' })

export const REP_ID = 1

export const getStores = () => api.get('/api/stores', { params: { rep_id: REP_ID } })
export const getStore = (id) => api.get(`/api/stores/${id}`)
export const getStoreKPIs = (id) => api.get(`/api/stores/${id}/kpis`)
export const getStorePerformance = (id) => api.get(`/api/stores/${id}/performance`)
export const getVisits = () => api.get('/api/visits', { params: { rep_id: REP_ID } })
export const getProducts = () => api.get('/api/products')
export const auditVisit = (id, score) => api.post(`/api/visits/${id}/audit`, { compliance_score: score })
export const chatWithAgent = (message, storeId) => api.post('/api/agent/interact', { message, store_id: storeId })
export const createVisit = (data) => api.post('/api/visits', data)
export const resetDemo = () => api.post('/api/demo/reset', { rep_id: REP_ID })

export default api
