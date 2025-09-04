import express from 'express';
import {
  creategalleryImage,
  getAllgalleryImages,
  getgalleryImageById,
  updategalleryImage,
  deletegalleryImage
} from '../controllers/galleryImageController.js';

import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import passport from 'passport';
import { isAdmin } from '../middlewares/roleMiddleware.js';
import { upload } from '../middlewares/upload-middleware.js';
import checkPermission from '../middlewares/checkPermission.js';

const galleryImageRouter = express.Router();

// 🔓 Public routes
galleryImageRouter.get('/', getAllgalleryImages);
galleryImageRouter.get('/:galleryImageId', getgalleryImageById);

// 🔒 Protected routes (Admin only)

// Create Cover Image
galleryImageRouter.post(
  '/',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  checkPermission('Events', 'create'),
  upload.array('images', 10), // Allow up to 10 images
  creategalleryImage
);

// Update Cover Image
galleryImageRouter.put(
  '/:galleryImageId',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  checkPermission('Events', 'update'),
  upload.array('images', 10), // Allow up to 10 images
  updategalleryImage
);

// Delete Cover Image
galleryImageRouter.delete(
  '/:galleryImageId',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  checkPermission('Events', 'delete'),
  deletegalleryImage
);

export default galleryImageRouter;