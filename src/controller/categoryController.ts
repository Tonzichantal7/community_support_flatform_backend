import { Response } from 'express';
import { AuthRequest } from '../types';
import Category from '../models/Category';

/**
 * Get all categories (public endpoint)
 */
export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await Category.find({ isActive: true }).select('-createdBy');
    res.status(200).json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

/**
 * Get a single category by ID (public endpoint)
 */
export const getCategoryById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Category ID is required' });
      return;
    }
    const category = await Category.findOne({ id: id as string, isActive: true }).select('-createdBy');
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.status(200).json({ category });
  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
};

/**
 * Create a new category (admin only)
 */
export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { name, description, isActive } = req.body;

    if (!name || name.trim() === '') {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      res.status(409).json({ error: 'Category already exists' });
      return;
    }

    const category = new Category({
      name,
      description: description || '',
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id,
    });

    await category.save();

    res.status(201).json({
      message: 'Category created successfully',
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        isActive: category.isActive,
        createdAt: category.createdAt,
      },
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

/**
 * Update a category (admin only)
 */
export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Category ID is required' });
      return;
    }
    const { name, description, isActive } = req.body;

    const category = await Category.findOne({ id: id as string });
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Update fields if provided
    if (name !== undefined && name.trim() !== '') {
      // Check for duplicate name (excluding current category)
      const duplicate = await Category.findOne({
        name: name,
        _id: { $ne: category._id }
      });
      if (duplicate) {
        res.status(409).json({ error: 'Category name already exists' });
        return;
      }
      category.name = name;
    }

    if (description !== undefined) {
      category.description = description;
    }

    if (isActive !== undefined) {
      category.isActive = isActive;
    }

    await category.save();

    res.status(200).json({
      message: 'Category updated successfully',
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        isActive: category.isActive,
        updatedAt: category.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

/**
 * Delete a category (admin only)
 */
export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Category ID is required' });
      return;
    }

    const category = await Category.findOneAndDelete({ id: id as string });
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};
