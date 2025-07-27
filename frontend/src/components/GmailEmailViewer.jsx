import React from 'react';

const GmailEmailViewer = ({ selectedEmail, getEmailContent }) => {
    const formatDate = (timestamp) => {
        return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
    };

    const getHeaderValue = (headers, name) => {
        const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
        return header ? header.value : '';
    };

    if (!selectedEmail) {
        return (
            <div className="flex-1 bg-gray-800/50 backdrop-blur-sm overflow-hidden">
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-400">Select an email to read</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-gray-800/50 backdrop-blur-sm overflow-hidden">
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
        </div>
    );
};

export default GmailEmailViewer; 