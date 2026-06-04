import axios from 'axios'
const api = axios.create({ baseURL: '' })
export const getCrossRetailerAnalytics = () => api.get('/api/analytics/cross-retailer')
export const simulatePromo = (data) => api.post('/api/analytics/promo-simulator', data)
export const getProducts = () => api.get('/api/products')
export default api
