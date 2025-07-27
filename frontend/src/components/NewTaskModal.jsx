import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NewTaskModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        title: '',
        deadline: '',
        estimatedTime: '',
        priority: 'medium',
        description: ''
    });
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [inputMode, setInputMode] = useState('text'); // 'text' or 'voice'

    // Enhanced Speech Recognition setup with multiple fallbacks
    useEffect(() => {
        let recognition = null;
        
        // Try different speech recognition APIs
        if (window.SpeechRecognition) {
            recognition = new window.SpeechRecognition();
        } else if (window.webkitSpeechRecognition) {
            recognition = new window.webkitSpeechRecognition();
        } else if (window.mozSpeechRecognition) {
            recognition = new window.mozSpeechRecognition();
        } else if (window.msSpeechRecognition) {
            recognition = new window.msSpeechRecognition();
        }

        if (!recognition) {
            console.warn('Speech recognition not supported in this browser');
            return;
        }

        // Configure recognition
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            setTranscript('');
            console.log('Speech recognition started');
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            setTranscript(finalTranscript || interimTranscript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            
            // Handle specific errors
            switch (event.error) {
                case 'network':
                    alert('Network error. Please check your internet connection and try again.');
                    break;
                case 'not-allowed':
                    alert('Microphone access denied. Please allow microphone access and try again.');
                    break;
                case 'no-speech':
                    alert('No speech detected. Please speak clearly and try again.');
                    break;
                case 'audio-capture':
                    alert('Audio capture error. Please check your microphone and try again.');
                    break;
                case 'service-not-allowed':
                    alert('Speech recognition service not allowed. Please try again.');
                    break;
                default:
                    alert(`Speech recognition error: ${event.error}. Please try again.`);
            }
            
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
            console.log('Speech recognition ended');
        };

        // Store recognition instance
        window.recognition = recognition;

        return () => {
            if (window.recognition) {
                try {
                    window.recognition.stop();
                } catch (error) {
                    console.log('Error stopping recognition:', error);
                }
            }
        };
    }, []);

    const startListening = () => {
        if (window.recognition) {
            try {
                window.recognition.start();
            } catch (error) {
                console.error('Error starting recognition:', error);
                alert('Error starting speech recognition. Please try again.');
            }
        } else {
            alert('Speech recognition not available. Please use text input instead.');
        }
    };

    const stopListening = () => {
        if (window.recognition) {
            try {
                window.recognition.stop();
            } catch (error) {
                console.error('Error stopping recognition:', error);
            }
        }
    };

    // Alternative: Use browser's built-in speech input
    const useSpeechInput = () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.setAttribute('x-webkit-speech', '');
        input.setAttribute('speech', '');
        input.style.position = 'absolute';
        input.style.left = '-9999px';
        
        document.body.appendChild(input);
        
        input.addEventListener('change', (e) => {
            const speechText = e.target.value;
            if (speechText) {
                setTranscript(speechText);
            }
            document.body.removeChild(input);
        });
        
        input.focus();
        input.click();
    };

    const handleVoiceInput = async () => {
        if (!transcript.trim()) return;

        setIsProcessing(true);
        try {
            // Get user ID and email from localStorage
            const customUser = JSON.parse(localStorage.getItem('user'));
            const gmailToken = localStorage.getItem('gmail_access_token');
            
            let userId = null;
            let userEmail = null;
            let userType = null;

            if (customUser) {
                userId = customUser.id;
                userEmail = customUser.email;
                userType = 'custom';
            } else if (gmailToken) {
                const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: {
                        Authorization: `Bearer ${gmailToken}`,
                    },
                });
                const userInfo = await userResponse.json();
                userId = userInfo.email;
                userEmail = userInfo.email;
                userType = 'gmail';
            }

            // Send transcript with user info to backend for parsing
            const response = await axios.post(`${import.meta.env.VITE_API}/api/tasks/parse-voice`, {
                transcript: transcript,
                userId: userId,
                userEmail: userEmail,
                userType: userType
            });

            if (response.data.success) {
                // Task is already created in the backend, just add it to the frontend
                onSubmit(response.data.task);
                handleClose();
            } else {
                alert('Could not parse voice input. Please try again.');
            }
        } catch (error) {
            console.error('Error parsing voice input:', error);
            alert('Error processing voice input. Please try again.');
        } finally {
            setIsProcessing(false);
            setTranscript('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title.trim()) {
            alert('Please enter a task title');
            return;
        }

        try {
            // Get user ID from localStorage
            const customUser = JSON.parse(localStorage.getItem('user'));
            const gmailToken = localStorage.getItem('gmail_access_token');
            
            let userId = null;
            let userType = null;

            if (customUser) {
                userId = customUser.id;
                userType = 'custom';
            } else if (gmailToken) {
                // For Gmail users, we'll use their email as identifier
                const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: {
                        Authorization: `Bearer ${gmailToken}`,
                    },
                });
                const userInfo = await response.json();
                userId = userInfo.email;
                userType = 'gmail';
            }

            const taskData = {
                ...formData,
                userId,
                userType,
                createdAt: new Date().toISOString()
            };

            const response = await axios.post(`${import.meta.env.VITE_API}/api/tasks`, taskData);
            onSubmit(response.data.task);
            handleClose();
        } catch (error) {
            console.error('Error creating task:', error);
            // Create a local task object if API fails
            const localTask = {
                _id: Date.now().toString(),
                ...formData,
                userId: 'local',
                userType: 'local',
                createdAt: new Date().toISOString()
            };
            onSubmit(localTask);
            handleClose();
        }
    };

    const handleClose = () => {
        setFormData({
            title: '',
            deadline: '',
            estimatedTime: '',
            priority: 'medium',
            description: ''
        });
        setTranscript('');
        setInputMode('text');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800/95 border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
                    <h3 className="text-lg font-semibold text-white">Create New Task</h3>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-300"
                    >
                        ✕
                    </button>
                </div>
                
                {/* Input Mode Selection */}
                <div className="flex space-x-2 p-6 border-b border-gray-700/50">
                    <button
                        type="button"
                        onClick={() => setInputMode('text')}
                        className={`px-4 py-2 rounded-lg transition duration-200 ${
                            inputMode === 'text' 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                        }`}
                    >
                        📝 Text Input
                    </button>
                    <button
                        type="button"
                        onClick={() => setInputMode('voice')}
                        className={`px-4 py-2 rounded-lg transition duration-200 ${
                            inputMode === 'voice' 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                        }`}
                    >
                        🎤 Voice Input
                    </button>
                </div>
                
                {inputMode === 'text' ? (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Task Title *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Enter task title"
                                required
                            />
                        </div>

                        {/* Deadline and Estimated Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Deadline
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Estimated Time
                                </label>
                                <input
                                    type="text"
                                    value={formData.estimatedTime}
                                    onChange={(e) => setFormData({...formData, estimatedTime: e.target.value})}
                                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="e.g., 2 hours, 30 minutes"
                                />
                            </div>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Priority
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                rows={3}
                                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                placeholder="Add any additional details..."
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 text-gray-300 hover:text-white transition duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
                            >
                                Create Task
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-6 space-y-4">
                        {/* Voice Input Section */}
                        <div className="bg-gray-700/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-medium text-gray-300">Voice Input</h4>
                                <div className="flex space-x-2">
                                    {!isListening ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={startListening}
                                                className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition duration-200"
                                                title="Start voice recognition"
                                            >
                                                🎤 Start
                                            </button>
                                            <button
                                                type="button"
                                                onClick={useSpeechInput}
                                                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition duration-200"
                                                title="Use browser speech input (alternative)"
                                            >
                                                🎙️ Browser
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={stopListening}
                                            className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition duration-200"
                                        >
                                            ⏹️ Stop
                                        </button>
                                    )}
                                    {transcript && (
                                        <button
                                            type="button"
                                            onClick={handleVoiceInput}
                                            disabled={isProcessing}
                                            className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50 transition duration-200"
                                        >
                                            {isProcessing ? 'Processing...' : 'Create Task'}
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {isListening && (
                                <div className="flex items-center space-x-2 mb-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm text-red-400">Listening...</span>
                                </div>
                            )}
                            
                            {transcript && (
                                <div className="bg-gray-600/50 rounded p-3">
                                    <p className="text-sm text-gray-300">{transcript}</p>
                                </div>
                            )}
                            
                            <div className="mt-2 text-xs text-gray-400">
                                💡 Tip: Try "Browser" button if voice recognition doesn't work
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 text-gray-300 hover:text-white transition duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewTaskModal; 