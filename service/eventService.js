import EventRepository from '../repository/eventRepository.js';

export default class EventService {
  constructor() {
    this.eventRepository = new EventRepository();
  }

   async findOne(filter) {
    try {
      return await this.eventRepository.findOne(filter);
    } catch (error) {
      throw new Error(`Failed to find event: ${error.message}`);  
    }
  }


  async getEventsByCategory(category) {
    try {
      return await this.eventRepository.findAllByCategory({ category });
    } catch (error) {
      throw new Error(`Failed to retrieve events by category: ${error.message}`);
    }
  }

  async createEvent(data) {
    try {
      return await this.eventRepository.create(data);
    } catch (error) {
      throw new Error(`Failed to create event: ${error.message}`);
    }
  }

  async findByName(name) {
    try {
      return await this.eventRepository.findOne({ name: name.trim() });
    } catch (error) {
      throw new Error(`Failed to find event by name: ${error.message}`);
    }
  }

  // async getAllEvents() {
  //   try {
  //     return await this.eventRepository.findAll({ deletedAt: null });
  //   } catch (error) {
  //     throw new Error(`Failed to retrieve all events: ${error.message}`);
  //   }
  // }

  async getAllEvents(queryParams) {
  try {
    return await this.eventRepository.findAll(queryParams);
  } catch (error) {
    throw new Error(`Failed to retrieve all events: ${error.message}`);
  }
}


  async getEventById(id) {
    try {
      return await this.eventRepository.findById(id);
    } catch (error) {
      throw new Error(`Failed to retrieve event by ID: ${error.message}`);
    }
  }

  async updateEvent(id, data) {
    try {
      return await this.eventRepository.update(id, data);
    } catch (error) {
      throw new Error(`Failed to update event: ${error.message}`);
    }
  }

  async deleteEvent(id) {
    try {
      return await this.eventRepository.softDelete(id);
    } catch (error) {
      throw new Error(`Failed to delete event: ${error.message}`);
    }
  }
}
