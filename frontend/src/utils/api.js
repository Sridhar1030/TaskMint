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

	gmailAuth: async (gmailToken) => {
		return apiRequest("/gmail-auth", {
			method: "POST",
			body: JSON.stringify({ gmailToken }),
		});
	},

	getUserInfo: async (gmailToken) => {
		try {
			const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
				headers: {
					Authorization: `Bearer ${gmailToken}`,
				},
				
			});
			if (!response.ok) {
				throw new Error('Failed to get user info from Gmail');
			}
			localStorage.setItem("gmail_user_id", response.sub);
			console.log(response)
			return await response.json();
		} catch (error) {
			console.error('Error getting Gmail user info:', error);
			throw error;
		}
	}
};

// LangFlow API functions
export const langflowAPI = {
	
	
	sendText: async (extractedText) => {
		const gmailToken = tokenManager.getGmailToken();
		let userId;

		if (gmailToken) {
			try {
				const userInfo = await gmailAPI.getUserInfo(gmailToken);
				userId = userInfo.id;
			} catch (error) {
				console.error('Error getting Gmail user ID:', error);
				userId = localStorage.getItem("gmail_user_id");
			}
		}

		return apiRequest("/langflow/send-text", {
			method: "POST",
			
			body: JSON.stringify({ 
				extractedText,
				userId: userId || localStorage.getItem("gmail_user_id")
			}),
			headers: {
				"Authorization": `Bearer ${tokenManager.getToken()}`,
			},
		});
	},
};

export const gmailAPI = {
	getUserInfo: async (gmailToken) => {
		try {
			const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
				headers: {
					Authorization: `Bearer ${gmailToken}`,
				},
			});
			if (!response.ok) {
				throw new Error('Failed to get user info from Gmail');
			}
			const userInfo = await response.json();
			localStorage.setItem("gmail_user_id", userInfo.id);
			console.log('Gmail User Info:', userInfo);
			return userInfo;
		} catch (error) {
			console.error('Error getting Gmail user info:', error);
			throw error;
		}
	}
}

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

	clearAuth: () => {
		localStorage.removeItem("accessToken");
		localStorage.removeItem("user");
	},

	setGmailToken: (token) => {
		localStorage.setItem("gmail_access_token", token);
	},

	getGmailToken: () => {
		return localStorage.getItem("gmail_access_token");
	},

	removeGmailToken: () => {
		localStorage.removeItem("gmail_access_token");
	},

	clearAllAuth: () => {
		localStorage.removeItem("accessToken");
		localStorage.removeItem("user");
		localStorage.removeItem("gmail_access_token");
	}
};
