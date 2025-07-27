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
    const [selectedEmail, setSelectedEmail] = useState(null);
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
            fetchGmailMessages(existingToken, 'INBOX');
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
            console.log('Fetching messages for label:', label);
            
            // Try different queries to get messages
            let response;
            
            // First try: Get all messages without label filter
            try {
                response = await axios.get(
                    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                console.log('All messages response:', response.data);
            } catch (error) {
                console.error('Error fetching all messages:', error);
                response = { data: { messages: [] } };
            }

            if (response.data.messages && response.data.messages.length > 0) {
                console.log('Found', response.data.messages.length, 'messages');
                
                // Fetch detailed message information for each message
                const messageDetails = await Promise.all(
                    response.data.messages.map(async (message, index) => {
                        try {
                            console.log(`Fetching details for message ${index + 1}/${response.data.messages.length}`);
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

                const validMessages = messageDetails.filter(msg => msg !== null);
                console.log('Valid messages:', validMessages.length);
                setMessages(validMessages);
            } else {
                console.log('No messages found, trying different approach...');
                
                // Try to get messages with different parameters
                try {
                    const alternativeResponse = await axios.get(
                        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );
                    console.log('Alternative response:', alternativeResponse.data);
                    
                    if (alternativeResponse.data.messages && alternativeResponse.data.messages.length > 0) {
                        const messageDetails = await Promise.all(
                            alternativeResponse.data.messages.map(async (message) => {
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
                        
                        const validMessages = messageDetails.filter(msg => msg !== null);
                        console.log('Valid messages from alternative:', validMessages.length);
                        setMessages(validMessages);
                    } else {
                        setMessages([]);
                    }
                } catch (altError) {
                    console.error('Alternative approach failed:', altError);
                    setMessages([]);
                }
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
        setSelectedEmail(null); // Clear selected email when changing labels
        fetchGmailMessages(accessToken, labelId);
    };

    const handleEmailClick = async (message) => {
        try {
            console.log('Fetching email:', message.id);
            // Fetch full email content
            const response = await axios.get(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            
            console.log('Email response:', response.data);
            setSelectedEmail(response.data);
        } catch (error) {
            console.error('Error fetching email details:', error);
            alert('Failed to load email. Please try again.');
        }
    };

    const handleCompose = () => {
        setShowCompose(true);
    };

    const closeEmailModal = () => {
        setShowCompose(false);
        setSelectedEmail(null);
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
        setSelectedEmail(null);
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

    const getEmailBody = (message) => {
        if (!message.payload) return message.snippet || 'No content available';
        
        // Helper function to decode base64
        const decodeBase64 = (data) => {
            try {
                return atob(data.replace(/-/g, '+').replace(/_/g, '/'));
            } catch (error) {
                console.error('Error decoding base64:', error);
                return '';
            }
        };
        
        // Helper function to recursively search for text content
        const findTextContent = (payload) => {
            // If payload has body data, return it
            if (payload.body && payload.body.data) {
                return decodeBase64(payload.body.data);
            }
            
            // If payload has parts, search through them
            if (payload.parts) {
                for (let part of payload.parts) {
                    // Prefer plain text over HTML
                    if (part.mimeType === 'text/plain' && part.body && part.body.data) {
                        return decodeBase64(part.body.data);
                    }
                }
                
                for (let part of payload.parts) {
                    if (part.mimeType === 'text/html' && part.body && part.body.data) {
                        return decodeBase64(part.body.data);
                    }
                }
                
                // Recursively search nested parts
                for (let part of payload.parts) {
                    if (part.parts) {
                        const nestedContent = findTextContent(part);
                        if (nestedContent) return nestedContent;
                    }
                }
            }
            
            return null;
        };
        
        const content = findTextContent(message.payload);
        return content || message.snippet || 'No content available';
    };

    const getEmailContent = (message) => {
        const content = getEmailBody(message);
        // Ensure we return a string, not an object
        if (typeof content !== 'string') {
            return message.snippet || 'No content available';
        }
        
        // Remove HTML tags and decode HTML entities
        const stripHtml = (html) => {
            const tmp = document.createElement('div');
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || '';
        };
        
        // Clean the content
        let cleanContent = content;
        
        // If it looks like HTML, strip the tags
        if (content.includes('<') && content.includes('>')) {
            cleanContent = stripHtml(content);
        }
        
        // Remove common email headers and footers
        cleanContent = cleanContent
            .replace(/<!DOCTYPE[^>]*>/gi, '')
            .replace(/<html[^>]*>/gi, '')
            .replace(/<\/html>/gi, '')
            .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
            .replace(/<body[^>]*>/gi, '')
            .replace(/<\/body>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<meta[^>]*>/gi, '')
            .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
            .replace(/<link[^>]*>/gi, '')
            .replace(/<div[^>]*>/gi, '\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<p[^>]*>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<span[^>]*>/gi, '')
            .replace(/<\/span>/gi, '')
            .replace(/<a[^>]*>/gi, '')
            .replace(/<\/a>/gi, '')
            .replace(/<img[^>]*>/gi, '')
            .replace(/<table[^>]*>/gi, '\n')
            .replace(/<\/table>/gi, '\n')
            .replace(/<tr[^>]*>/gi, '\n')
            .replace(/<\/tr>/gi, '\n')
            .replace(/<td[^>]*>/gi, ' ')
            .replace(/<\/td>/gi, ' ')
            .replace(/<th[^>]*>/gi, ' ')
            .replace(/<\/th>/gi, ' ')
            .replace(/<ul[^>]*>/gi, '\n')
            .replace(/<\/ul>/gi, '\n')
            .replace(/<ol[^>]*>/gi, '\n')
            .replace(/<\/ol>/gi, '\n')
            .replace(/<li[^>]*>/gi, '• ')
            .replace(/<\/li>/gi, '\n')
            .replace(/<h[1-6][^>]*>/gi, '\n')
            .replace(/<\/h[1-6]>/gi, '\n')
            .replace(/<strong[^>]*>/gi, '**')
            .replace(/<\/strong>/gi, '**')
            .replace(/<b[^>]*>/gi, '**')
            .replace(/<\/b>/gi, '**')
            .replace(/<em[^>]*>/gi, '*')
            .replace(/<\/em>/gi, '*')
            .replace(/<i[^>]*>/gi, '*')
            .replace(/<\/i>/gi, '*')
            .replace(/&nbsp;/gi, ' ')
            .replace(/&amp;/gi, '&')
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/&quot;/gi, '"')
            .replace(/&#39;/gi, "'")
            .replace(/&copy;/gi, '©')
            .replace(/&reg;/gi, '®')
            .replace(/&trade;/gi, '™')
            .replace(/&mdash;/gi, '—')
            .replace(/&ndash;/gi, '–')
            .replace(/&hellip;/gi, '...')
            .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/\n\s*\n/g, '\n\n') // Clean up line breaks
            .trim();
        
        // If the cleaned content is too short, try to extract meaningful text
        if (cleanContent.length < 50 && message.snippet) {
            cleanContent = message.snippet;
        }
        
        return cleanContent || message.snippet || 'No content available';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-800/95 backdrop-blur-sm">
            {!isAuthenticated ? (
                // Login Screen
                <div className="min-h-screen bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-800/95 backdrop-blur-sm flex items-center justify-center">
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
                </div>
            ) : (
                // Gmail Interface
                <div className="flex h-screen bg-gray-800/50 backdrop-blur-sm overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 bg-gray-800/50 backdrop-blur-sm border-r border-gray-700/50 flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-700/50">
                            <div className="flex items-center space-x-3">
                                {user?.picture && (
                                    <img 
                                        src={user.picture} 
                                        alt="Profile" 
                                        className="w-8 h-8 rounded-full"
                                    />
                                )}
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-white">{user?.name || 'User'}</h3>
                                    <p className="text-xs text-gray-400">{user?.email}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="text-gray-400 hover:text-gray-300"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Compose Button */}
                        <div className="p-4">
                            <button
                                onClick={handleCompose}
                                className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition duration-200 flex items-center justify-center space-x-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Compose</span>
                            </button>
                        </div>

                        {/* Labels */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="px-4 py-2">
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Labels</h4>
                                <div className="space-y-1">
                                    {labels.map((label) => (
                                        <button
                                            key={label.id}
                                            onClick={() => handleLabelClick(label.id)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition duration-200 flex items-center justify-between ${
                                                selectedLabel === label.id
                                                    ? 'bg-orange-500 text-white'
                                                    : 'text-gray-300 hover:bg-gray-700/50'
                                            }`}
                                        >
                                            <span className="truncate">{label.name}</span>
                                            {label.messagesTotal > 0 && (
                                                <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded-full">
                                                    {label.messagesTotal}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Top Bar */}
                        <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 px-6 py-3 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <h1 className="text-lg font-semibold text-white">
                                    {getLabelName(selectedLabel)}
                                </h1>
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-400">{messages.length} messages</span>
                                    <button
                                        onClick={() => fetchGmailMessages(accessToken, selectedLabel)}
                                        disabled={isLoading}
                                        className="text-orange-400 hover:text-orange-300 disabled:opacity-50 transition duration-200"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Messages and Email Preview */}
                        <div className="flex-1 flex overflow-hidden min-h-0">
                            {/* Message List */}
                            <div className="w-1/2 border-r border-gray-700/50 bg-gray-800/50 backdrop-blur-sm overflow-hidden">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                                    </div>
                                ) : messages.length > 0 ? (
                                    <div className="divide-y divide-gray-700/50 overflow-y-auto h-full">
                                        {messages.map((message) => (
                                            <div 
                                                key={message.id} 
                                                className={`p-4 cursor-pointer transition duration-200 ${
                                                    selectedEmail?.id === message.id 
                                                        ? 'bg-orange-500/20 border-r-2 border-orange-500' 
                                                        : 'hover:bg-gray-700/30'
                                                }`}
                                                onClick={() => handleEmailClick(message)}
                                            >
                                                <div className="flex items-start space-x-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <span className="text-sm font-medium text-orange-400">
                                                                {getHeaderValue(message.payload.headers, 'From')}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {formatDate(message.internalDate)}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-sm font-semibold text-white mb-1 truncate">
                                                            {getHeaderValue(message.payload.headers, 'Subject') || '(No Subject)'}
                                                        </h3>
                                                        <p className="text-sm text-gray-400 line-clamp-2">
                                                            {message.snippet}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-gray-400 mb-2">No messages found</p>
                                            <p className="text-gray-500 text-sm">Try refreshing or check your Gmail account</p>
                                            <button
                                                onClick={() => fetchGmailMessages(accessToken, selectedLabel)}
                                                className="mt-4 text-orange-400 hover:text-orange-300 text-sm"
                                            >
                                                Refresh Messages
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Email Preview */}
                            <div className="flex-1 bg-gray-800/50 backdrop-blur-sm overflow-hidden">
                                {selectedEmail ? (
                                    <div className="h-full flex flex-col overflow-hidden">
                                        {/* Email Header */}
                                        <div className="border-b border-gray-700/50 p-6 flex-shrink-0">
                                            <div className="flex items-center justify-between mb-4">
                                                <h2 className="text-xl font-semibold text-white">
                                                    {getHeaderValue(selectedEmail.payload.headers, 'Subject') || '(No Subject)'}
                                                </h2>
                                                <span className="text-sm text-gray-400">
                                                    {formatDate(selectedEmail.internalDate)}
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm text-gray-400 w-16">From:</span>
                                                    <span className="text-sm text-orange-400">
                                                        {getHeaderValue(selectedEmail.payload.headers, 'From')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm text-gray-400 w-16">To:</span>
                                                    <span className="text-sm text-white">
                                                        {getHeaderValue(selectedEmail.payload.headers, 'To')}
                                                    </span>
                                                </div>
                                                {getHeaderValue(selectedEmail.payload.headers, 'Cc') && (
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm text-gray-400 w-16">Cc:</span>
                                                        <span className="text-sm text-white">
                                                            {getHeaderValue(selectedEmail.payload.headers, 'Cc')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Email Body */}
                                        <div className="flex-1 p-6 overflow-y-auto min-h-0">
                                            <div className="prose prose-invert max-w-none">
                                                <div 
                                                    className="text-gray-300 leading-relaxed whitespace-pre-wrap break-words overflow-hidden"
                                                    style={{ 
                                                        wordBreak: 'break-word',
                                                        overflowWrap: 'break-word'
                                                    }}
                                                >
                                                    {(() => {
                                                        const content = getEmailContent(selectedEmail);
                                                        return typeof content === 'string' ? content : 'No content available';
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-gray-400">Select an email to read</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Compose Modal */}
            {showCompose && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-800/95 border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-2xl mx-4">
                        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
                            <h3 className="text-lg font-semibold text-white">New Message</h3>
                            <button
                                onClick={() => setShowCompose(false)}
                                className="text-gray-400 hover:text-gray-300"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">To:</label>
                                <input
                                    type="email"
                                    value={composeData.to}
                                    onChange={(e) => setComposeData({...composeData, to: e.target.value})}
                                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="recipient@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Subject:</label>
                                <input
                                    type="text"
                                    value={composeData.subject}
                                    onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="Subject"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Message:</label>
                                <textarea
                                    value={composeData.body}
                                    onChange={(e) => setComposeData({...composeData, body: e.target.value})}
                                    rows={8}
                                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
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
    );
};

export default Gmail; 