import Task from "../models/task.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// Create a new task
const createTask = asyncHandler(async (req, res) => {
	console.log(req.body);
	const {
		title,
		description,
		deadline,
		estimatedTime,
		priority,
		userId,
		userType,
	} = req.body;
	if (!title || !userId || !userType) {
		return res.status(400).json({
			success: false,
			message: "Title, userId, and userType are required",
		});
	}

	const task = await Task.create({
		title,
		description: description || "",
		deadline: deadline || null,
		estimatedTime: estimatedTime || "",
		priority: priority || "medium",
		userId,
		userType,
	});

	res.status(201).json({
		success: true,
		message: "Task created successfully",
		task,
	});
});

// Get all tasks for a user
const getTasks = asyncHandler(async (req, res) => {
	const { userId, userType } = req.query;

	if (!userId || !userType) {
		return res.status(400).json({
			success: false,
			message: "userId and userType are required",
		});
	}

	const tasks = await Task.find({ userId, userType }).sort({ createdAt: -1 });

	res.status(200).json({
		success: true,
		tasks,
	});
});

// Update a task
const updateTask = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const updateData = req.body;

	// Check if task is being marked as completed
	if (updateData.completed === true) {
		// Get current task to check if it wasn't already completed
		const currentTask = await Task.findById(id);
		if (currentTask && !currentTask.completed) {
			updateData.completedAt = new Date();
		}
	} else if (updateData.completed === false) {
		// If task is being marked as incomplete, remove completedAt
		updateData.completedAt = null;
	}

	const task = await Task.findByIdAndUpdate(
		id,
		{ ...updateData, updatedAt: Date.now() },
		{ new: true, runValidators: true }
	);

	if (!task) {
		return res.status(404).json({
			success: false,
			message: "Task not found",
		});
	}

	res.status(200).json({
		success: true,
		message: "Task updated successfully",
		task,
	});
});

// Delete a task
const deleteTask = asyncHandler(async (req, res) => {
	const { id } = req.params;

	const task = await Task.findByIdAndDelete(id);

	if (!task) {
		return res.status(404).json({
			success: false,
			message: "Task not found",
		});
	}

	res.status(200).json({
		success: true,
		message: "Task deleted successfully",
	});
});

// Parse voice input using OpenAI
const parseVoiceInput = asyncHandler(async (req, res) => {
	const { transcript, userId, userEmail, userType } = req.body;
	console.log("Voice input data:", {
		transcript,
		userId,
		userEmail,
		userType,
	});

	if (!transcript) {
		return res.status(400).json({
			success: false,
			message: "Transcript is required",
		});
	}

	try {
		const prompt = `
                You are an assistant that breaks down voice inputs into multiple structured task JSON objects.
                Today is ${new Date().toISOString().split('T')[0]}
                Instructions:
                - Split the voice input into multiple distinct tasks, if applicable.
                - For each task, extract:
                - title: A clear, actionable title.
                - deadline: (format YYYY-MM-DDTHH:MM) if mentioned like today tommorow ....else if not mentioned any time make it a week from today.
                - estimatedTime: (e.g. "2 hours") if mentioned; else empty string.
                - priority: Based on urgency words ("low", "medium", "high", or "urgent").
                - description: Any context or details.
                - If a field is not found, leave it empty or null.

                Voice input: "${transcript}"

                Return a JSON array of task objects, like:
                [
                {
                    "title": "Practice DSA",
                    "deadline": "2025-08-01T20:00",
                    "estimatedTime": "2 hours",
                    "priority": "high",
                    "description": "For upcoming placement drive"
                },
                {
                    "title": "Finish internship work",
                    "deadline": "",
                    "estimatedTime": "",
                    "priority": "medium",
                    "description": ""
                },
                {
                    "title": "Complete college assignment",
                    "deadline": "",
                    "estimatedTime": "",
                    "priority": "medium",
                    "description": "Due this week"
                }
                ]
`;

		const completion = await openai.chat.completions.create({
			model: "gpt-3.5-turbo",
			messages: [
				{
					role: "system",
					content:
						"You are a task parsing assistant. Extract structured task information from natural language input.",
				},
				{
					role: "user",
					content: prompt,
				},
			],
			temperature: 0.3,
			max_tokens: 300,
		});

		const responseText = completion.choices[0].message.content;
		let parsedTasks = [];

		try {
			parsedTasks = JSON.parse(responseText);
			if (!Array.isArray(parsedTasks))
				throw new Error("Expected an array");
		} catch (err) {
			console.error("Invalid OpenAI response format:", err);
			return res
				.status(500)
				.json({ success: false, message: "Invalid response from AI" });
		}

		const savedTasks = [];

		for (const taskData of parsedTasks) {
			const cleaned = {
				title: taskData.title || transcript,
				deadline: taskData.deadline || "",
				estimatedTime: taskData.estimatedTime || "",
				priority: ["low", "medium", "high", "urgent"].includes(
					taskData.priority
				)
					? taskData.priority
					: "medium",
				description: taskData.description || "",
				userId,
				userType,
			};

			const saved = await Task.create(cleaned);
			savedTasks.push(saved);
		}
        console.log(savedTasks)

		res.status(201).json({
            success: true,
            message: 'Tasks created from voice input',
            tasks: savedTasks
        });
	} catch (error) {
		console.error("OpenAI API error:", error);
		res.status(500).json({
			success: false,
			message: "Error processing voice input",
		});
	}
});

// Get task analytics for a user
const getTaskAnalytics = asyncHandler(async (req, res) => {
	const { userId, userType } = req.query;

	if (!userId || !userType) {
		return res.status(400).json({
			success: false,
			message: "userId and userType are required",
		});
	}

	try {
		// Get all tasks for the user
		const allTasks = await Task.find({ userId, userType }).sort({ createdAt: 1 });
		const completedTasks = allTasks.filter(task => task.completed && task.completedAt);

		// Calculate completion time for each completed task
		const tasksWithCompletionTime = completedTasks.map(task => {
			const createdDate = new Date(task.createdAt);
			const completedDate = new Date(task.completedAt);
			const completionTimeHours = (completedDate - createdDate) / (1000 * 60 * 60);
			
			return {
				...task.toObject(),
				completionTimeHours: Math.round(completionTimeHours * 100) / 100
			};
		});

		// Group tasks by completion date for timeline
		const completionTimeline = {};
		tasksWithCompletionTime.forEach(task => {
			const date = new Date(task.completedAt).toDateString();
			if (!completionTimeline[date]) {
				completionTimeline[date] = 0;
			}
			completionTimeline[date]++;
		});

		// Group tasks by priority for completion analysis
		const priorityAnalysis = {
			low: { total: 0, completed: 0 },
			medium: { total: 0, completed: 0 },
			high: { total: 0, completed: 0 },
			urgent: { total: 0, completed: 0 }
		};

		allTasks.forEach(task => {
			priorityAnalysis[task.priority].total++;
			if (task.completed) {
				priorityAnalysis[task.priority].completed++;
			}
		});

		// Calculate average completion time
		const avgCompletionTime = tasksWithCompletionTime.length > 0 
			? tasksWithCompletionTime.reduce((sum, task) => sum + task.completionTimeHours, 0) / tasksWithCompletionTime.length
			: 0;

		// Create monthly completion data for the last 6 months
		const monthlyData = {};
		const now = new Date();
		for (let i = 5; i >= 0; i--) {
			const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
			monthlyData[monthKey] = { created: 0, completed: 0 };
		}

		allTasks.forEach(task => {
			const createdMonth = new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
			if (monthlyData[createdMonth]) {
				monthlyData[createdMonth].created++;
			}
			
			if (task.completed && task.completedAt) {
				const completedMonth = new Date(task.completedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
				if (monthlyData[completedMonth]) {
					monthlyData[completedMonth].completed++;
				}
			}
		});

		const analytics = {
			totalTasks: allTasks.length,
			completedTasks: completedTasks.length,
			completionRate: allTasks.length > 0 ? (completedTasks.length / allTasks.length * 100).toFixed(1) : 0,
			avgCompletionTimeHours: Math.round(avgCompletionTime * 100) / 100,
			priorityAnalysis,
			monthlyData: Object.entries(monthlyData).map(([month, data]) => ({
				month,
				...data
			})),
			completionTimeline: Object.entries(completionTimeline).map(([date, count]) => ({
				date,
				count
			})).sort((a, b) => new Date(a.date) - new Date(b.date)),
			recentCompletions: tasksWithCompletionTime
				.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
				.slice(0, 10)
		};

		res.status(200).json({
			success: true,
			analytics
		});
	} catch (error) {
		console.error('Error getting task analytics:', error);
		res.status(500).json({
			success: false,
			message: "Error fetching task analytics"
		});
	}
});

export { createTask, getTasks, updateTask, deleteTask, parseVoiceInput, getTaskAnalytics };
