import Category from "#models/category";
import { createCategoryDto, updateCategoryDto } from "#validators/category";
import { BaseService } from "./base_service.ts";

export class CategoryService extends BaseService<typeof Category> {
    constructor() {
        super(Category)
    }

    async create (data: createCategoryDto) {
        return Category.create(data)
    }

    async update(categoryId: number, data: updateCategoryDto) {
        const category = await Category.findOrFail(categoryId)
        category.merge(data)
        await category.save()
        return category
    }
}