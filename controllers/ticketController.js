import TicketService from "../service/ticketService.js";
import { initRedis } from "../config/redisClient.js";
import {
  ticketCreateValidator,
  ticketUpdateValidator,
} from "../validations/ticketValidation.js";
import mongoose from "mongoose";
import Admin from '../models/admin.js';
import Event from '../models/Event.js'; // Assuming you have an Event model for fetching event details

const ticketService = new TicketService();

export const createTicket = async (req, res) => {
  try {
    const { error, value } = ticketCreateValidator.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        details: error.details,
      });

    const ticket = await ticketService.createTicket(value);

    const redis = await initRedis();
    const keys = await redis.keys("tickets:all*");
    if (keys.length) await redis.del(keys);

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: ticket,
    });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.ticketType) {
      return res
        .status(400)
        .json({ success: false, message: "Ticket type already exists" });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllTickets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
      event,
      search,
      eventVersion,
    } = req.query;

    const filters = {};

    if (status) filters.status = status;
    if (event && mongoose.Types.ObjectId.isValid(event)) {
      filters.event = new mongoose.Types.ObjectId(event);
    }

     if (req.user && req.user.type) {
          const admin = await Admin.findOne({ _id: req.user.id });
          if (!admin.isSuper_Admin) {
            const type = req.user.type;
            const event = await Event.findOne({ category: type });
            console.log("Event found:", event);
            filters.event = new mongoose.Types.ObjectId(event._id);
          }
        }

        console.log("Filters applied:", filters);

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      filters,
      search,
      eventVersion,
    };

    // const redis = await initRedis();
    // const cacheKey = `tickets:all:${JSON.stringify(options)}`;
    // const cached = await redis.get(cacheKey);

    // Uncomment this block if you want caching enabled
    // if (cached) {
    //   return res.status(200).json({
    //     success: true,
    //     message: "Tickets fetched (from cache)",
    //     ...JSON.parse(cached),
    //     fromCache: true,
    //   });
    // }

    const tickets = await ticketService.getAllTickets(options);
    // await redis.setEx(cacheKey, 300, JSON.stringify(tickets));

    res
      .status(200)
      .json({ success: true, message: "Tickets fetched", ...tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const getTicketById = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    const redis = await initRedis();
    const cacheKey = `ticket:${ticketId}`;
    const cached = await redis.get(cacheKey);

    // if (cached) {
    //   return res.status(200).json({
    //     success: true,
    //     message: 'Ticket fetched from cache',
    //     data: JSON.parse(cached),
    //     fromCache: true
    //   });
    // }

    const ticket = await ticketService.getTicketById(ticketId);
    if (!ticket)
      return res
        .status(404)
        .json({ success: false, message: "Ticket not found" });

    await redis.setEx(cacheKey, 300, JSON.stringify(ticket));
    res
      .status(200)
      .json({ success: true, message: "Ticket fetched", data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateTicket = async (req, res) => {
  try {
    const { error, value } = ticketUpdateValidator.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        details: error.details,
      });

    const ticketId = req.params.ticketId;
    const updated = await ticketService.updateTicket(ticketId, value);
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Ticket not found" });

    const redis = await initRedis();
    await redis.del(`ticket:${ticketId}`);
    const keys = await redis.keys("tickets:all*");
    if (keys.length) await redis.del(keys);

    res
      .status(200)
      .json({ success: true, message: "Ticket updated", data: updated });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.ticketType) {
      return res
        .status(400)
        .json({ success: false, message: "Ticket type already exists" });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteTicket = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    const deleted = await ticketService.deleteTicket(ticketId);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Ticket not found" });

    const redis = await initRedis();
    await redis.del(`ticket:${ticketId}`);
    const keys = await redis.keys("tickets:all*");
    if (keys.length) await redis.del(keys);

    res
      .status(200)
      .json({ success: true, message: "Ticket deleted", data: deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getTicketsByCategory = async (req, res) => {
  try {
    const { categoryId, eventId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid category ID" });
    }

    if (eventId && !mongoose.Types.ObjectId.isValid(eventId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid event ID" });
    }

    const filters = { category: categoryId };
    if (eventId) filters.event = eventId;
    // if (status) filters.status = status;
    filters.status = status || "publish";

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      filters,
    };

    console.log("Fetching tickets with options:", options);
    const redis = await initRedis();
    const cacheKey = `tickets:category:${categoryId}:${
      eventId || "all"
    }:${JSON.stringify(options)}`;
    const cached = await redis.get(cacheKey);

    // if (cached) {
    //   return res.status(200).json({
    //     success: true,
    //     message: 'Tickets fetched (from cache)',
    //     ...JSON.parse(cached),
    //     fromCache: true
    //   });
    // }

    const tickets = await ticketService.getTicketsByCategory(options);
    if (!tickets.data.length) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No tickets found for this category",
        });
    }

    await redis.setEx(cacheKey, 300, JSON.stringify(tickets));

    res
      .status(200)
      .json({ success: true, message: "Tickets fetched", ...tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
