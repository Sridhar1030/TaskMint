import React from 'react';

const GmailSidebar = ({ 
    user, 
    labels, 
    selectedLabel, 
    onLabelClick, 
    onLogout 
}) => {
    const getLabelName = (labelId) => {
        const label = labels.find(l => l.id === labelId);
        return label ? label.name : labelId;
    };

    return (
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
                        onClick={onLogout}
                        className="text-gray-400 hover:text-gray-300"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>



            {/* Labels */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-2">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Labels</h4>
                    <div className="space-y-1">
                        {labels.map((label) => (
                            <button
                                key={label.id}
                                onClick={() => onLabelClick(label.id)}
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
    );
};

export default GmailSidebar; 