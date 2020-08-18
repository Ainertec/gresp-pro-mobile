import { Request, Response } from 'express';
import Category from '../models/Category';

class CategoryController {
  async index(request: Request, response: Response) {
    const category = await Category.find({}).populate('products');
    return response.json(category);
  }

  async show(request: Request, response: Response) {
    const { id } = request.params;
    const category = await Category.find({ _id: id }).populate('products');

    const categoryProducts = category.map(categoryItem => {
      return categoryItem.products;
    });
    return response.json(categoryProducts);
  }

  async store(request: Request, response: Response) {
    const { name, products } = request.body;

    const category = await Category.create({
      name,
      products,
    });
    await category.populate('products');
    return response.json(category);
  }

  async update(request: Request, response: Response) {
    const { name, products } = request.body;
    const { id } = request.params;

    const category = await Category.findByIdAndUpdate(
      { _id: id },
      {
        name,
        products,
      },
      { new: true },
    );
    if (!category) {
      return response.status(400).json('That category does not exist');
    }
    category.populate('products');
    return response.json(category);
  }

  async delete(request: Request, response: Response) {
    const { id } = request.params;

    const category = await Category.deleteOne({ _id: id });

    return response.json(category);
  }
}

export default new CategoryController();
