<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Vue d'ensemble</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard v-for="stat in stats" :key="stat.label">
        <div class="flex items-center gap-4">
          <div class="p-2.5 rounded-lg bg-primary-50 dark:bg-primary-950">
            <UIcon :name="stat.icon" class="size-5 text-primary-500" />
          </div>
          <div>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stat.value }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ stat.label }}</p>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Dashboard',
})

const stats = [
  { label: 'Produits', value: '—', icon: 'i-lucide-package' },
  { label: 'Commandes', value: '—', icon: 'i-lucide-shopping-cart' },
  { label: 'Clients', value: '—', icon: 'i-lucide-users' },
  { label: 'Revenus', value: '—', icon: 'i-lucide-trending-up' },
]
</script>
