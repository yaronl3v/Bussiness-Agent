import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/index.js';
import { useToast } from './hooks/useToast.js';
import { ToastContainer } from './components/ui/Toast.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import AgentsList from './pages/agents/AgentsList.jsx';
import AgentDetail from './pages/agents/AgentDetail.jsx';
import DataManager from './pages/agents/DataManager.jsx';
import WhatsAppConnection from './pages/agents/WhatsAppConnection.jsx';
import Configuration from './pages/agents/Configuration.jsx';
import TestChat from './pages/agents/TestChat.jsx';
import Leads from './pages/agents/Leads.jsx';
import Conversations from './pages/agents/Conversations.jsx';

// Protected Route component
function ProtectedRoute({ children }) {
  return authService.isAuthenticated() ? children : <Navigate to="/login" />;
}

// Public Route component (redirect to agents if authenticated)
function PublicRoute({ children }) {
  return !authService.isAuthenticated() ? children : <Navigate to="/agents" />;
}

function App() {
  const { toasts, removeToast } = useToast();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Auth routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          
          {/* Protected routes */}
          <Route 
            path="/agents" 
            element={
              <ProtectedRoute>
                <AgentsList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/agents/:agentId" 
            element={
              <ProtectedRoute>
                <AgentDetail />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="data" />} />
            <Route path="data" element={<DataManager />} />
            <Route path="whatsapp" element={<WhatsAppConnection />} />
            <Route path="config" element={<Configuration />} />
            <Route path="test-chat" element={<TestChat />} />
            <Route path="leads" element={<Leads />} />
            <Route path="conversations" element={<Conversations />} />
          </Route>
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/agents" />} />
        </Routes>
        
        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </Router>
  );
}

export default App;