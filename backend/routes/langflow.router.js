import express from 'express';
import { sendToLangFlow, test } from '../controllers/langflow.controller.js';
// import { } from '../middlewares/auth.middlewares.js';

const langflowRouter = express.Router();

// Send extracted text to LangFlow
langflowRouter.post('/send-text', sendToLangFlow);
langflowRouter.post('/test', test);

export { langflowRouter }; 