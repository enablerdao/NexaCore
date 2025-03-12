import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import Notification from './components/Notification';
import routes from './routes';
import { authService } from './services/authService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const userData = await authService.getCurrentUser();
        if (userData) {
          setIsAuthenticated(true);
          setUser(userData);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const userData = await authService.login(credentials);
      setIsAuthenticated(true);
      setUser(userData);
      showNotification('Login successful', 'success');
      return true;
    } catch (error) {
      showNotification(error.message || 'Login failed', 'error');
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setUser(null);
      showNotification('Logout successful', 'success');
    } catch (error) {
      showNotification(error.message || 'Logout failed', 'error');
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ ...notification, show: false });
    }, 5000);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="app">
      <Header 
        isAuthenticated={isAuthenticated} 
        user={user} 
        onLogout={handleLogout} 
        toggleSidebar={toggleSidebar} 
      />
      
      <div className="main-container">
        {isAuthenticated && (
          <Sidebar isOpen={sidebarOpen} user={user} />
        )}
        
        <main className={`content ${isAuthenticated && sidebarOpen ? 'with-sidebar' : ''}`}>
          <Routes>
            {routes.map((route) => {
              // If route requires auth and user is not authenticated, redirect to login
              if (route.requiresAuth && !isAuthenticated) {
                return (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={<Navigate to="/login" replace />}
                  />
                );
              }
              
              // Otherwise, render the route component
              return (
                <Route
                  key={route.path}
                  path={route.path}
                  element={
                    <route.component
                      user={user}
                      showNotification={showNotification}
                      onLogin={handleLogin}
                    />
                  }
                />
              );
            })}
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </main>
      </div>
      
      <Footer />
      
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}
    </div>
  );
}

export default App;