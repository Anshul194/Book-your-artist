import Ticket from '../models/Ticket.js';
import Event from '../models/Event.js';
import mongoose from 'mongoose'; // Added to ensure mongoose is available

export default class TicketRepository {
  async create(data) {
    try {
      return await Ticket.create(data);
    } catch (error) {
      throw new Error('Failed to create ticket: ' + error.message);
    }
  }

async findAll({ page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', filters = {}, search, eventVersion }) {
  try {
    const skip = (page - 1) * limit;

    const pipeline = [
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'event',
        },
      },
      { $unwind: '$event' },
    ];

    const matchConditions = [];

    // Apply direct filters (like status, event ID)
    if (filters.status) {
      matchConditions.push({ status: filters.status });
    }
    // Fix: filter by event._id after $lookup/$unwind
    if (filters.event) {
      matchConditions.push({ 'event._id': filters.event });
    }

    // Search across ticketType and event.name
    if (search) {
      matchConditions.push({
        $or: [
          { ticketType: { $regex: search, $options: 'i' } },
          { 'event.name': { $regex: search, $options: 'i' } },
        ],
      });
    }

    // Filter by event version
    if (eventVersion) {
      matchConditions.push({
        'event.name': { $regex: eventVersion, $options: 'i' },
      });
    }

    if (matchConditions.length > 0) {
      pipeline.push({ $match: { $and: matchConditions } });
    }

    pipeline.push(
      { $sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 } },
      { $skip: skip },
      { $limit: limit }
    );

    const tickets = await Ticket.aggregate(pipeline);

    // For total count
    const countPipeline = [...pipeline];
    countPipeline.splice(-3); // remove sort, skip, limit
    countPipeline.push({ $count: 'total' });

    const totalAgg = await Ticket.aggregate(countPipeline);
    const total = totalAgg[0]?.total || 0;

    return {
      data: tickets,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    throw new Error('Failed to fetch tickets: ' + error.message);
  }
}


  async findById(id) {
    try {
      console.log('Fetching ticket by ID:', id);
      return await Ticket.findById(id).populate('event', 'name startDate startTime placeName fullAddress');
    } catch (error) {
      throw new Error('Failed to fetch ticket by ID: ' + error.message);
    }
  }

  async findByCategory({ page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', filters = {} }) {
    try {
      // Verify Event model
      if (!Event || typeof Event.find !== 'function') {
        throw new Error('Event model is not properly defined or imported');
      }

      const skip = (page - 1) * limit;

     

      const query = { event: filters.event };
      if (filters.status) query.status = filters.status;
      if (filters.category) query.ticketTypeId = filters.category;
      // console.log('Querying tickets with:', query, limit, skip, sortBy, sortOrder);
      const tickets = await Ticket.find(query)
        .populate('event', 'name startDate startTime placeName fullAddress')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit);

      const total = await Ticket.countDocuments(query);

      return {
        data: tickets,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error in findByCategory:', error);
      throw new Error('Failed to fetch tickets by category: ' + error.message);
    }
  }

  async update(id, data) {
    try {
      return await Ticket.findByIdAndUpdate(id, data, { new: true }).populate('event', 'name startDate startTime placeName fullAddress');
    } catch (error) {
      throw new Error('Failed to update ticket: ' + error.message);
    }
  }

  async delete(id) {
    try {
      return await Ticket.findByIdAndDelete(id);
    } catch (error) {
      throw new Error('Failed to delete ticket: ' + error.message);
    }
  }
}