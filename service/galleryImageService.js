import galleryImageRepository from '../repository/galleryImageRepository.js';

export default class galleryImageService {
  constructor() {
    this.galleryImageRepository = new galleryImageRepository();
  }

  async findOne(filter) {
    try {
      return await this.galleryImageRepository.findOne(filter);
    } catch (error) {
      throw new Error(`Failed to find gallery image: ${error.message}`);  
    }
  }

  async creategalleryImage(data) {
    try {
      return await this.galleryImageRepository.create(data);
    } catch (error) {
      throw new Error(`Failed to create gallery image: ${error.message}`);
    }
  }

  async getAllgalleryImages(queryParams) {
    try {
      return await this.galleryImageRepository.findAll(queryParams);
    } catch (error) {
      throw new Error(`Failed to retrieve all gallery images: ${error.message}`);
    }
  }

  async getgalleryImageById(id) {
    try {
      return await this.galleryImageRepository.findById(id);
    } catch (error) {
      throw new Error(`Failed to retrieve gallery image by ID: ${error.message}`);
    }
  }

  async updategalleryImage(id, data) {
    try {
      return await this.galleryImageRepository.update(id, data);
    } catch (error) {
      throw new Error(`Failed to update gallery image: ${error.message}`);
    }
  }

  async deletegalleryImage(id) {
  try {
    return await this.galleryImageRepository.delete(id);
  } catch (error) {
    throw new Error(`Failed to delete gallery image: ${error.message}`);
  }
}

}
