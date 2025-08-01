import express from 'express';
import {
    createTask,
    getTasks,
    updateTask,
    deleteTask,
    parseVoiceInput,
    getTaskAnalytics
} from '../controllers/task.controller.js';

const taskRouter = express.Router();

// Create a new task
taskRouter.post('/', createTask);

// Get all tasks for a user
taskRouter.get('/', getTasks);

// Update a task
taskRouter.patch('/:id', updateTask);

// Delete a task
taskRouter.delete('/:id', deleteTask);

// Parse voice input
taskRouter.post('/parse-voice', parseVoiceInput);

// Get task analytics
taskRouter.get('/analytics', getTaskAnalytics);

export { taskRouter };