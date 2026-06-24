import { createTuyau } from '@tuyau/core/client'
import { registry } from '@api-starter-kit/backend/registry'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const api = createTuyau({
    baseUrl: config.public.apiUrl || 'http://localhost:3333',
    registry,
  })

  return {
    provide: {
      api,
    },
  }
})