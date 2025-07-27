import { useState, useEffect } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import axios from 'axios';
import GmailSidebar from '../components/GmailSidebar';
import GmailMessageList from '../components/GmailMessageList';
import GmailEmailViewer from '../components/GmailEmailViewer';

import GmailLoginScreen from '../components/GmailLoginScreen';

const Gmail = () => {
    const [messages, setMessages] = useState([]);
    const [labels, setLabels] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [selectedLabel, setSelectedLabel] = useState('INBOX');
    const [selectedEmail, setSelectedEmail] = useState(null);
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
        scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email',
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



    const handleLogout = () => {
        googleLogout();
        localStorage.removeItem('gmail_access_token');
        setIsAuthenticated(false);
        setMessages([]);
        setLabels([]);
        setUser(null);
        setAccessToken(null);
        setSelectedLabel('INBOX');
        setSelectedEmail(null);
    };

    const formatDate = (timestamp) => {
        return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
    };

    const getHeaderValue = (headers, name) => {
        const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
        return header ? header.value : '';
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
                <GmailLoginScreen onLogin={() => login()} />
            ) : (
                // Gmail Interface
                <div className="flex h-screen bg-gray-800/50 backdrop-blur-sm overflow-hidden">
                    {/* Sidebar */}
                    <GmailSidebar
                        user={user}
                        labels={labels}
                        selectedLabel={selectedLabel}
                        onLabelClick={handleLabelClick}
                        onLogout={handleLogout}
                    />

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Top Bar */}
                        <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 px-6 py-3 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <h1 className="text-lg font-semibold text-white">
                                    {labels.find(l => l.id === selectedLabel)?.name || selectedLabel}
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
                            <GmailMessageList
                                messages={messages}
                                isLoading={isLoading}
                                selectedEmail={selectedEmail}
                                onEmailClick={handleEmailClick}
                                onRefresh={() => fetchGmailMessages(accessToken, selectedLabel)}
                            />

                            {/* Email Preview */}
                            <GmailEmailViewer
                                selectedEmail={selectedEmail}
                                getEmailContent={getEmailContent}
                            />
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

export default Gmail; 