<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
    <UCard class="w-full max-w-sm">
      <template #header>
        <div class="text-center">
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">SGI</p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Connectez-vous à votre compte</p>
        </div>
      </template>

      <UForm :state="formState" class="space-y-4" @submit="onSubmit">
        <UFormField label="Email" name="email">
          <UInput v-model="formState.email" type="email" placeholder="vous@example.com" class="w-full" autocomplete="email" />
        </UFormField>
        <UFormField label="Mot de passe" name="password">
          <UInput v-model="formState.password" type="password" placeholder="••••••••" class="w-full" autocomplete="current-password" />
        </UFormField>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

        <UButton type="submit" class="w-full justify-center" :loading="loading">
          Se connecter
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { login } = useAuth()

const formState = reactive({ email: '', password: '' })
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    await login(formState.email, formState.password)
    await navigateTo('/')
  } catch (e) {
    console.error('[login] error:', e)
    error.value = 'Email ou mot de passe incorrect.'
  } finally {
    loading.value = false
  }
}
</script>
