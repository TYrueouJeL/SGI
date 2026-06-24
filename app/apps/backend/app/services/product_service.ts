import Product from "#models/product";
import { createProductDto, updateProductDto } from "#validators/product";
import { BaseService } from "./base_service.ts";

export class ProductService extends BaseService<typeof Product> {
  constructor() {
    super(Product)
  }

  async create(data: createProductDto) {
    return Product.create(data)
  }

  async update(productId: number, data: updateProductDto) {
    const product = await Product.findOrFail(productId)
    product.merge(data)
    await product.save()
    return product
  }
}