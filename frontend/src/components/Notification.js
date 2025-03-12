import React, { useState, useEffect } from 'react';
import '../styles/global.css';

const Notification = ({ message, type = 'info', duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    // Start the progress bar
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prevProgress - (100 / (duration / 100));
      });
    }, 100);

    setIntervalId(interval);

    // Set a timeout to close the notification
    const timeout = setTimeout(() => {
      handleClose();
    }, duration);

    // Clean up on unmount
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    if (intervalId) {
      clearInterval(intervalId);
    }
    if (onClose) {
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`notification notification-${type}`}>
      <div className="notification-icon">
        <span className="material-icons">{getIcon()}</span>
      </div>
      
      <div className="notification-content">
        <div className="notification-message">{message}</div>
        <div className="notification-progress-bar">
          <div 
            className="notification-progress" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      <button className="notification-close" onClick={handleClose}>
        <span className="material-icons">close</span>
      </button>
    </div>
  );
};

export default Notification;