import QRCode from 'qrcode';
import transactionRepo from '../repository/TransactionRepository.js';
import bookingRepo from '../repository/bookingRepo.js';
import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
class TransactionService {

    async  createTransaction(data) {
    const booking = await bookingRepo.findById(data.booking_id);
    if (!booking) throw new Error('Booking not found');

    // const qrPayload = {
    //     user_id: booking.user_id,
    //     booking_id: booking._id,
    //     date: booking.date || 'khaliya',
    //     event: booking.eid,
    //     status: booking.booking_status,
    // };

    // const qr_code_base64 = await QRCode.toDataURL(JSON.stringify(qrPayload));

    // const fileName = `qr-${uuid()}.png`;
    // const imagePath = path.resolve('uploads/qrcodes', fileName); // ✅ absolute path
    // const base64Data = qr_code_base64.replace(/^data:image\/png;base64,/, '');

    // fs.writeFileSync(imagePath, base64Data, 'base64');
    // console.log('✅ QR code saved at:', imagePath);

    // const qr_code_url = `/uploads/qrcodes/${fileName}`;

    return await transactionRepo.create({
        ...data,
        total_amt: booking.subtotal,
    });
}




  async getTransaction(id) {
    return await transactionRepo.findById(id);
  }
}

export default new TransactionService();
