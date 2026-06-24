import { HttpContext } from "@adonisjs/core/http";
import { BaseService } from "#services/base_service";
import { LucidModel } from "@adonisjs/lucid/types/model";

export default abstract class BaseController<Model extends LucidModel, Service extends BaseService<Model>> {
    constructor(protected service: Service) {}

    async index({ response }: HttpContext) {
        const models = await this.service.getAll()
        return response.ok(models)
    }

    async show({ params, response }: HttpContext) {
        const model = await this.service.findOrFail(params.id)
        return response.ok(model)
    }

    async destroy({ params, response }: HttpContext) {
        await this.service.delete(params.id)
        return response.noContent()
    }
}