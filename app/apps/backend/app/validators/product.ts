import vine from "@vinejs/vine";
import { Infer } from "@vinejs/vine/types";

export const createProductValidator = vine.create({
    reference: vine.string(),
    name: vine.string(),
    description: vine.string()
})

export const updateProductValidator = vine.create({
    reference: vine.string().optional(),
    name: vine.string().optional(),
    description: vine.string().optional()
})

export type createProductDto = Infer<typeof createProductValidator>
export type updateProductDto = Infer<typeof updateProductValidator>