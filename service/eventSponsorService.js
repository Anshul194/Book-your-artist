// service/eventSponsorService.js
import EventSponsorRepository from '../repository/eventSponsorRepository.js';

export default class EventSponsorService {
  constructor() {
    this.eventSponsorRepository = new EventSponsorRepository();
  }

  async findOne(filter) {
    try {
      return await this.eventSponsorRepository.findOne(filter);
    } catch (error) {
      throw new Error(`Failed to find event sponsor: ${error.message}`);
    }
  }

  async createEventSponsor(data) {
    try {
      return await this.eventSponsorRepository.create(data);
    } catch (error) {
      throw new Error(`Failed to create event sponsor: ${error.message}`);
    }
  }

  async getAllEventSponsors(queryParams) {
    try {
      return await this.eventSponsorRepository.findAll(queryParams);
    } catch (error) {
      throw new Error(`Failed to retrieve all event sponsors: ${error.message}`);
    }
  }

  async getEventSponsorById(id) {
    try {
      return await this.eventSponsorRepository.findById(id);
    } catch (error) {
      throw new Error(`Failed to retrieve event sponsor by ID: ${error.message}`);
    }
  }

  async updateEventSponsor(id, data) {
    try {
      return await this.eventSponsorRepository.update(id, data);
    } catch (error) {
      throw new Error(`Failed to update event sponsor: ${error.message}`);
    }
  }

  async deleteEventSponsor(id) {
    try {
      return await this.eventSponsorRepository.delete(id);
    } catch (error) {
      throw new Error(`Failed to delete event sponsor: ${error.message}`);
    }
  }

  async getHomeSponsor() {
    try {
      return await this.eventSponsorRepository.findHomeSponsor();
    } catch (error) {
      throw new Error(`Failed to retrieve home sponsors: ${error.message}`);
    }
  }
}