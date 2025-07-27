import { useState, useEffect } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import axios from 'axios';

const Gmail = () => {
    const [messages, setMessages] = useState([]);
    const [labels, setLabels] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [selectedLabel, setSelectedLabel] = useState('INBOX');
    const [showCompose, setShowCompose] = useState(false);
    const [composeData, setComposeData] = useState({
        to: '',
        subject: '',
        body: ''
    });
    const [accessToken, setAccessToken] = useState(null);

    // Check for existing access token on component mount
    useEffect(() => {
        const existingToken = localStorage.getItem('gmail_access_token');
        if (existingToken) {
            setAccessToken(existingToken);
            setIsAuthenticated(true);
            fetchUserInfo(existingToken);
            fetchLabels(existingToken);
            fetchGmailMessages(existingToken);
        }
    }, []);

    const login = useGoogleLogin({
        scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email',
        onSuccess: async (tokenResponse) => {
            console.log('Access Token:', tokenResponse.access_token);
            setAccessToken(tokenResponse.access_token);
            localStorage.setItem('gmail_access_token', tokenResponse.access_token);
            setIsAuthenticated(true);
            await fetchUserInfo(tokenResponse.access_token);
            await fetchLabels(tokenResponse.access_token);
            await fetchGmailMessages(tokenResponse.access_token);
        },
        onError: error => {
            console.log('Login Failed:', error);
            alert('Google login failed. Please try again.');
        },
    });

    const fetchUserInfo = async (token) => {
        try {
            const response = await axios.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setUser(response.data);
        } catch (error) {
            console.error('Error fetching user info:', error);
            if (error.response?.status === 401) {
                // Token expired, clear it and show login
                localStorage.removeItem('gmail_access_token');
                setIsAuthenticated(false);
                setAccessToken(null);
            }
        }
    };

    const fetchLabels = async (token) => {
        try {
            const response = await axios.get(
                'https://gmail.googleapis.com/gmail/v1/users/me/labels',
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setLabels(response.data.labels || []);
        } catch (error) {
            console.error('Error fetching labels:', error);
            if (error.response?.status === 401) {
                // Token expired, clear it and show login
                localStorage.removeItem('gmail_access_token');
                setIsAuthenticated(false);
                setAccessToken(null);
            }
        }
    };

    const fetchGmailMessages = async (token, label = 'INBOX') => {
        setIsLoading(true);
        try {
            const response = await axios.get(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&labelIds=${label}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.messages) {
                // Fetch detailed message information for each message
                const messageDetails = await Promise.all(
                    response.data.messages.map(async (message) => {
                        try {
                            const detailResponse = await axios.get(
                                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
                                {
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                }
                            );
                            return detailResponse.data;
                        } catch (error) {
                            console.error('Error fetching message details:', error);
                            return null;
                        }
                    })
                );

                setMessages(messageDetails.filter(msg => msg !== null));
            } else {
                setMessages([]);
            }
        } catch (error) {
            console.error('Error fetching Gmail messages:', error);
            if (error.response?.status === 401) {
                // Token expired, clear it and show login
                localStorage.removeItem('gmail_access_token');
                setIsAuthenticated(false);
                setAccessToken(null);
            } else {
                alert('Failed to fetch Gmail messages. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleLabelClick = (labelId) => {
        setSelectedLabel(labelId);
        fetchGmailMessages(accessToken, labelId);
    };

    const handleCompose = () => {
        setShowCompose(true);
    };

    const handleSendEmail = async () => {
        if (!composeData.to || !composeData.subject || !composeData.body) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const emailContent = `To: ${composeData.to}\r\nSubject: ${composeData.subject}\r\n\r\n${composeData.body}`;
            const encodedEmail = btoa(emailContent).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

            await axios.post(
                'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
                {
                    raw: encodedEmail
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            alert('Email sent successfully!');
            setShowCompose(false);
            setComposeData({ to: '', subject: '', body: '' });
        } catch (error) {
            console.error('Error sending email:', error);
            alert('Failed to send email. Please try again.');
        }
    };

    const handleLogout = () => {
        googleLogout();
        localStorage.removeItem('gmail_access_token');
        setIsAuthenticated(false);
        setMessages([]);
        setLabels([]);
        setUser(null);
        setAccessToken(null);
        setSelectedLabel('INBOX');
        setShowCompose(false);
    };

    const formatDate = (timestamp) => {
        return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
    };

    const getHeaderValue = (headers, name) => {
        const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
        return header ? header.value : '';
    };

    const getLabelName = (labelId) => {
        const label = labels.find(l => l.id === labelId);
        return label ? label.name : labelId;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-800/95 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Gmail Inbox</h1>
                    <p className="text-gray-400 text-lg">Access and manage your emails</p>
                </div>

                {/* Authentication Section */}
                {!isAuthenticated ? (
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-2xl text-center">
                        <div className="mb-6">
                            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <h2 className="text-2xl font-semibold text-white mb-2">Connect to Gmail</h2>
                            <p className="text-gray-400 mb-6">Sign in with Google to access your Gmail inbox</p>
                        </div>
                        <button
                            onClick={() => login()}
                            className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-200 transform hover:scale-[1.02]"
                        >
                            <svg className="w-5 h-5 inline mr-2" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Login with Gmail
                        </button>
                    </div>
                ) : (
                    /* Gmail Interface */
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Sidebar - Labels */}
                        <div className="lg:col-span-1">
                            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-white">Labels</h3>
                                    <button
                                        onClick={handleCompose}
                                        className="bg-orange-500 text-white px-3 py-1 rounded-lg hover:bg-orange-600 transition duration-200 text-sm"
                                    >
                                        Compose
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {labels.map((label) => (
                                        <button
                                            key={label.id}
                                            onClick={() => handleLabelClick(label.id)}
                                            className={`w-full text-left px-3 py-2 rounded-lg transition duration-200 ${
                                                selectedLabel === label.id
                                                    ? 'bg-orange-500 text-white'
                                                    : 'text-gray-300 hover:bg-gray-700/50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="truncate">{label.name}</span>
                                                {label.messagesTotal > 0 && (
                                                    <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                                                        {label.messagesTotal}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Main Content - Messages */}
                        <div className="lg:col-span-3">
                            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl">
                                <div className="p-6 border-b border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl font-semibold text-white">
                                                {getLabelName(selectedLabel)}
                                            </h2>
                                            <p className="text-gray-400 text-sm">{messages.length} messages</p>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            {user?.picture && (
                                                <img 
                                                    src={user.picture} 
                                                    alt="Profile" 
                                                    className="w-8 h-8 rounded-full"
                                                />
                                            )}
                                            <button
                                                onClick={handleLogout}
                                                className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition duration-200 text-sm"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                {isLoading ? (
                                    <div className="p-8 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                                        <p className="text-gray-400 mt-4">Loading your emails...</p>
                                    </div>
                                ) : messages.length > 0 ? (
                                    <div className="divide-y divide-gray-700">
                                        {messages.map((message) => (
                                            <div key={message.id} className="p-6 hover:bg-gray-700/30 transition duration-200">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-3 mb-2">
                                                            <span className="text-sm font-medium text-orange-400">
                                                                {getHeaderValue(message.payload.headers, 'From')}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {formatDate(message.internalDate)}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-white font-medium mb-1 truncate">
                                                            {getHeaderValue(message.payload.headers, 'Subject') || '(No Subject)'}
                                                        </h3>
                                                        <p className="text-gray-400 text-sm line-clamp-2">
                                                            {message.snippet}
                                                        </p>
                                                        {message.labelIds && message.labelIds.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {message.labelIds.map((labelId) => (
                                                                    <span
                                                                        key={labelId}
                                                                        className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded"
                                                                    >
                                                                        {getLabelName(labelId)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center">
                                        <p className="text-gray-400">No messages found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Compose Modal */}
                {showCompose && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-gray-800/95 border border-gray-700/50 rounded-2xl p-6 w-full max-w-2xl mx-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold text-white">Compose Email</h3>
                                <button
                                    onClick={() => setShowCompose(false)}
                                    className="text-gray-400 hover:text-white transition duration-200"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">To:</label>
                                    <input
                                        type="email"
                                        value={composeData.to}
                                        onChange={(e) => setComposeData({...composeData, to: e.target.value})}
                                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="recipient@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Subject:</label>
                                    <input
                                        type="text"
                                        value={composeData.subject}
                                        onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Subject"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Message:</label>
                                    <textarea
                                        value={composeData.body}
                                        onChange={(e) => setComposeData({...composeData, body: e.target.value})}
                                        rows={8}
                                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                        placeholder="Write your message here..."
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => setShowCompose(false)}
                                        className="px-4 py-2 text-gray-300 hover:text-white transition duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSendEmail}
                                        className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Gmail; 