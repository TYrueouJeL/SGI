import type { HttpContext } from '@adonisjs/core/http'
import Category from "#models/category";
import { CategoryService } from "#services/category_service";
import { createCategoryValidator, updateCategoryValidator } from "#validators/category";
import BaseController from "./base_controller.ts";

export default class CategoriesController extends BaseController<typeof Category, CategoryService> {
    constructor() {
        super(new CategoryService())
    }

    async store({ request, response }: HttpContext) {
        const data = await request.validateUsing(createCategoryValidator)
        const category = await this.service.create(data)
        return response.created(category)
    }

    async update({ params, request, response }: HttpContext) {
        const data = await request.validateUsing(updateCategoryValidator, { meta: { id: params.id } })
        const category = await this.service.update(params.id, data)
        return response.ok(category)
    }
}