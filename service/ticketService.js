import TicketRepository from '../repository/ticketRepository.js';

export default class TicketService {
  constructor() {
    this.ticketRepository = new TicketRepository();
  }

  async createTicket(data) {
    try {
      return await this.ticketRepository.create(data);
    } catch (error) {
      throw error;
    }
  }

async getAllTickets(query) {
  try {
    return await this.ticketRepository.findAll(query);
  } catch (error) {
    throw error;
  }
}


   async getTicketsByCategory(query) {
    try {
      return await this.ticketRepository.findByCategory(query);
    } catch (error) {
      throw error;
    }
  }

  async getTicketById(id) {
    try {
      return await this.ticketRepository.findById(id);
    } catch (error) {
      throw error;
    }
  }

  async updateTicket(id, data) {
    try {
      return await this.ticketRepository.update(id, data);
    } catch (error) {
      throw error;
    }
  }

  async deleteTicket(id) {
    try {
      return await this.ticketRepository.delete(id);
    } catch (error) {
      throw error;
    }
  }
}
