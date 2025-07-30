import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateAccessTokenAndRefreshToken = async (userId) => {
	try {
		const user = await User.findById(userId);

		// Generate access token and refresh token
		const accessToken = user.generateAccessToken();
		const refreshToken = user.generateRefreshToken();

		// Save the refresh token in the database
		user.refreshToken = refreshToken;
		await user.save({ validateBeforeSave: false });

		return { accessToken, refreshToken };
	} catch (error) {
		throw new Error(
			500,
			"Something went wrong while generating referesh and access token"
		);
	}
};

const registerUser = asyncHandler(async (req, res) => {
	const { fullName, email, password, username } = req.body;
	console.log(req.body);
	// Check if all fields are provided
	if (
		!fullName?.trim() ||
		!email?.trim() ||
		!password?.trim() ||
		!username?.trim()
	) {
		res.status(400);
		throw new Error("All fields are required");
	}

	// Check if user already exists
	const userExists = await User.findOne({ $or: [{ email }, { username }] });

	if (userExists) {
		res.status(400);
		throw new Error("User already exists");
	}

	// Create the new user
	const user = await User.create({ fullName, email, password, username });

	if (!user) {
		res.status(400);
		throw new Error("Invalid user data");
	}

	// Remove sensitive fields before sending response
	const userData = user.toObject();
	delete userData.password;
	delete userData.refreshToken;

	res.status(201).json({
		message: "User registered successfully",
		user: userData,
	});
});

const loginUser = asyncHandler(async (req, res) => {
	const { email, username, password } = req.body;

	// Check if all fields are provided
	if ((!email && !username) || !password) {
		res.status(400);
		throw new Error("All fields are required");
	}

	// Find user by email or username
	let user;
	if (email) {
		user = await User.findOne({ email });
		if (!user) {
			res.status(404);
			throw new Error("Email not found");
		}
	} else if (username) {
		user = await User.findOne({ username });
		if (!user) {
			res.status(404);
			throw new Error("Username not found");
		}
	}

	// Check if password is correct
	const isPasswordCorrect = await user.checkPassword(password);

	if (!isPasswordCorrect) {
		res.status(401);
		throw new Error("Invalid credentials");
	}

	// Generate access token and refresh token
	const { accessToken, refreshToken } =
		await generateAccessTokenAndRefreshToken(user._id);

	// Remove sensitive fields before sending response
	const userData = user.toObject();
	delete userData.password;
	delete userData.refreshToken;

	const options = {
		httpOnly: true,
		secure: true,
	};

	return res
		.status(200)
		.cookie("refreshToken", refreshToken, options)
		.cookie("accessToken", accessToken, options)
		.json({
			message: "User logged in successfully",
			user: userData,
			accessToken,
		});
});

const logoutUser = asyncHandler(async (req, res) => {
	await User.findByIdAndUpdate(
		req?.user?._id,
		{
			$unset: {
				refreshToken: 1,
			},
		},
		{
			new: true,
		}
	);

	const options = {
		httpOnly: true,
		secure: true,
	};

	return res
		.status(200)
		.clearCookie("refreshToken", options)
		.clearCookie("accessToken", options)
		.json({
			message: "User logged out successfully",
		});
});

const gmailAuth = asyncHandler(async (req, res) => {
	const { gmailToken } = req.body;

	if (!gmailToken) {
		res.status(400);
		throw new Error("Gmail token is required");
	}

	try {
		// Get user info from Google
		const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
			headers: {
				Authorization: `Bearer ${gmailToken}`,
			},
		});

		if (!response.ok) {
			res.status(401);
			throw new Error("Invalid Gmail token");
		}

		const userInfo = await response.json();
		const email = userInfo.email;

		// Find or create user
		let user = await User.findOne({ email });

		if (!user) {
			// Create new user with Gmail info
			user = await User.create({
				email,
				userType: 'gmail',
				fullName: userInfo.name || email.split('@')[0],
				username: email.split('@')[0]
			});
		}

		// Generate tokens
		const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

		// Remove sensitive fields
		const userData = user.toObject();
		delete userData.password;
		delete userData.refreshToken;

		const options = {
			httpOnly: true,
			secure: true,
		};

		return res
			.status(200)
			.cookie("refreshToken", refreshToken, options)
			.cookie("accessToken", accessToken, options)
			.json({
				message: "Gmail authentication successful",
				user: userData,
				accessToken,
			});
	} catch (error) {
		res.status(error.status || 500);
		throw new Error(error.message || "Gmail authentication failed");
	}
});

export { registerUser, loginUser, logoutUser, gmailAuth };
