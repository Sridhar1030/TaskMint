const API_BASE_URL = import.meta.env.VITE_API;

// Common API request function
export const apiRequest = async (endpoint, options = {}) => {
	const url = `${API_BASE_URL}${endpoint}`;

	const defaultOptions = {
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include", // Include cookies for JWT tokens
	};

	const config = {
		...defaultOptions,
		...options,
		headers: {
			...defaultOptions.headers,
			...options.headers,
		},
	};

	try {
		const response = await fetch(url, config);
		const data = await response.json();

		if (!response.ok) {
			throw new Error(
				data.message || `HTTP error! status: ${response.status}`
			);
		}

		return data;
	} catch (error) {
		console.error("API request failed:", error);
		throw error;
	}
};

// Auth API functions
export const authAPI = {
	login: async (credentials) => {
		return apiRequest("/login", {
			method: "POST",
			body: JSON.stringify(credentials),
		});
	},

	register: async (userData) => {
		return apiRequest("/register", {
			method: "POST",
			body: JSON.stringify(userData),
		});
	},

	logout: async () => {
		return apiRequest("/logout", {
			method: "GET",
		});
	},
};

// Token management
export const tokenManager = {
	setToken: (token) => {
		localStorage.setItem("accessToken", token);
	},

	getToken: () => {
		return localStorage.getItem("accessToken");
	},

	removeToken: () => {
		localStorage.removeItem("accessToken");
	},

	setUser: (user) => {
		localStorage.setItem("user", JSON.stringify(user));
	},

	getUser: () => {
		const user = localStorage.getItem("user");
		return user ? JSON.parse(user) : null;
	},

	removeUser: () => {
		localStorage.removeItem("user");
	},

	clearAuth: () => {
		localStorage.removeItem("accessToken");
		localStorage.removeItem("user");
	},
};
