// controllers/eventSponsorController.js
import EventSponsorService from '../service/eventSponsorService.js';
import { initRedis } from '../config/redisClient.js';
import { eventSponsorCreateValidator, eventSponsorUpdateValidator } from '../validations/eventSponsorValidation.js';
import Admin from '../models/admin.js';
import Event from '../models/Event.js'; // Assuming you have an Event model for fetching event details
import mongoose from 'mongoose';

const eventSponsorService = new EventSponsorService();

export const createEventSponsor = async (req, res) => {
  try {
    const { error, value } = eventSponsorCreateValidator.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: error.details });
    }

    // Check if sponsor with same name exists for this event
    // const existingSponsor = await eventSponsorService.findOne({ 
    //   event: value.event, 
    //   name: value.name.trim() 
    // });
    
    // if (existingSponsor) {
    //   return res.status(409).json({ success: false, message: 'Sponsor name already exists for this event.' });
    // }

    const sponsorData = { ...value };

    // Attach image file if exists
    if (req.file) {
      sponsorData.image = req.file.filename;
    }

    const sponsor = await eventSponsorService.createEventSponsor(sponsorData);

    const redis = await initRedis();
    await redis.del('event-sponsors:all*');
    await redis.del('home-sponsors');

    res.status(201).json({ success: true, message: 'Event sponsor created successfully.', data: sponsor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllEventSponsors = async (req, res) => {
  try {
    const {
      search = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      event,
      is_home
    } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (event) filters.event = event;
    if (is_home !== undefined) filters.is_home = is_home === 'true';

    if (req.user && req.user.type) {
          const admin = await Admin.findOne({ _id: req.user.id });
          if (!admin.isSuper_Admin) {
            const type = req.user.type;
            const event = await Event.findOne({ category: type });
            console.log("Event found:", event);
            filters.event = new mongoose.Types.ObjectId(event._id);
          }
        }

    const options = {
      search,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      filters,
    };

    const cacheKey = `event-sponsors:all:${JSON.stringify(options)}`;
    const redis = await initRedis();
    const cached = await redis.get(cacheKey);

    // if (cached) {
    //   return res.status(200).json({
    //     success: true,
    //     message: 'Event sponsors fetched successfully (from cache).',
    //     ...JSON.parse(cached),
    //     fromCache: true
    //   });
    // }

    const sponsors = await eventSponsorService.getAllEventSponsors(options);

    await redis.setEx(cacheKey, 300, JSON.stringify(sponsors)); // 5 minutes cache

    res.status(200).json({
      success: true,
      message: 'Event sponsors fetched successfully.',
      ...sponsors
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getEventSponsorById = async (req, res) => {
  try {
    const { sponsorId } = req.params;
    const cacheKey = `event-sponsor:${sponsorId}`;
    const redis = await initRedis();
    const cached = await redis.get(cacheKey);

    // if (cached) {
    //   return res.status(200).json({ 
    //     success: true, 
    //     message: "Event sponsor fetched successfully from cache.", 
    //     data: JSON.parse(cached), 
    //     fromCache: true 
    //   });
    // }

    const sponsor = await eventSponsorService.getEventSponsorById(sponsorId);

    if (!sponsor) {
      return res.status(404).json({ success: false, message: "Event sponsor not found" });
    }

    await redis.setEx(cacheKey, 300, JSON.stringify(sponsor)); // Cache for 5 minutes

    res.status(200).json({ 
      success: true, 
      message: "Event sponsor fetched successfully.", 
      data: sponsor 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateEventSponsor = async (req, res) => {
  try {
    const { sponsorId } = req.params;

    const { error, value } = eventSponsorUpdateValidator.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: error.details });
    }

    // Check if sponsor name is being updated & if duplicate exists
    // if (value.name && value.event) {
    //   const existingSponsor = await eventSponsorService.findOne({ 
    //     event: value.event, 
    //     name: value.name.trim() 
    //   });
    //   if (existingSponsor && existingSponsor._id.toString() !== sponsorId) {
    //     return res.status(409).json({ success: false, message: 'Sponsor name already exists for this event.' });
    //   }
    // }

    const sponsorData = { ...value };

    // Attach image file if exists
    if (req.file) {
      sponsorData.image = req.file.filename;
    }

    const updated = await eventSponsorService.updateEventSponsor(sponsorId, sponsorData);

    const redis = await initRedis();
    await redis.del('event-sponsors:all*');
    await redis.del(`event-sponsor:${sponsorId}`);
    await redis.del('home-sponsors');

    res.status(200).json({ success: true, message: 'Event sponsor updated successfully.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteEventSponsor = async (req, res) => {
  try {
    const { sponsorId } = req.params;
    const deleted = await eventSponsorService.deleteEventSponsor(sponsorId);

    const redis = await initRedis();
    await redis.del('event-sponsors:all*');
    await redis.del(`event-sponsor:${sponsorId}`);
    await redis.del('home-sponsors');

    res.status(200).json({ success: true, message: "Event sponsor deleted", data: deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getHomeSponsor = async (req, res) => {
  try {
    const cacheKey = 'home-sponsors';
    const redis = await initRedis();
    const cached = await redis.get(cacheKey);

    // if (cached) {
    //   return res.status(200).json({
    //     success: true,
    //     message: 'Home sponsors fetched successfully (from cache).',
    //     data: JSON.parse(cached),
    //     fromCache: true
    //   });
    // }

    const homeSponsors = await eventSponsorService.getHomeSponsor();

    // Cache the result even if it's an empty array
    await redis.setEx(cacheKey, 300, JSON.stringify(homeSponsors)); // Cache for 5 minutes

    res.status(200).json({
      success: true,
      message: homeSponsors.length > 0 ? 'Home sponsors fetched successfully.' : 'No home sponsors found.',
      data: homeSponsors
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};