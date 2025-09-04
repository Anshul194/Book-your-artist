import express from 'express';
import {createTransaction} from '../controllers/TransactionController.js';

const TransactionRouter = express.Router();

TransactionRouter.post('/create', createTransaction);

export default TransactionRouter;