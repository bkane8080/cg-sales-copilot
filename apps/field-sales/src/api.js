import axios from 'axios'

const api = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: { 'X-Requested-With': 'XMLHttpRequest' }
})

export const REP_ID = 1

export const getStores = () => api.get('/api/stores', { params: { rep_id: REP_ID } })
export const getStore = (id) => api.get(`/api/stores/${id}`)
export const getStoreKPIs = (id) => api.get(`/api/stores/${id}/kpis`)
export const getStorePerformance = (id) => api.get(`/api/stores/${id}/performance`)
export const getStoreAudits = (id) => api.get(`/api/stores/${id}/audits`)
export const getStoreCases = (id) => api.get(`/api/stores/${id}/cases`)
export const getStoreVisits = (id) => api.get(`/api/stores/${id}/visits`)
export const getStorePlanogram = (id) => api.get(`/api/stores/${id}/planogram`)
export const getStoreAssortment = (id) => api.get(`/api/stores/${id}/assortment`)
export const getLastMerchandising = (id) => api.get(`/api/stores/${id}/last-merchandising`)
export const getStorePromoCalendar = (id) => api.get(`/api/stores/${id}/promo-calendar`)
export const getPromoSuggestions = (id) => api.get(`/api/stores/${id}/promo-suggestions`)
export const prepareVisit = (id) => api.get(`/api/stores/${id}/prepare`)
export const getRetailerNews = (name) => api.get(`/api/retailer/${encodeURIComponent(name)}/news`)
export const getVisits = () => api.get('/api/visits', { params: { rep_id: REP_ID } })
export const getProducts = () => api.get('/api/products')
export const getCatalog = (type) => api.get('/api/catalog', { params: type ? { type } : {} })
export const getPromotions = () => api.get('/api/promotions')
export const getQuotas = () => api.get(`/api/rep/${REP_ID}/quotas`)
export const auditVisit = (id, score) => api.post(`/api/visits/${id}/audit`, { compliance_score: score })
export const submitMerchandising = (visitId, storeId, items) => api.post(`/api/visits/${visitId}/merchandising`, { store_id: storeId, items })
export const uploadVisitPhoto = (visitId, data) => api.post(`/api/visits/${visitId}/photos`, data)
export const completeVisit = (visitId, data) => api.post(`/api/visits/${visitId}/complete`, data)
export const generateVisitReport = (data) => api.post('/api/visits/generate-report', data)
export const chatWithAgent = (message, storeId) => api.post('/api/agent/interact', { message, store_id: storeId })
export const chatWithFieldAgent = (message, storeId, history) => api.post('/api/agent/chat', { message, store_id: storeId, history })
export const sendManagerEmail = (data) => api.post('/api/agent/send-email', data)
export const createVisit = (data) => api.post('/api/visits', data)
export const resetDemo = () => api.post('/api/demo/reset', { rep_id: REP_ID })
export const getSpeechToken = () => api.get('/api/agent/speech-token')
export const speechToText = (audio) => api.post('/api/agent/speech-to-text', { audio })
export const textToSpeech = (text) => api.post('/api/agent/text-to-speech', { text })
export const getRepProfile = () => api.get(`/api/rep/${REP_ID}`)
export const getRepKPIs = () => api.get(`/api/rep/${REP_ID}/kpis`)
export const getRepVisitsMonth = () => api.get(`/api/rep/${REP_ID}/visits-month`)
export const updateHomeAddress = (address) => api.put(`/api/rep/${REP_ID}/home-address`, { home_address: address })
export const optimizeRoute = (waypoints, home) => api.post('/api/route/optimize', { waypoints, home })

export default api
