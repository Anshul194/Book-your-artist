import ZoneService from '../service/zoneService.js';
import { initRedis } from '../config/redisClient.js';

const zoneService = new ZoneService();

export const createZone = async (req, res) => {
  try {
    let zoneData = req.body;

    if (req.file) {
      zoneData.image = req.file.path || req.file.filename || req.file.url;
    }

    const zone = await zoneService.createZone(zoneData);

    // Invalidate zone list cache
    const redis = await initRedis();
    await redis.del('zones:all*');

    res.status(201).json({ success: true, message: 'Zone created successfully.', data: zone });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllZones = async (req, res) => {
  try {
    const redis = await initRedis();

    const cacheKey = `zones:all:${JSON.stringify(req.query)}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.status(200).json({
        success: true,
        message: 'Zones fetched successfully (from cache).',
        ...JSON.parse(cached),
        fromCache: true
      });
    }

    const zones = await zoneService.getAllZones(req.query);

    await redis.setEx(cacheKey, 300, JSON.stringify(zones)); // Cache for 5 min

    res.status(200).json({ success: true, message: 'Zones fetched successfully.', ...zones });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getZoneById = async (req, res) => {
  try {
    const redis = await initRedis();
    const cacheKey = `zone:${req.params.zoneId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.status(200).json({
        success: true,
        message: 'Zone fetched successfully (from cache).',
        data: JSON.parse(cached),
        fromCache: true
      });
    }

    const zone = await zoneService.getZoneById(req.params.zoneId);
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });

    await redis.setEx(cacheKey, 300, JSON.stringify(zone)); // 5 minutes

    res.status(200).json({ success: true, message: 'Zone fetched successfully.', data: zone });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateZone = async (req, res) => {
  try {
    const updated = await zoneService.updateZone(req.params.zoneId, req.body);

    const redis = await initRedis();
    await redis.del('zones:all*');
    await redis.del(`zone:${req.params.zoneId}`);

    res.status(200).json({ success: true, message: 'Zone updated successfully.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteZone = async (req, res) => {
  try {
    const deleted = await zoneService.deleteZone(req.params.zoneId);

    const redis = await initRedis();
    await redis.del('zones:all*');
    await redis.del(`zone:${req.params.zoneId}`);

    res.status(200).json({ success: true, message: 'Zone deleted successfully.', data: deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
