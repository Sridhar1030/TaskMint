import { useNavigate } from 'react-router-dom';
import { authAPI, tokenManager } from '../utils/api';

const Home = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      tokenManager.clearAuth();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear auth anyway
      tokenManager.clearAuth();
      navigate('/login');
    }
  };

  const user = tokenManager.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-800/95 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Welcome to TaskMint!</h1>
        {user && (
          <p className="text-orange-400 text-lg mb-4">Hello, {user.fullName}!</p>
        )}
        <p className="text-gray-400 text-lg mb-8">Your task management journey begins here.</p>
        <div className="space-x-4">
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-gray-700/80 backdrop-blur-sm text-white rounded-lg hover:bg-gray-600/80 transition duration-200"
          >
            Back to Login
          </button>
          <button 
            onClick={() => navigate('/signup')}
            className="px-6 py-2 bg-orange-500/80 backdrop-blur-sm text-white rounded-lg hover:bg-orange-600/80 transition duration-200"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home; 