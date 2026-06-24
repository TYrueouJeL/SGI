import { LucidModel } from "@adonisjs/lucid/types/model";

export abstract class BaseService<Model extends LucidModel> {
    constructor(protected model: Model) {}

    getAll() {
        return this.model.all()
    }

    async findOrFail(modelId: number) {
        return this.model.findOrFail(modelId)
    }

    async delete(modelId: number) {
        const model = await this.model.findOrFail(modelId)
        return model.delete()
    }
}