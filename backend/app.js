import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config({
	path: "./.env",
});

const app = express();

// ✅ Proper CORS config
app.use(
	cors({
		origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
	})
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

import { userRouter } from "./routes/user.router.js";
import { taskRouter } from "./routes/task.router.js";
import { langflowRouter } from "./routes/langflow.router.js";

app.use("/api/v1/auth", userRouter);
app.use("/api/tasks", taskRouter);
app.use("/langflow", langflowRouter);

// test route
app.get("/", (req, res) => {
	res.send("TaskMint API is running!");
});

// health check route
app.get("/api/v1/health", (req, res) => {
	res.json({ 
		status: "OK", 
		message: "TaskMint API is healthy",
		timestamp: new Date().toISOString()
	});
});

export { app };
