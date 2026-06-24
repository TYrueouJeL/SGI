import { createTuyau } from '@tuyau/core/client'
import { registry } from '@api-starter-kit/backend/registry'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const authToken = useCookie('auth_token')

  const api = createTuyau({
    baseUrl: config.public.apiUrl || 'http://localhost:3333',
    registry,
    hooks: {
      beforeRequest: [
        (request) => {
          if (authToken.value) {
            request.headers.set('Authorization', `Bearer ${authToken.value}`)
          }
        },
      ],
    },
  })

  return {
    provide: {
      api,
    },
  }
})