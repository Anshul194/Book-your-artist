import CoverImageService from '../service/coverImageService.js';
import { initRedis } from '../config/redisClient.js';
import { coverImageCreateValidator, coverImageUpdateValidator } from '../validations/coverImageValidation.js';
import Admin from '../models/admin.js';
import Event from '../models/Event.js'; // Assuming you have an Event model for fetching event details
import mongoose from 'mongoose';

const coverImageService = new CoverImageService();

export const createCoverImage = async (req, res) => {
  try {
    const { error, value } = coverImageCreateValidator.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: error.details });
    }

    // Check if cover image already exists for this event
    // const existingCoverImage = await coverImageService.findOne({ event: value.event });

    // if (existingCoverImage) {
    //   return res.status(409).json({ success: false, message: 'Cover image already exists for this event.' });
    // }

    const coverImageData = { ...value };

    // Attach image files if exist
    if (req.files && req.files.length > 0) {
      coverImageData.images = req.files.map(file => file.filename);
    } else if (!coverImageData.images || coverImageData.images.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one image is required.' });
    }

    const coverImage = await coverImageService.createCoverImage(coverImageData);

    const redis = await initRedis();
    await redis.del('cover-images:all*');

    res.status(201).json({ success: true, message: 'Cover image created successfully.', data: coverImage });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllCoverImages = async (req, res) => {
  try {
    const {
      search = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      event
    } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (event) filters.event = event;

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

    const cacheKey = `cover-images:all:${JSON.stringify(options)}`;
    const redis = await initRedis();
    const cached = await redis.get(cacheKey);

    // if (cached) {
    //   return res.status(200).json({
    //     success: true,
    //     message: 'Cover images fetched successfully (from cache).',
    //     ...JSON.parse(cached),
    //     fromCache: true
    //   });
    // }

    const coverImages = await coverImageService.getAllCoverImages(options);

    await redis.setEx(cacheKey, 300, JSON.stringify(coverImages)); // 5 minutes cache

    res.status(200).json({
      success: true,
      message: 'Cover images fetched successfully.',
      ...coverImages
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getCoverImageById = async (req, res) => {
  try {
    const { coverImageId } = req.params;
    const cacheKey = `cover-image:${coverImageId}`;
    const redis = await initRedis();
    const cached = await redis.get(cacheKey);

    // if (cached) {
    //   return res.status(200).json({ 
    //     success: true, 
    //     message: "Cover image fetched successfully from cache.", 
    //     data: JSON.parse(cached), 
    //     fromCache: true 
    //   });
    // }

    const coverImage = await coverImageService.getCoverImageById(coverImageId);

    if (!coverImage) {
      return res.status(404).json({ success: false, message: "Cover image not found" });
    }

    await redis.setEx(cacheKey, 300, JSON.stringify(coverImage)); // Cache for 5 minutes

    res.status(200).json({
      success: true,
      message: "Cover image fetched successfully.",
      data: coverImage
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateCoverImage = async (req, res) => {
  try {
    const { coverImageId } = req.params;

    const { error, value } = coverImageUpdateValidator.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: error.details });
    }

    const coverImageData = { ...value };

    // Attach new image files if exist
    if (req.files && req.files.length > 0) {
      coverImageData.images = req.files.map(file => file.filename);
    }

    const updated = await coverImageService.updateCoverImage(coverImageId, coverImageData);

    const redis = await initRedis();
    await redis.del('cover-images:all*');
    await redis.del(`cover-image:${coverImageId}`);

    res.status(200).json({ success: true, message: 'Cover image updated successfully.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteCoverImage = async (req, res) => {
  try {
    const { coverImageId } = req.params;
    const deleted = await coverImageService.deleteCoverImage(coverImageId);

    const redis = await initRedis();
    await redis.del('cover-images:all*');
    await redis.del(`cover-image:${coverImageId}`);

    res.status(200).json({ success: true, message: "Cover image deleted", data: deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
