import { asyncHandler } from "../utils/asyncHandler.js";
import dotenv from "dotenv";
import Task from "../models/task.model.js";

dotenv.config();

// Send extracted text to LangFlow API
const sendToLangFlow = asyncHandler(async (req, res) => {
	const {
		extractedText,
		sessionId = "user_1",
		userId,
		userType = "gmail",
	} = req.body;
	console.log(extractedText);

	if (!extractedText) {
		return res.status(400).json({
			success: false,
			message: "extractedText is required",
		});
	}

	// Get API key from environment variable
	if (!process.env.LANGFLOW_API_KEY) {
		return res.status(500).json({
			success: false,
			message:
				"LANGFLOW_API_KEY environment variable not found. Please set your API key in the environment variables.",
		});
	}
	console.log(process.env.LANGFLOW_API_KEY);

	const payload = {
		input_value: extractedText,
		output_type: "chat",
		input_type: "chat",
		// "session_id": sessionId
	};

	const options = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.LANGFLOW_API_KEY}`,
		},
		body: JSON.stringify(payload),
	};

	try {
		const response = await fetch(
			"https://api.langflow.astra.datastax.com/lf/95a48fd4-e2ec-4849-a8d3-979fcdec7e2e/api/v1/run/678959f3-6d40-4c53-aa2c-afed0c0a1c9d",
			options
		);

		if (!response.ok) {
			throw new Error(
				`LangFlow API responded with status: ${response.status}`
			);
		}

		const data = await response.json();
        console.log("LangFlow API Response:");
        console.dir(data, { depth: null, colors: true });
        
		// --- Extract and save tasks ---
		let savedTasks = [];
		console.log("preparing to save tasks");
		try {
			// Navigate to the text field containing the JSON array using the correct path
			const text = data?.outputs?.[0]?.outputs?.[0]?.outputs?.message?.message;
			console.log("Extracted text:", text);
			if (text) {
				// Remove code block markers if present
				const jsonString = text.replace(/^```json|```$/g, "").trim();
				const tasksArray = JSON.parse(jsonString);
				if (Array.isArray(tasksArray)) {
					for (const taskObj of tasksArray) {
						// Map and sanitize fields for Task model
						const newTask = new Task({
							title: taskObj.title,
							description: taskObj.description || "",
							deadline: taskObj.deadline
								? new Date(taskObj.deadline)
								: null,
							estimatedTime: taskObj.estimatedTime || "",
							priority: [
								"low",
								"medium",
								"high",
								"urgent",
							].includes((taskObj.priority || "").toLowerCase())
								? taskObj.priority.toLowerCase()
								: "medium",
							userId,
							userType,
						});
						const saved = await newTask.save();
						console.log(saved);
						savedTasks.push(saved);
					}
				}
			}
		} catch (err) {
			console.error("Error parsing or saving tasks:", err);
		}
		// --- End extract and save ---

		res.status(200).json({
			success: true,
			message: "Text sent to LangFlow successfully",
			data: data,
			savedTasks,
		});
	} catch (error) {
		console.error("Error sending to LangFlow:", error);
		res.status(500).json({
			success: false,
			message: "Failed to send text to LangFlow",
			error: error.message,
		});
	}
});

const test = asyncHandler(async (req, res) => {
	res.status(200).json({
		success: true,
		message: "Test route is working",
	});
});

export { sendToLangFlow, test };
