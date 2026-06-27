import axios from 'axios'

const http = axios.create({ baseURL: '/api' })

export const api = {
  getRoutes: () => http.get('/routes').then((r) => r.data),

  createRoute: (route) => http.post('/routes', route).then((r) => r.data),

  startJourney: (config) => http.post('/journey/start', config).then((r) => r.data),

  stopJourney: () => http.post('/journey/stop').then((r) => r.data),

  updateConfig: (config) => http.put('/journey/config', config).then((r) => r.data),

  getState: () => http.get('/journey/state').then((r) => r.data),

  getLogs: () => http.get('/journey/logs').then((r) => r.data),
}
