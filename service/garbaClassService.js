import GarbaClassRepository from "../repository/garbaClassRepository.js";

export default class GarbaClassService {
  constructor() {
    this.garbaClassRepository = new GarbaClassRepository();
  }

  async createGarbaClass(data) {
    try {
      return await this.garbaClassRepository.create(data);
    } catch (error) {
      throw new Error(`Failed to create garba class: ${error.message}`);
    }
  }

  async getAllGarbaClasses(queryParams) {
    try {
      return await this.garbaClassRepository.findAll(queryParams);
    } catch (error) {
      throw new Error(`Failed to get all garba classes: ${error.message}`);
    }
  }

  async getGarbaClassById(id) {
    try {
      return await this.garbaClassRepository.findById(id);
    } catch (error) {
      throw new Error(`Failed to get garba class by ID: ${error.message}`);
    }
  }

  async updateGarbaClass(id, data) {
    try {
      return await this.garbaClassRepository.update(id, data);
    } catch (error) {
      throw new Error(`Failed to update garba class: ${error.message}`);
    }
  }

  async deleteGarbaClass(id) {
    try {
      return await this.garbaClassRepository.delete(id);
    } catch (error) {
      throw new Error(`Failed to delete garba class: ${error.message}`);
    }
  }


  async getAllZones() {
  try {
    return await this.garbaClassRepository.getAllZones();
  } catch (error) {
    throw new Error(`Failed to get zones: ${error.message}`);
  }
}


  //getKhaliyaPriceByZone
  async getKhaliyaPriceByZone(categoryId) {
    try {
      return await this.garbaClassRepository.getKhaliyaPriceByZone(categoryId);
    } catch (error) {
      throw new Error(`Failed to get khaliya price by zone: ${error.message}`);
    }
  }

}
