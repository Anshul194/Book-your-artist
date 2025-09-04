import GalleryImageService  from '../service/galleryImageService.js';
import { initRedis } from '../config/redisClient.js';
import { galleryImageCreateValidator, galleryImageUpdateValidator } from '../validations/galleryImageValidation.js';

const galleryImageService = new GalleryImageService();

export const creategalleryImage = async (req, res) => {
  try {
    const { error, value } = galleryImageCreateValidator.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: error.details });
    }

    // Check if gallery image already exists for this event
    const existinggalleryImage = await galleryImageService.findOne({ event: value.event });
    
    if (existinggalleryImage) {
      return res.status(409).json({ success: false, message: 'gallery image already exists for this event.' });
    }

    const galleryImageData = { ...value };

    // Attach image files if exist
    if (req.files && req.files.length > 0) {
      galleryImageData.images = req.files.map(file => file.filename);
    } else if (!galleryImageData.images || galleryImageData.images.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one image is required.' });
    }

    const galleryImage = await galleryImageService.creategalleryImage(galleryImageData);

    const redis = await initRedis();
    await redis.del('gallery-images:all*');

    res.status(201).json({ success: true, message: 'gallery image created successfully.', data: galleryImage });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllgalleryImages = async (req, res) => {
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

    const options = {
      search,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      filters,
    };

    const cacheKey = `gallery-images:all:${JSON.stringify(options)}`;
    const redis = await initRedis();
    const cached = await redis.get(cacheKey);

    // if (cached) {
    //   return res.status(200).json({
    //     success: true,
    //     message: 'gallery images fetched successfully (from cache).',
    //     ...JSON.parse(cached),
    //     fromCache: true
    //   });
    // }

    const galleryImages = await galleryImageService.getAllgalleryImages(options);

    await redis.setEx(cacheKey, 300, JSON.stringify(galleryImages)); // 5 minutes cache

    res.status(200).json({
      success: true,
      message: 'gallery images fetched successfully.',
      ...galleryImages
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getgalleryImageById = async (req, res) => {
  try {
    const { galleryImageId } = req.params;
    const cacheKey = `gallery-image:${galleryImageId}`;
    const redis = await initRedis();
    const cached = await redis.get(cacheKey);

    // if (cached) {
    //   return res.status(200).json({ 
    //     success: true, 
    //     message: "gallery image fetched successfully from cache.", 
    //     data: JSON.parse(cached), 
    //     fromCache: true 
    //   });
    // }

    const galleryImage = await galleryImageService.getgalleryImageById(galleryImageId);

    if (!galleryImage) {
      return res.status(404).json({ success: false, message: "gallery image not found" });
    }

    await redis.setEx(cacheKey, 300, JSON.stringify(galleryImage)); // Cache for 5 minutes

    res.status(200).json({ 
      success: true, 
      message: "gallery image fetched successfully.", 
      data: galleryImage 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updategalleryImage = async (req, res) => {
  try {
    const { galleryImageId } = req.params;

    const { error, value } = galleryImageUpdateValidator.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: error.details });
    }

    const galleryImageData = { ...value };

    // Attach new image files if exist
    if (req.files && req.files.length > 0) {
      galleryImageData.images = req.files.map(file => file.filename);
    }

    const updated = await galleryImageService.updategalleryImage(galleryImageId, galleryImageData);

    const redis = await initRedis();
    await redis.del('gallery-images:all*');
    await redis.del(`gallery-image:${galleryImageId}`);

    res.status(200).json({ success: true, message: 'gallery image updated successfully.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deletegalleryImage = async (req, res) => {
  try {
    console.log("Deleting gallery image with ID:", req.params.galleryImageId);
    
    const { galleryImageId } = req.params;
    const deleted = await galleryImageService.deletegalleryImage(galleryImageId);

    // 🛑 Check if nothing was deleted
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Gallery image not found" });
    }

    const redis = await initRedis();
    await redis.del('gallery-images:all*');
    await redis.del(`gallery-image:${galleryImageId}`);

    res.status(200).json({ success: true, message: "Gallery image deleted", data: deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

