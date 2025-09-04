import express from 'express';
import { createBooking, getBookingById, getAllBookings, exportBookingLogsExcel, exportScanLogsExcel, getBookingsByCategory, createBookingAsAdmin, updateBooking, getBookingCount, verifyBooking, transferTicket, exportTransferLogsExcel, getTransferLogs, getDashboardAnalytics, exportAllBookingsExcel, listInvoices, downloadInvoice } from '../controllers/bookingController.js';
import { getUserWalletHistory, getAdminWalletHistory,getAdminWalletHistoryByUser,getWalletBalance} from '../controllers/walletController.js';
import { upload } from '../middlewares/upload-middleware.js';
import passport from 'passport';
import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import { isAdmin } from '../middlewares/roleMiddleware.js';
import { get } from 'http';
import checkPermission from '../middlewares/checkPermission.js';
import bookingService from '../service/bookingService.js';

const BookRouter = express.Router();

BookRouter.post(
  "/create",
  accessTokenAutoRefresh,
  upload.fields([
    { name: "profile_photo", maxCount: 1 },
    { name: "aadhar_card", maxCount: 1 },
  ]),
  createBooking
);

//listinvoices for user
BookRouter.get(
  '/invoices',
  accessTokenAutoRefresh,
  // passport.authenticate('jwt', { session: false }),
  listInvoices
);

//download invoice
BookRouter.get(
  '/download-invoice/:id',
  accessTokenAutoRefresh, 
  downloadInvoice
);

  BookRouter.post(
  '/createBooking',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  checkPermission('Booking', 'create'),
  createBookingAsAdmin 
);

BookRouter.post(
  '/transferTicket',
  accessTokenAutoRefresh,
  transferTicket
);
BookRouter.put(
  '/update/:id',
  accessTokenAutoRefresh,
  upload.fields([
    { name: 'profile_photo', maxCount: 1 },
    { name: 'aadhar_card', maxCount: 1 },
  ]),
  updateBooking
);


BookRouter.put(
  '/verify/:bookingId',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  // checkPermission('Booking', 'update'),
  verifyBooking
);

BookRouter.get('/scanlogs/export/excel', exportScanLogsExcel);

BookRouter.get('/export/excel', exportBookingLogsExcel);

BookRouter.get('/export-transfer-logs', exportTransferLogsExcel);

BookRouter.get(
  "/ticket-transfer-logs",
   accessTokenAutoRefresh,
  getTransferLogs
);

// BookRouter.get('/dashboard-analytics', getDashboardAnalytics);

BookRouter.get(
  "/dashboard-analytics",
  accessTokenAutoRefresh,
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  getDashboardAnalytics
);

BookRouter.get('/get-wallet-balance',
  accessTokenAutoRefresh,
  getWalletBalance
);
BookRouter.get('/:id', getBookingById);
BookRouter.get('/',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  checkPermission('Booking', 'read'),
   getAllBookings);
BookRouter.get('/category/:categoryId',
  accessTokenAutoRefresh,
  getBookingsByCategory);
//get booking count date and type wise
BookRouter.get('/getBookingCount/:eventId', getBookingCount);

BookRouter.post(
  '/bulkImportExcel',
  // accessTokenAutoRefresh,
  upload.single('excel'),
  async (req, res) => {
    try {
      const result = await bookingService.bulkImportFromExcel(req.file.path);
      res.json({ success: true, imported: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

BookRouter.get(
  "/wallet/history",
  accessTokenAutoRefresh,
  getUserWalletHistory
);

BookRouter.get(
  "/admin/wallet/history",
  accessTokenAutoRefresh,
  passport.authenticate("jwt", { session: false }),
  isAdmin, 
  getAdminWalletHistory
);

BookRouter.get(
  "/admin/wallet/history/:userId",
  accessTokenAutoRefresh,
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  getAdminWalletHistoryByUser
);

BookRouter.get(
  '/export/all-bookings',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  checkPermission('Booking', 'read'),
  exportAllBookingsExcel
);




export default BookRouter;
