import Transaction from '../models/Transaction.js';

class TransactionRepository {
  async create(data) {
    return await Transaction.create(data);
  }

  async findById(id) {
    return await Transaction.findById(id).populate('booking_id');
  }
}

export default new TransactionRepository();
