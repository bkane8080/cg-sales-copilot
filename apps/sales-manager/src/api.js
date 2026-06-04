import axios from 'axios'
const api = axios.create({ baseURL: '' })
export const getStores = () => api.get('/api/stores')
export const getReps = () => api.get('/api/reps')
export const getVisits = (repId) => api.get('/api/visits', { params: repId ? { rep_id: repId } : {} })
export const getNPDTracker = () => api.get('/api/analytics/npd-tracker')
export const generatePPT = () => api.post('/api/reports/generate-ppt', {}, { responseType: 'blob' })
export const addUrgentVisit = (data) => api.post('/api/visits/urgent', data)
export default api
