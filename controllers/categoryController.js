import CategoryService from '../service/categoryService.js';
import { initRedis } from '../config/redisClient.js';
import Admin from '../models/admin.js';
import mongoose from 'mongoose';

const categoryService = new CategoryService();

export const createCategory = async (req, res) => {
  try {
    const { title, status } = req.body;
    const coverImage = req.files?.coverImage?.[0]?.filename || null;
    const image = req.files?.image?.[0]?.filename || null;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Category title is required', data: {}, err: 'Missing required field: title' });
    }

    const newCategory = await categoryService.createCategory({ title, coverImage, image, status });

    const redis = await initRedis();
    await redis.del('categories:all*');

    res.status(201).json({ success: true, message: 'Category created successfully', data: newCategory, err: {} });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message, data: {}, err: err.message });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const filter = {};

    if (req.user && req.user.type) {
      const admin = await Admin.findOne({_id:req.user.id});
      if(!admin.isSuper_Admin){
        const type = req.user.type;
        filter._id = new mongoose.Types.ObjectId(type);
      }
    }  

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' }; // case-insensitive partial match
    }

    console.log('filter', filter);

    const options = { page: parseInt(page), limit: parseInt(limit), sortBy, sortOrder, status, search };
    // const cacheKey = `categories:all:${JSON.stringify(options)}`;
    // const redis = await initRedis();

    // const cached = await redis.get(cacheKey);
    // if (cached) {
    //   return res.status(200).json({
    //     success: true,
    //     message: 'Categories fetched from cache',
    //     data: JSON.parse(cached),
    //     fromCache: true
    //   });
    // }

    const result = await categoryService.getAllCategories(filter, sort, skip, parseInt(limit));

    // await redis.setEx(cacheKey, 300, JSON.stringify(result));

    res.status(200).json({
      success: true,
      message: 'Categories fetched successfully',
      data: result,
      err: {}
    });
  } catch (err) {
    console?.log("df",err?.message)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      data: {},
      err: err.message
    });
  }
};



export const getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const cacheKey = `category:${categoryId}`;
    const redis = await initRedis();

    const cached = await redis.get(cacheKey);
    // if (cached) {
    //   return res.status(200).json({ success: true, message: 'Category fetched from cache', data: JSON.parse(cached), fromCache: true });
    // }

    const category = await categoryService.getCategoryById(categoryId);
    await redis.setEx(cacheKey, 300, JSON.stringify(category));

    res.status(200).json({ success: true, message: 'Category fetched successfully', data: category, err: {} });
  } catch (err) {
    const statusCode = err.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ success: false, message: err.message, data: {}, err: err.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const updateData = { ...req.body };

    if (req.files?.coverImage) updateData.coverImage = req.files.coverImage[0].filename;
    if (req.files?.image) updateData.image = req.files.image[0].filename;

    const updatedCategory = await categoryService.updateCategory(categoryId, updateData);

    const redis = await initRedis();
    await redis.del('categories:all*');
    await redis.del(`category:${categoryId}`);

    res.status(200).json({ success: true, message: 'Category updated successfully', data: updatedCategory, err: {} });
  } catch (err) {
    const statusCode = err.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ success: false, message: err.message, data: {}, err: err.message });
  }
};

// export const deleteCategory = async (req, res) => {
//   try {
//     const { categoryId } = req.params;
//     const deletedCategory = await categoryService.deleteCategory(categoryId);

//     const redis = await initRedis();
//     await redis.del('categories:all*');
//     await redis.del(`category:${categoryId}`);

//     res.status(200).json({ success: true, message: 'Category deleted successfully', data: deletedCategory });
//   } catch (err) {
//     const statusCode = err.message.includes('not found') ? 404 : 500;
//     res.status(statusCode).json({ success: false, message: err.message, data: {}, err: err.message });
//   }
// };

export const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    console.log('📩 Request Params deleteCategory:', req.params);

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required',
        data: {},
        err: 'Missing categoryId in request params'
      });
    }

    // Call service to delete
    console.log('🗑️ Deleting category with ID:', categoryId);
    
    const deletedCategory = await categoryService.deleteCategory(categoryId);

    // Clear Redis cache if used
    const redis = await initRedis();
    await redis.del('categories:all*');
    await redis.del(`category:${categoryId}`);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: deletedCategory
    });
  } catch (err) {
    console.error('❌ Error in deleteCategory:', err);

    const isNotFound = err.message.toLowerCase().includes('not found');
    res.status(isNotFound ? 404 : 500).json({
      success: false,
      message: err.message,
      data: {},
      err: err.message
    });
  }
};


export const getActiveCategories = async (req, res) => {
  try {
    const redis = await initRedis();
    const cacheKey = 'categories:active';

    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, message: 'Active categories fetched from cache', data: JSON.parse(cached), fromCache: true });
    }

    const categories = await categoryService.getActiveCategories();
    await redis.setEx(cacheKey, 300, JSON.stringify(categories));

    res.status(200).json({ success: true, message: 'Active categories fetched successfully', data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch active categories', data: {}, err: err.message });
  }
};

export const updateCategoryStatus = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value', data: {}, err: 'Invalid status value' });
    }

    const updatedCategory = await categoryService.updateCategoryStatus(categoryId, status);

    const redis = await initRedis();
    await redis.del('categories:all*');
    await redis.del(`category:${categoryId}`);
    await redis.del('categories:active');

    res.status(200).json({ success: true, message: `Category ${status} successfully`, data: updatedCategory });
  } catch (err) {
    const statusCode = err.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ success: false, message: err.message, data: {}, err: err.message });
  }
};

export const searchCategories = async (req, res) => {
  try {
    const { q: searchTerm, status } = req.query;
    if (!searchTerm) {
      return res.status(400).json({ success: false, message: 'Search term is required', data: {}, err: 'Missing search parameter "q"' });
    }

    const result = await categoryService.searchCategories(searchTerm, status);
    res.status(200).json({ success: true, message: 'Search completed successfully', data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Search failed', data: {}, err: err.message });
  }
};

export const getAllCategoryCoverImages = async (req, res) => {
  try {
    const redis = await initRedis();
    const cacheKey = 'categories:coverImages';

    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        message: 'Cover images fetched from cache',
        data: JSON.parse(cached),
        fromCache: true,
        err: {}
      });
    }

    // Only select _id and coverImage from all categories
    const categories = await categoryService.getCategoryCoverImages();

    await redis.setEx(cacheKey, 300, JSON.stringify(categories));

    res.status(200).json({
      success: true,
      message: 'Cover images fetched successfully',
      data: categories,
      err: {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cover images',
      data: {},
      err: err.message
    });
  }
};


