import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NewTaskModal from '../components/NewTaskModal';

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showNewTaskModal, setShowNewTaskModal] = useState(false);
    const [filter, setFilter] = useState('all'); // all, pending, completed

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
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

            if (!userId) {
                setIsLoading(false);
                return;
            }

            const response = await axios.get(`${import.meta.env.VITE_API}/api/tasks`, {
                params: { userId, userType }
            });
            setTasks(response.data.tasks || []);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            // If there's an error, just show empty state
            setTasks([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewTask = (newTask) => {
        setTasks(prev => [newTask, ...prev]);
    };

    const handleTaskToggle = async (taskId, completed) => {
                try {
            await axios.patch(`${import.meta.env.VITE_API}/api/tasks/${taskId}`, {
                completed: !completed
            });
            
            setTasks(prev => 
                prev.map(task => 
                    task._id === taskId 
                        ? { ...task, completed: !completed }
                        : task
                )
            );
        } catch (error) {
            console.error('Error updating task:', error);
            // Update locally if API fails
            setTasks(prev => 
                prev.map(task => 
                    task._id === taskId 
                        ? { ...task, completed: !completed }
                        : task
                )
            );
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            await axios.delete(`${import.meta.env.VITE_API}/api/tasks/${taskId}`);
            setTasks(prev => prev.filter(task => task._id !== taskId));
        } catch (error) {
            console.error('Error deleting task:', error);
            // Delete locally if API fails
            setTasks(prev => prev.filter(task => task._id !== taskId));
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'text-red-400 bg-red-500/20';
            case 'high': return 'text-orange-400 bg-orange-500/20';
            case 'medium': return 'text-yellow-400 bg-yellow-500/20';
            case 'low': return 'text-green-400 bg-green-500/20';
            default: return 'text-gray-400 bg-gray-500/20';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredTasks = tasks.filter(task => {
        if (filter === 'pending') return !task.completed;
        if (filter === 'completed') return task.completed;
        return true;
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-800/95 backdrop-blur-sm flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-800/95 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">My Tasks</h1>
                        <p className="text-gray-400">Manage and track your tasks</p>
                    </div>
                    <button
                        onClick={() => setShowNewTaskModal(true)}
                        className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-200 transform hover:scale-[1.02]"
                    >
                        <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Task
                    </button>
                </div>

                {/* Filters */}
                <div className="flex space-x-4 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg transition duration-200 ${filter === 'all'
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                            }`}
                    >
                        All ({tasks.length})
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-lg transition duration-200 ${filter === 'pending'
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                            }`}
                    >
                        Pending ({tasks.filter(t => !t.completed).length})
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-4 py-2 rounded-lg transition duration-200 ${filter === 'completed'
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                            }`}
                    >
                        Completed ({tasks.filter(t => t.completed).length})
                    </button>
                </div>

                {/* Tasks List */}
                <div className="space-y-4">
                    {filteredTasks.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-gray-400 text-lg mb-2">No tasks found</p>
                            <p className="text-gray-500">Create your first task to get started</p>
                        </div>
                    ) : (
                        filteredTasks.map((task) => (
                            <div
                                key={task._id}
                                className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6 transition duration-200 ${task.completed ? 'opacity-75' : ''
                                    }`}
                            >
                                <div className="flex items-start space-x-4">
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => handleTaskToggle(task._id, task.completed)}
                                        className={`mt-1 w-5 h-5 rounded border-2 transition duration-200 ${task.completed
                                                ? 'bg-orange-500 border-orange-500'
                                                : 'border-gray-400 hover:border-orange-500'
                                            }`}
                                    >
                                        {task.completed && (
                                            <svg className="w-3 h-3 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>

                                    {/* Task Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className={`text-lg font-semibold mb-2 ${task.completed ? 'text-gray-400 line-through' : 'text-white'
                                                    }`}>
                                                    {task.title}
                                                </h3>

                                                {task.description && (
                                                    <p className={`text-sm mb-3 ${task.completed ? 'text-gray-500' : 'text-gray-300'
                                                        }`}>
                                                        {task.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center space-x-4 text-sm text-gray-400">
                                                    {task.deadline && (
                                                        <span className="flex items-center">
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            {formatDate(task.deadline)}
                                                        </span>
                                                    )}

                                                    {task.estimatedTime && (
                                                        <span className="flex items-center">
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            {task.estimatedTime}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2 ml-4">
                                                {/* Priority Badge */}
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                </span>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => handleDeleteTask(task._id)}
                                                    className="text-gray-400 hover:text-red-400 transition duration-200"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* New Task Modal */}
            <NewTaskModal
                isOpen={showNewTaskModal}
                onClose={() => setShowNewTaskModal(false)}
                onSubmit={handleNewTask}
            />
        </div>
    );
};

export default Tasks; 