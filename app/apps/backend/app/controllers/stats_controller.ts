import { HttpContext } from '@adonisjs/core/http'
import { ProductService } from '#services/product_service'

export default class StatsController {
    private productService = new ProductService()

    async index({ response }: HttpContext) {
        const products = await this.productService.count()
        return response.ok({ products })
    }
}
