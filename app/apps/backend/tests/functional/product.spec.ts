import { test } from '@japa/runner'
import User from '#models/user'
import Product from '#models/product'

test.group('Product', (group) => {
  let user: User

  group.each.setup(async () => {
    user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
    })
  })

  group.each.teardown(async () => {
    await Product.query().delete()
    await User.query().delete()
  })

  test('GET /api/product — retourne la liste des produits', async ({ client }) => {
    await Product.createMany([
      { reference: 'REF-001', name: 'Produit A', description: 'Description A' },
      { reference: 'REF-002', name: 'Produit B', description: 'Description B' },
    ])

    const response = await client.get('/api/product').loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains([{ reference: 'REF-001' }, { reference: 'REF-002' }])
  })

  test('GET /api/product/:id — retourne un produit', async ({ client }) => {
    const product = await Product.create({
      reference: 'REF-001',
      name: 'Produit A',
      description: 'Description A',
    })

    const response = await client.get(`/api/product/${product.id}`).loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({ reference: 'REF-001', name: 'Produit A' })
  })

  test('GET /api/product/:id — retourne 404 si inexistant', async ({ client }) => {
    const response = await client.get('/api/product/99999').loginAs(user)

    response.assertStatus(404)
  })

  test('POST /api/product — crée un produit', async ({ client, assert }) => {
    const response = await client.post('/api/product').loginAs(user).json({
      reference: 'REF-001',
      name: 'Nouveau Produit',
      description: 'Une description',
    })

    response.assertStatus(201)
    response.assertBodyContains({ name: 'Nouveau Produit' })

    const count = await Product.query().count('* as total')
    assert.equal(count[0].$extras.total, 1)
  })

  test('POST /api/product — retourne 422 si données invalides', async ({ client }) => {
    const response = await client.post('/api/product').loginAs(user).json({
      name: 'Sans référence',
    })

    response.assertStatus(422)
  })

  test('PUT /api/product/:id — met à jour un produit', async ({ client }) => {
    const product = await Product.create({
      reference: 'REF-001',
      name: 'Ancien nom',
      description: 'Ancienne description',
    })

    const response = await client
      .put(`/api/product/${product.id}`)
      .loginAs(user)
      .json({ name: 'Nouveau nom' })

    response.assertStatus(200)
    response.assertBodyContains({ name: 'Nouveau nom' })
  })

  test('DELETE /api/product/:id — supprime un produit', async ({ client, assert }) => {
    const product = await Product.create({
      reference: 'REF-001',
      name: 'À supprimer',
      description: 'Description',
    })

    const response = await client.delete(`/api/product/${product.id}`).loginAs(user)

    response.assertStatus(204)

    const deleted = await Product.find(product.id)
    assert.isNull(deleted)
  })

  test('routes protégées — retourne 401 sans authentification', async ({ client }) => {
    const response = await client.get('/api/product')

    response.assertStatus(401)
  })
})
