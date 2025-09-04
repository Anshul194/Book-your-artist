import ZoneRepository from '../repository/zoneRepository.js';

export default class ZoneService {
  constructor() {
    this.zoneRepository = new ZoneRepository();
  }

  async createZone(data) {
    try {
      return await this.zoneRepository.create(data);
    } catch (error) {
      throw new Error(`Failed to create zone: ${error.message}`);
    }
  }

  async getAllZones(query) {
    try {
      return await this.zoneRepository.findAll(query);
    } catch (error) {
      throw new Error(`Failed to retrieve all zones: ${error.message}`);
    }
  }

  async getZoneById(id) {
    try {
      return await this.zoneRepository.findById(id);
    } catch (error) {
      throw new Error(`Failed to retrieve zone by ID: ${error.message}`);
    }
  }

  async updateZone(id, data) {
    try {
      return await this.zoneRepository.update(id, data);
    } catch (error) {
      throw new Error(`Failed to update zone: ${error.message}`);
    }
  }

  async deleteZone(id) {
    try {
      return await this.zoneRepository.delete(id);
    } catch (error) {
      throw new Error(`Failed to delete zone: ${error.message}`);
    }
  }
}
