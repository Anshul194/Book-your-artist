// routes/garbaClassRoutes.js
import express from 'express';
import {
  createGarbaClass,
  getAllGarbaClasses,
  getAllGarbaClasses_admin,
  getGarbaClassById,
  updateGarbaClass,
  deleteGarbaClass,
  getAllZones,
  getKhaliyaPriceByZone
} from '../controllers/garbaClassController.js';

import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import passport from 'passport';
import { isAdmin } from '../middlewares/roleMiddleware.js';
import { upload } from '../middlewares/upload-middleware.js';
import checkPermission from '../middlewares/checkPermission.js';
import checkOriginForAdmin from '../middlewares/checkOriginForAdmin.js';

const garbaClassRouter = express.Router();

// 🔓 Public
garbaClassRouter.get('/zones', getAllZones);

//app
garbaClassRouter.get('/', getAllGarbaClasses);

//admin
garbaClassRouter.get('/get-all', 
  checkOriginForAdmin, 
  getAllGarbaClasses_admin);
garbaClassRouter.get('/:id', getGarbaClassById);
garbaClassRouter.get('/khaliyaPriceByZone/:eventId/:typeId', getKhaliyaPriceByZone);

// 🔒 Admin Protected

garbaClassRouter.post(
  '/',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  checkPermission('User', 'create'),
  upload.single('profilePic'),
  createGarbaClass
);

garbaClassRouter.put(
  '/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  checkPermission('User', 'update'),
  upload.single('profilePic'),
  updateGarbaClass
);

garbaClassRouter.delete(
  '/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  checkPermission('User', 'delete'),
  deleteGarbaClass
);




export default garbaClassRouter;
