import React, { useEffect, useRef } from 'react';
import '../styles/global.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium', 
  showCloseButton = true,
  closeOnOutsideClick = true,
  closeOnEsc = true,
  footer = null
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEsc = (event) => {
      if (closeOnEsc && event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto'; // Restore scrolling when modal is closed
    };
  }, [isOpen, onClose, closeOnEsc]);

  const handleOutsideClick = (event) => {
    if (closeOnOutsideClick && modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  const sizeClass = `modal-${size}`;

  return (
    <div className="modal-overlay" onClick={handleOutsideClick}>
      <div className={`modal ${sizeClass}`} ref={modalRef}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          {showCloseButton && (
            <button className="modal-close" onClick={onClose}>
              <span className="material-icons">close</span>
            </button>
          )}
        </div>
        
        <div className="modal-body">
          {children}
        </div>
        
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;