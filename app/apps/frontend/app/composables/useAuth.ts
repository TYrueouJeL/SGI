export function useAuth() {
  const { $api } = useNuxtApp()
  const authToken = useCookie('auth_token', { maxAge: 60 * 60 * 24 * 7 })

  const isAuthenticated = computed(() => !!authToken.value)

  async function login(email: string, password: string) {
    const res = await $api.api.auth.accessTokens.store({ body: { email, password } })
    if (res.data?.token) {
      authToken.value = res.data.token
    }
    return res
  }

  function logout() {
    authToken.value = null
    navigateTo('/login')
  }

  return { isAuthenticated, login, logout }
}
