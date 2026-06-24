import { HttpContext } from "@adonisjs/core/http";
import Product from "#models/product";
import { ProductService } from "#services/product_service";
import BaseController from "./base_controller.ts";
import { createProductValidator, updateProductValidator } from "#validators/product";

export default class ProductsController extends BaseController<typeof Product, ProductService> {
    constructor() {
        super(new ProductService())
    }

    async store({ request, response }: HttpContext) {
        const data = await request.validateUsing(createProductValidator)
        const product = await this.service.create(data)
        return response.created(product)
    }

    async update({ params, request, response }: HttpContext) {
        const data = await request.validateUsing(updateProductValidator)
        const product = await this.service.update(params.id, data)
        return response.ok(product)
    }
}