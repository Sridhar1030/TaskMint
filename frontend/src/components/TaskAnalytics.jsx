import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Try to import recharts, if it fails, we'll use fallback components
let LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer;
let hasRecharts = false;

try {
    const recharts = require('recharts');
    ({
        LineChart,
        Line,
        AreaChart,
        Area,
        BarChart,
        Bar,
        PieChart,
        Pie,
        Cell,
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip,
        Legend,
        ResponsiveContainer
    } = recharts);
    hasRecharts = true;
} catch (error) {
    console.log('Recharts not available, using fallback charts');
    hasRecharts = false;
}

// Fallback chart components
const FallbackBarChart = ({ data, title }) => {
    const maxValue = Math.max(...data.map(item => Math.max(item.total || 0, item.completed || 0)));
    
    return (
        <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-400">{title}</h4>
            <div className="space-y-3">
                {data.map((item, index) => (
                    <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-300">{item.priority}</span>
                            <span className="text-gray-400">{item.total} total, {item.completed} completed</span>
                        </div>
                        <div className="relative h-6 bg-gray-700 rounded">
                            <div 
                                className="absolute h-full bg-gray-500 rounded"
                                style={{ width: `${(item.total / maxValue) * 100}%` }}
                            />
                            <div 
                                className="absolute h-full bg-green-500 rounded"
                                style={{ width: `${(item.completed / maxValue) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const FallbackPieChart = ({ data, title }) => {
    const total = data.reduce((sum, item) => sum + item.total, 0);
    let currentAngle = 0;
    
    return (
        <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-400">{title}</h4>
            <div className="flex items-center space-x-6">
                <div className="relative w-32 h-32">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {data.map((item, index) => {
                            const percentage = item.total / total;
                            const angle = percentage * 360;
                            const x1 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
                            const y1 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
                            const x2 = 50 + 40 * Math.cos(((currentAngle + angle) * Math.PI) / 180);
                            const y2 = 50 + 40 * Math.sin(((currentAngle + angle) * Math.PI) / 180);
                            const largeArc = angle > 180 ? 1 : 0;
                            
                            const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
                            
                            currentAngle += angle;
                            
                            return (
                                <path
                                    key={index}
                                    d={pathData}
                                    fill={item.fill}
                                    className="opacity-80"
                                />
                            );
                        })}
                    </svg>
                </div>
                <div className="space-y-2">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <div 
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: item.fill }}
                            />
                            <span className="text-sm text-gray-300">{item.priority}: {item.total}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const FallbackAreaChart = ({ data, title }) => {
    const maxValue = Math.max(...data.map(item => Math.max(item.created || 0, item.completed || 0)));
    
    return (
        <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-400">{title}</h4>
            <div className="space-y-3">
                {data.map((item, index) => (
                    <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-300">{item.month}</span>
                            <span className="text-gray-400">Created: {item.created}, Completed: {item.completed}</span>
                        </div>
                        <div className="relative h-4 bg-gray-700 rounded overflow-hidden">
                            <div 
                                className="absolute h-full bg-blue-500 opacity-60"
                                style={{ width: `${(item.created / maxValue) * 100}%` }}
                            />
                            <div 
                                className="absolute h-full bg-green-500 opacity-80"
                                style={{ width: `${(item.completed / maxValue) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TaskAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Get user ID and type from localStorage
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
                userId = userInfo.id;
                userType = 'gmail';
            }

            if (!userId) {
                setError('User not authenticated');
                setIsLoading(false);
                return;
            }

            const response = await axios.get(`${import.meta.env.VITE_API}/api/tasks/analytics`, {
                params: { userId, userType }
            });

            setAnalytics(response.data.analytics);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setError('Failed to load analytics data');
        } finally {
            setIsLoading(false);
        }
    };

    const formatCompletionTime = (hours) => {
        if (hours < 1) {
            return `${Math.round(hours * 60)}m`;
        } else if (hours < 24) {
            return `${Math.round(hours * 10) / 10}h`;
        } else {
            const days = Math.floor(hours / 24);
            const remainingHours = Math.round(hours % 24);
            return `${days}d ${remainingHours}h`;
        }
    };

    const priorityColors = {
        low: '#10B981',
        medium: '#F59E0B',
        high: '#EF4444',
        urgent: '#DC2626'
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-800/95 backdrop-blur-sm flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-800/95 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
                    <p className="text-red-400 text-lg mb-4">{error}</p>
                    <button
                        onClick={fetchAnalytics}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!analytics) return null;

    const priorityData = Object.entries(analytics.priorityAnalysis).map(([priority, data]) => ({
        priority: priority.charAt(0).toUpperCase() + priority.slice(1),
        total: data.total,
        completed: data.completed,
        completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
        fill: priorityColors[priority]
    }));

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-800/95 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Task Analytics</h1>
                    <p className="text-gray-400">Insights into your productivity and task completion patterns</p>
                    
                </div>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total Tasks</p>
                                <p className="text-3xl font-bold text-white">{analytics.totalTasks}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Completed Tasks</p>
                                <p className="text-3xl font-bold text-green-400">{analytics.completedTasks}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Completion Rate</p>
                                <p className="text-3xl font-bold text-orange-400">{analytics.completionRate}%</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Avg. Completion Time</p>
                                <p className="text-3xl font-bold text-purple-400">
                                    {formatCompletionTime(analytics.avgCompletionTimeHours)}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Monthly Tasks Chart */}
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Monthly Overview</h3>
                        {hasRecharts ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={analytics.monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis 
                                        dataKey="month" 
                                        stroke="#9CA3AF"
                                        fontSize={12}
                                    />
                                    <YAxis stroke="#9CA3AF" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px',
                                            color: '#F3F4F6'
                                        }}
                                    />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="created"
                                        stackId="1"
                                        stroke="#3B82F6"
                                        fill="#3B82F6"
                                        fillOpacity={0.6}
                                        name="Created"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="completed"
                                        stackId="2"
                                        stroke="#10B981"
                                        fill="#10B981"
                                        fillOpacity={0.8}
                                        name="Completed"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <FallbackAreaChart data={analytics.monthlyData} title="" />
                        )}
                    </div>

                    {/* Priority Distribution */}
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Priority Distribution</h3>
                        {hasRecharts ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={priorityData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        dataKey="total"
                                        label={({priority, total}) => `${priority}: ${total}`}
                                    >
                                        {priorityData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px',
                                            color: '#F3F4F6'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <FallbackPieChart data={priorityData} title="" />
                        )}
                    </div>
                </div>

                {/* Priority Completion Rates */}
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6 mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Completion Rate by Priority</h3>
                    {hasRecharts ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={priorityData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis 
                                    dataKey="priority" 
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                />
                                <YAxis stroke="#9CA3AF" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1F2937',
                                        border: '1px solid #374151',
                                        borderRadius: '8px',
                                        color: '#F3F4F6'
                                    }}
                                    formatter={(value, name) => [
                                        name === 'completionRate' ? `${value}%` : value,
                                        name === 'completionRate' ? 'Completion Rate' : 
                                        name === 'completed' ? 'Completed' : 'Total'
                                    ]}
                                />
                                <Legend />
                                <Bar dataKey="total" fill="#6B7280" name="Total Tasks" />
                                <Bar dataKey="completed" fill="#10B981" name="Completed Tasks" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <FallbackBarChart data={priorityData} title="" />
                    )}
                </div>

                {/* Recent Completions */}
                {analytics.recentCompletions && analytics.recentCompletions.length > 0 && (
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Recent Completions</h3>
                        <div className="space-y-3">
                            {analytics.recentCompletions.slice(0, 5).map((task) => (
                                <div key={task._id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                                    <div className="flex-1">
                                        <h4 className="text-white font-medium">{task.title}</h4>
                                        <p className="text-gray-400 text-sm">
                                            Completed on {new Date(task.completedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                                            task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                            task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-green-500/20 text-green-400'
                                        }`}>
                                            {task.priority}
                                        </span>
                                        <p className="text-purple-400 text-sm mt-1">
                                            {formatCompletionTime(task.completionTimeHours)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskAnalytics;