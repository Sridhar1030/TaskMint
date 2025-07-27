import { UserButton, SignedIn, SignedOut, SignInButton, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { tokenManager, authAPI } from '../utils/api';

const Navbar = () => {
    const navigate = useNavigate();
    const { user: clerkUser } = useUser();
    const customUser = tokenManager.getUser();

    // Check if user is logged in (either through Clerk or custom auth)
    const isLoggedIn = clerkUser || customUser;

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
                            <SignInButton mode="modal">
                                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition duration-200 text-sm font-medium">
                                    Sign In
                                </button>
                            </SignInButton>
                        ) : (
                            <div className="flex items-center space-x-4">
                                {/* Show user info */}
                                <div className="text-gray-300 text-sm">
                                    {clerkUser ? (
                                        <span>Welcome, {clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress}</span>
                                    ) : (
                                        <span>Welcome, {customUser?.fullName || customUser?.username}</span>
                                    )}
                                </div>

                                {/* Clerk UserButton for Clerk users */}
                                {clerkUser && (
                                    <div className="flex items-center justify-center">
                                        <UserButton
                                            appearance={{
                                                elements: {
                                                    userButtonBox: " rounded-full",
                                                    userButtonTrigger: "",
                                                    userButtonPopoverCard: "bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 shadow-2xl rounded-xl",
                                                    userButtonPopoverActionButton: "text-orange-300 hover:text-orange-400",
                                                    userButtonPopoverActionButtonText: "text-orange-300 hover:text-orange-400",
                                                    userButtonPopoverFooter: "border-t border-gray-700/50",
                                                    userButtonPopoverCardArrow: "fill-gray-800/95",
                                                    userButtonPopoverCardArrowBox: "fill-gray-800/95",
                                                    userPreviewMainIdentifier: "text-white",
                                                    userPreviewSecondaryIdentifier: "text-gray-400",
                                                    userPreviewTextContainer: "text-white",
                                                    userButtonPopoverActionButtonIcon: "text-gray-400 hover:text-orange-400",
                                                    userButtonPopoverActionButtonText: "text-orange-300 hover:text-orange-400",
                                                    userButtonPopoverActionButton: "hover:bg-gray-700/50 rounded-lg",
                                                    userButtonPopoverCard: "rounded-xl",
                                            
                                                },
                                                variables: {
                                                    colorPrimary: "#f97316",
                                                    colorText: "#000000",
                                                    colorTextSecondary: "#000000",
                                                    colorBackground: "rgba(255, 255, 255)",
                                                    colorInputBackground: "rgba(255, 255, 255)",
                                                    colorInputText: "#000000",
                                                    
                                                }
                                            }}
                                            afterSignOutUrl="/login"
                                        />
                                    </div>
                                )}

                                {/* Custom logout button for custom auth users */}
                                {!clerkUser && customUser && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                await authAPI.logout();
                                                tokenManager.clearAuth();
                                                navigate('/login');
                                            } catch (error) {
                                                console.error('Logout error:', error);
                                                tokenManager.clearAuth();
                                                navigate('/login');
                                            }
                                        }}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 text-sm font-medium"
                                    >
                                        Logout
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 