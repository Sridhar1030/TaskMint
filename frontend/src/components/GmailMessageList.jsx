import React from 'react';

const GmailMessageList = ({ 
    messages, 
    isLoading, 
    selectedEmail, 
    onEmailClick, 
    onRefresh 
}) => {
    const formatDate = (timestamp) => {
        return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
    };

    const getHeaderValue = (headers, name) => {
        const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
        return header ? header.value : '';
    };

    if (isLoading) {
        return (
            <div className="w-1/2 border-r border-gray-700/50 bg-gray-800/50 backdrop-blur-sm overflow-hidden">
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="w-1/2 border-r border-gray-700/50 bg-gray-800/50 backdrop-blur-sm overflow-hidden">
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-400 mb-2">No messages found</p>
                        <p className="text-gray-500 text-sm">Try refreshing or check your Gmail account</p>
                        <button
                            onClick={onRefresh}
                            className="mt-4 text-orange-400 hover:text-orange-300 text-sm"
                        >
                            Refresh Messages
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-1/2 border-r border-gray-700/50 bg-gray-800/50 backdrop-blur-sm overflow-hidden">
            <div className="divide-y divide-gray-700/50 overflow-y-auto h-full">
                {messages.map((message) => (
                    <div 
                        key={message.id} 
                        className={`p-4 cursor-pointer transition duration-200 ${
                            selectedEmail?.id === message.id 
                                ? 'bg-orange-500/20 border-r-2 border-orange-500' 
                                : 'hover:bg-gray-700/30'
                        }`}
                        onClick={() => onEmailClick(message)}
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
        </div>
    );
};

export default GmailMessageList; 