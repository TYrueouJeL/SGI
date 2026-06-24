<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Produits</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ products?.length ?? 0 }} produit{{ (products?.length ?? 0) !== 1 ? 's' : '' }}</p>
      </div>
      <UButton icon="i-lucide-plus" @click="openModal()">Nouveau produit</UButton>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-3">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Rechercher un produit..."
        class="w-72"
      />
    </div>

    <!-- Table -->
    <UCard :ui="{ body: 'p-0' }">
      <UTable
        :data="filteredProducts"
        :columns="columns"
        :loading="pending"
        class="w-full"
      >
        <template #actions-cell="{ row }">
          <div class="flex items-center gap-1 justify-end">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-pencil"
              size="xs"
              @click="openModal(row.original)"
            />
            <UButton
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              size="xs"
              @click="confirmDelete(row.original)"
            />
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- Modal création / édition -->
    <UModal v-model:open="isModalOpen" :title="editingProduct ? 'Modifier le produit' : 'Nouveau produit'">
      <template #body>
        <UForm :schema="schema" :state="formState" class="space-y-4" @submit="onSubmit">
          <UFormField label="Référence" name="reference" required>
            <UInput v-model="formState.reference" placeholder="REF-001" class="w-full" />
          </UFormField>
          <UFormField label="Nom" name="name" required>
            <UInput v-model="formState.name" placeholder="Nom du produit" class="w-full" />
          </UFormField>
          <UFormField label="Description" name="description" required>
            <UTextarea v-model="formState.description" placeholder="Description du produit" class="w-full" :rows="3" />
          </UFormField>
          <div class="flex justify-end gap-3 pt-2">
            <UButton color="neutral" variant="outline" @click="isModalOpen = false">Annuler</UButton>
            <UButton type="submit" :loading="submitting">
              {{ editingProduct ? 'Enregistrer' : 'Créer' }}
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <!-- Modal confirmation suppression -->
    <UModal v-model:open="isDeleteModalOpen" title="Supprimer le produit">
      <template #body>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Voulez-vous vraiment supprimer <strong>{{ deletingProduct?.name }}</strong> ? Cette action est irréversible.
        </p>
        <div class="flex justify-end gap-3 mt-6">
          <UButton color="neutral" variant="outline" @click="isDeleteModalOpen = false">Annuler</UButton>
          <UButton color="error" :loading="deleting" @click="deleteProduct">Supprimer</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import * as v from 'valibot'

definePageMeta({
  layout: 'default',
  title: 'Produits',
})

const { $api } = useNuxtApp()
const toast = useToast()

// --- Data ---
const { data: products, pending, refresh } = await useAsyncData('products', async () => {
  const res = await $api.api.products.index({})
  console.log('[products] GET response:', res)
  return res ?? []
}, { server: false, default: () => [] })

// --- Search ---
const search = ref('')
const filteredProducts = computed(() => {
  if (!search.value) return products.value ?? []
  const q = search.value.toLowerCase()
  return (products.value ?? []).filter(
    (p) => p.name.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q)
  )
})

// --- Table columns ---
const columns = [
  { accessorKey: 'reference', header: 'Référence' },
  { accessorKey: 'name', header: 'Nom' },
  { accessorKey: 'description', header: 'Description' },
  { id: 'actions', header: '' },
]

// --- Modal création / édition ---
const isModalOpen = ref(false)
const editingProduct = ref<{ id: number; reference: string; name: string; description: string } | null>(null)
const submitting = ref(false)

const schema = v.object({
  reference: v.pipe(v.string(), v.minLength(1, 'La référence est requise')),
  name: v.pipe(v.string(), v.minLength(1, 'Le nom est requis')),
  description: v.pipe(v.string(), v.minLength(1, 'La description est requise')),
})

const formState = reactive({ reference: '', name: '', description: '' })

function openModal(product?: typeof editingProduct.value) {
  editingProduct.value = product ?? null
  formState.reference = product?.reference ?? ''
  formState.name = product?.name ?? ''
  formState.description = product?.description ?? ''
  isModalOpen.value = true
}

async function onSubmit() {
  submitting.value = true
  try {
    if (editingProduct.value) {
      const res = await $api.api.products.update({ params: { id: String(editingProduct.value.id) }, body: formState })
      console.log('[products] PUT response:', res)
      toast.add({ title: 'Produit mis à jour', color: 'success' })
    } else {
      const res = await $api.api.products.store({ body: formState })
      console.log('[products] POST response (created product):', res)
      toast.add({ title: 'Produit créé', color: 'success' })
    }
    isModalOpen.value = false
    await refresh()
  } catch (error) {
    console.error('[products] submit error:', error)
    toast.add({ title: 'Une erreur est survenue', color: 'error' })
  } finally {
    submitting.value = false
  }
}

// --- Suppression ---
const isDeleteModalOpen = ref(false)
const deletingProduct = ref<{ id: number; name: string } | null>(null)
const deleting = ref(false)

function confirmDelete(product: { id: number; name: string }) {
  deletingProduct.value = product
  isDeleteModalOpen.value = true
}

async function deleteProduct() {
  if (!deletingProduct.value) return
  deleting.value = true
  try {
    const res = await $api.api.products.destroy({ params: { id: String(deletingProduct.value.id) } })
    console.log('[products] DELETE response:', res)
    toast.add({ title: 'Produit supprimé', color: 'success' })
    isDeleteModalOpen.value = false
    await refresh()
  } catch (error) {
    console.error('[products] delete error:', error)
    toast.add({ title: 'Une erreur est survenue', color: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>
