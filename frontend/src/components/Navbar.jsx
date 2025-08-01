import { useNavigate } from 'react-router-dom';
import { tokenManager, authAPI } from '../utils/api';
import { useState, useEffect } from 'react';
import axios from 'axios';

const Navbar = () => {
    const navigate = useNavigate();
    const customUser = tokenManager.getUser();
    const [googleUser, setGoogleUser] = useState(null);

    // Check for Google authentication
    useEffect(() => {
        const checkGoogleAuth = async () => {
            const gmailToken = localStorage.getItem('gmail_access_token');
            if (gmailToken) {
                try {
                    const response = await axios.get(
                        'https://www.googleapis.com/oauth2/v2/userinfo',
                        {
                            headers: {
                                Authorization: `Bearer ${gmailToken}`,
                            },
                        }
                    );
                    setGoogleUser(response.data);
                } catch (error) {
                    console.error('Error fetching Google user info:', error);
                    // Clear invalid token
                    localStorage.removeItem('gmail_access_token');
                }
            }
        };

        checkGoogleAuth();
    }, []);

    // Check if user is logged in (custom auth or Google auth)
    const isLoggedIn = customUser || googleUser;

    return (
        <nav className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-50 ">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate('/home')}
                            className="text-2xl font-bold text-white hover:text-orange-400 transition duration-200"
                        >
                            TaskMint
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        <button
                            onClick={() => navigate('/home')}
                            className="text-gray-300 hover:text-orange-400 transition duration-200"
                        >
                            Home
                        </button>
                        <button
                            onClick={() => navigate('/gmail')}
                            className="text-gray-300 hover:text-orange-400 transition duration-200"
                        >
                            Gmail
                        </button>
                        <button
                            onClick={() => navigate('/tasks')}
                            className="text-gray-300 hover:text-orange-400 transition duration-200"
                        >
                            Tasks
                        </button>
                        {isLoggedIn && (
                            <button
                                onClick={() => navigate('/analytics')}
                                className="text-gray-300 hover:text-orange-400 transition duration-200"
                            >
                                Analytics
                            </button>
                        )}
                        {!isLoggedIn && (
                            <>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="text-gray-300 hover:text-orange-400 transition duration-200"
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="text-gray-300 hover:text-orange-400 transition duration-200"
                                >
                                    Sign Up
                                </button>
                            </>
                        )}
                    </div>

                    {/* Auth Section */}
                    <div className="flex items-center space-x-4">
                        {!isLoggedIn ? (
                            <button
                                onClick={() => navigate('/login')}
                                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition duration-200 text-sm font-medium"
                            >
                                Sign In
                            </button>
                        ) : (
                            <div className="flex items-center space-x-4">
                                {/* Show user info with profile picture */}
                                <div className="flex items-center space-x-3">
                                    <div className="text-gray-300 text-sm">
                                        <span>Welcome, {googleUser?.name || customUser?.fullName || customUser?.username}</span>
                                    </div>
                                    {googleUser?.picture && (
                                        <img 
                                            src={googleUser.picture} 
                                            alt="Profile" 
                                            className="w-10 h-10 rounded-full"
                                        />
                                    )}
                                </div>

                                {/* Logout button */}
                                <button
                                    onClick={async () => {
                                        if (googleUser) {
                                            // Google logout
                                            localStorage.removeItem('gmail_access_token');
                                            setGoogleUser(null);
                                            navigate('/login');
                                        } else {
                                            // Custom auth logout
                                            try {
                                                await authAPI.logout();
                                                tokenManager.clearAuth();
                                                navigate('/login');
                                            } catch (error) {
                                                console.error('Logout error:', error);
                                                tokenManager.clearAuth();
                                                navigate('/login');
                                            }
                                        }
                                    }}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 text-sm font-medium"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;