import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  LogOut,
  Plus,
  List,
  User,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../context/AuthContext';
import AgentCreator from './AgentCreator';
import AgentList from './AgentList';

type View = 'create' | 'list';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [currentView, setCurrentView] = useState<View>('create');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Synthient
                </h1>
                <p className="text-xs text-gray-500">Agent Builder</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={() => setCurrentView('create')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  currentView === 'create'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Create Agent</span>
              </button>
              <button
                onClick={() => setCurrentView('list')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  currentView === 'list'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="w-4 h-4" />
                <span>My Agents</span>
              </button>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-10 h-10 rounded-full border-2 border-gray-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200">
          <div className="flex">
            <button
              onClick={() => setCurrentView('create')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 font-medium transition-all ${
                currentView === 'create'
                  ? 'bg-purple-100 text-purple-700 border-b-2 border-purple-700'
                  : 'text-gray-600'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Create</span>
            </button>
            <button
              onClick={() => setCurrentView('list')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 font-medium transition-all ${
                currentView === 'list'
                  ? 'bg-purple-100 text-purple-700 border-b-2 border-purple-700'
                  : 'text-gray-600'
              }`}
            >
              <List className="w-4 h-4" />
              <span>My Agents</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        {currentView === 'create' && (
          <div className="mb-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-8 text-white animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">
                    Welcome back, {user?.name?.split(' ')[0]}!
                  </h2>
                </div>
                <p className="text-purple-100 max-w-2xl">
                  Create production-ready AI agents in 20-35 minutes with extended thinking capabilities.
                  Powered by collective intelligence that learns from every build.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content Views */}
        {currentView === 'create' && <AgentCreator />}
        {currentView === 'list' && <AgentList />}
      </main>
    </div>
  );
}
