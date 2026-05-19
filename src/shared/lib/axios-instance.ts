import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('aurora_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('aurora_access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
