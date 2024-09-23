import axios from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 60000
})

request.interceptors.request.use(
  (requestConfig) => {
    const token = localStorage.getItem('merchantToken')
    requestConfig.headers.Authorization = token // to be declared as: `Bearer ${token}`;
    return requestConfig
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (responseConfig) => {
    if (
      responseConfig.data.code !== 0 &&
      responseConfig.data.code !== 61 &&
      responseConfig.data.code !== 62
    ) {
      return Promise.reject(new Error(responseConfig.data.message))
    }
    if (responseConfig.data.code === 62) {
      window.redirectToLogin = true
    }
    return responseConfig
  },
  (error) => {
    return Promise.reject(error)
  }
)

export { request }
