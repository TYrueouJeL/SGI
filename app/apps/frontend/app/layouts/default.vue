<template>
  <div class="flex h-screen bg-gray-50 dark:bg-gray-950">
    <!-- Sidebar -->
    <aside class="w-60 shrink-0 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <!-- Logo -->
      <div class="h-16 flex items-center px-5 border-b border-gray-200 dark:border-gray-800">
        <span class="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">SGI</span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <UNavigationMenu orientation="vertical" :items="navigation" />
      </nav>

      <!-- User -->
      <div class="p-3 border-t border-gray-200 dark:border-gray-800">
        <div class="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <UAvatar text="TU" size="sm" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">Mon compte</p>
          </div>
          <UButton color="neutral" variant="ghost" icon="i-lucide-log-out" size="xs" @click="logout" />
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Header -->
      <header class="h-16 shrink-0 flex items-center px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <h1 class="text-sm font-medium text-gray-500 dark:text-gray-400">
          <NuxtLink to="/" class="hover:text-gray-900 dark:hover:text-white transition-colors">SGI</NuxtLink>
          <span v-if="route.meta.title"> / {{ route.meta.title }}</span>
        </h1>
        <div class="ml-auto flex items-center gap-2">
          <UButton color="neutral" variant="ghost" icon="i-lucide-bell" size="sm" />
          <UColorModeButton size="sm" />
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { logout } = useAuth()

const navigation = [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/',
  },
  {
    label: 'Produits',
    icon: 'i-lucide-package',
    to: '/produits',
  },
  {
    label: 'Commandes',
    icon: 'i-lucide-shopping-cart',
    to: '/commandes',
  },
  {
    label: 'Clients',
    icon: 'i-lucide-users',
    to: '/clients',
  },
]
</script>
