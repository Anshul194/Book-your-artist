import transactionService from '../service/TransactionService.js';

export async function createTransaction(req, res) {
    try {
        const txn = await transactionService.createTransaction(req.body);
        res.status(201).json({ success: true, message: 'Payment success. QR generated.', data: txn });
    } catch (err) {
        console.log('error in createTransaction:', err?.message);
        res.status(400).json({ success: false, message: err.message });
    }
}
