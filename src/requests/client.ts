import axios from 'axios'

enum ResponseCode {
  SESSION_EXPIRED = 61,
  INVALID_PERMISSION = 62,
  VALIDATION_FAILED = 51,
  SUCCESS = 0
}

export interface Response<T> {
  data: T
  code: ResponseCode
  message: string
  redirect: string
  requestId: string
}

const request = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 60000
})

const analyticsRequest = axios.create({
  baseURL: import.meta.env.VITE_ANALYTICS_API_URL,
  timeout: 60000
})

request.interceptors.request.use(
  (requestConfig) => {
    const token = localStorage.getItem('merchantToken')
    requestConfig.headers.Authorization = token
    return requestConfig
  },
  (error) => {
    return Promise.reject(error)
  }
)

analyticsRequest.interceptors.request.use(
  (requestConfig) => {
    const token = localStorage.getItem('merchantToken')
    requestConfig.headers.Authorization = token
    return requestConfig
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (responseConfig) => {
    const { data } = responseConfig

    // If the Content-Type is not application/json, we don't need to check the response
    if (typeof data === 'string') {
      return responseConfig
    }

    if (data.code === ResponseCode.VALIDATION_FAILED) {
      return Promise.reject(new Error(responseConfig.data.message))
    }

    if (
      data.code !== ResponseCode.SUCCESS &&
      data.code !== ResponseCode.SESSION_EXPIRED &&
      data.code !== ResponseCode.INVALID_PERMISSION
    ) {
      return Promise.reject(new Error(responseConfig.data.message))
    }

    if (data.code === ResponseCode.INVALID_PERMISSION) {
      window.redirectToLogin = true
    }
    return responseConfig
  },
  (error) => {
    return Promise.reject(error)
  }
)

analyticsRequest.interceptors.response.use(
  (responseConfig) => {
    const { data } = responseConfig

    // If the Content-Type is not application/json, we don't need to check the response
    if (typeof data === 'string') {
      return responseConfig
    }

    if (
      data.code !== ResponseCode.SUCCESS &&
      data.code !== ResponseCode.SESSION_EXPIRED &&
      data.code !== ResponseCode.INVALID_PERMISSION
    ) {
      return Promise.reject(new Error(responseConfig.data.message))
    }

    if (data.code === ResponseCode.INVALID_PERMISSION) {
      window.redirectToLogin = true
    }
    return responseConfig
  },
  (error) => {
    return Promise.reject(error)
  }
)

export { analyticsRequest, request }
