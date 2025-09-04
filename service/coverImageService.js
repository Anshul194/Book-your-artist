import CoverImageRepository from '../repository/coverImageRepository.js';

export default class CoverImageService {
  constructor() {
    this.coverImageRepository = new CoverImageRepository();
  }

  async findOne(filter) {
    try {
      return await this.coverImageRepository.findOne(filter);
    } catch (error) {
      throw new Error(`Failed to find cover image: ${error.message}`);  
    }
  }

  async createCoverImage(data) {
    try {
      return await this.coverImageRepository.create(data);
    } catch (error) {
      throw new Error(`Failed to create cover image: ${error.message}`);
    }
  }

  async getAllCoverImages(queryParams) {
    try {
      return await this.coverImageRepository.findAll(queryParams);
    } catch (error) {
      throw new Error(`Failed to retrieve all cover images: ${error.message}`);
    }
  }

  async getCoverImageById(id) {
    try {
      return await this.coverImageRepository.findById(id);
    } catch (error) {
      throw new Error(`Failed to retrieve cover image by ID: ${error.message}`);
    }
  }

  async updateCoverImage(id, data) {
    try {
      return await this.coverImageRepository.update(id, data);
    } catch (error) {
      throw new Error(`Failed to update cover image: ${error.message}`);
    }
  }

  async deleteCoverImage(id) {
    try {
      return await this.coverImageRepository.delete(id);
    } catch (error) {
      throw new Error(`Failed to delete cover image: ${error.message}`);
    }
  }
}
