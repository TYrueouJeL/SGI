import vine from '@vinejs/vine'
import { Infer } from '@vinejs/vine/types'

export const createCategoryValidator = vine.create({
  name: vine.string(),
  code: vine.string().maxLength(20).unique({ table: 'categories', column: 'code' }),
})

export const updateCategoryValidator = vine.withMetaData<{ id: number }>().create({
  name: vine.string().optional(),
  code: vine.string().maxLength(20).unique({
    table: 'categories',
    column: 'code',
    filter: (db, _value, field) => {
      db.whereNot('id', (field.meta as { id: number }).id)
    },
  }).optional(),
})

export type createCategoryDto = Infer<typeof createCategoryValidator>
export type updateCategoryDto = Infer<typeof updateCategoryValidator>
