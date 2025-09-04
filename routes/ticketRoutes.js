import express from 'express';
import {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  getTicketsByCategory
} from '../controllers/ticketController.js';

import passport from 'passport';
import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import { isAdmin } from '../middlewares/roleMiddleware.js';
import checkPermission from '../middlewares/checkPermission.js';
import checkOriginForAdmin from '../middlewares/checkOriginForAdmin.js';

const router = express.Router();

// Public
router.get('/',
  checkOriginForAdmin,
  getAllTickets);
router.get('/:ticketId', getTicketById);
router.get('/category/:categoryId/:eventId', getTicketsByCategory);

// Admin Only
router.post(
  '/',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  checkPermission('Ticket', 'create'),
  createTicket
);

router.put(
  '/:ticketId',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  checkPermission('Ticket', 'update'),
  updateTicket
);

router.delete(
  '/:ticketId',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  checkPermission('Ticket', 'delete'),
  deleteTicket
);

export default router;
