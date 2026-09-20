import axios from 'axios'

// In dev, Vite proxies /api/* to the Node backend (see vite.config.js).
// In production, set VITE_API_BASE_URL to your deployed backend origin.
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({ baseURL })

// Attach the signed-in user's JWT to every request.
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('meridian_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// A 401 means the session is invalid or expired — force back to login.
// A 403 means the user is authenticated but not permitted to see the
// resource (e.g. a case they are not assigned to) — that is a normal,
// expected outcome and is left for calling code to handle (it drives
// the "locked" UI), not treated as a fatal auth error.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('meridian_token')
      sessionStorage.removeItem('meridian_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
