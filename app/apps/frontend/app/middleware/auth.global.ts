export default defineNuxtRouteMiddleware((to) => {
  const authToken = useCookie('auth_token')

  if (!authToken.value && to.path !== '/login') {
    return navigateTo('/login')
  }

  if (authToken.value && to.path === '/login') {
    return navigateTo('/')
  }
})
