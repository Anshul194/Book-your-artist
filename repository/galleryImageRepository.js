import galleryImage from '../models/galleryImage.js';

export default class galleryImageRepository {


  async create(data) {
    try {
      return await galleryImage.create(data);
    } catch (error) {
      throw new Error(`Failed to create cover image: ${error.message}`);
    }
  }

  async findAll({
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    filters = {},
  } = {}) {
    try {
      const query = { ...filters };

      // Search is not applicable for cover images as they don't have searchable text fields
      // But keeping the structure consistent with other APIs

      const skip = (page - 1) * limit;

      const galleryImages = await galleryImage.find(query)
        .populate('event', 'name startDate placeName')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit);

      const total = await galleryImage.countDocuments(query);

      return {
        data: galleryImages,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Failed to find all cover images: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await galleryImage.findById(id).populate('event', 'name startDate placeName');
    } catch (error) {
      throw new Error(`Failed to find cover image by ID: ${error.message}`);
    }
  }

  async update(id, data) {
    try {
      return await galleryImage.findByIdAndUpdate(id, data, { new: true }).populate('event', 'name startDate placeName');
    } catch (error) {
      throw new Error(`Failed to update cover image: ${error.message}`);
    }
  }

  async findOne(filter) {
    return await galleryImage.findOne(filter);
  }
  
  async delete(id) {
  try {
    return await galleryImage.findByIdAndDelete(id);
  } catch (error) {
    throw new Error(`Failed to delete cover image: ${error.message}`);
  }
}

}
