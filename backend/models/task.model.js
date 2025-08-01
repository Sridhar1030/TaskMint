import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    deadline: {
        type: Date,
        default: null
    },
    estimatedTime: {
        type: String,
        trim: true,
        default: ''
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date,
        default: null
    },
    userId: {
        type: String,
        required: true
    },
    userType: {
        type: String,
        enum: ['custom', 'gmail'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient queries
taskSchema.index({ userId: 1, userType: 1 });
taskSchema.index({ completed: 1 });
taskSchema.index({ createdAt: -1 });

const Task = mongoose.model('Task', taskSchema);

export default Task; 