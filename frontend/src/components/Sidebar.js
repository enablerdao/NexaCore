import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import '../styles/global.css';

const Sidebar = ({ isOpen, user }) => {
  const location = useLocation();
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  const menuItems = [
    {
      section: 'main',
      title: 'Main',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
        { name: 'Wallet', path: '/wallet', icon: 'account_balance_wallet' },
        { name: 'Transactions', path: '/transactions', icon: 'swap_horiz' },
        { name: 'Send', path: '/send', icon: 'send' },
      ]
    },
    {
      section: 'network',
      title: 'Network',
      items: [
        { name: 'Explorer', path: '/explorer', icon: 'explore' },
        { name: 'Nodes', path: '/nodes', icon: 'device_hub' },
        { name: 'Staking', path: '/staking', icon: 'savings' },
        { name: 'Governance', path: '/governance', icon: 'how_to_vote' },
      ]
    },
    {
      section: 'development',
      title: 'Development',
      items: [
        { name: 'Smart Contracts', path: '/contracts', icon: 'code' },
        { name: 'Marketplace', path: '/marketplace', icon: 'store' },
      ]
    },
    {
      section: 'account',
      title: 'Account',
      items: [
        { name: 'Profile', path: '/profile', icon: 'person' },
        { name: 'History', path: '/history', icon: 'history' },
        { name: 'Settings', path: '/settings', icon: 'settings' },
        { name: 'Support', path: '/support', icon: 'help' },
      ]
    }
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-user">
        <img 
          src={user?.avatar || '/assets/images/default-avatar.png'} 
          alt={user?.name || 'User'} 
          className="sidebar-avatar" 
        />
        <div className="sidebar-user-info">
          <h3>{user?.name || 'User'}</h3>
          <p>{user?.email || 'user@example.com'}</p>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((section) => (
          <div key={section.section} className="sidebar-section">
            <div 
              className="sidebar-section-header" 
              onClick={() => toggleSection(section.section)}
            >
              <h4>{section.title}</h4>
              <span className="material-icons">
                {expandedSection === section.section ? 'expand_less' : 'expand_more'}
              </span>
            </div>
            
            <ul className={`sidebar-menu ${expandedSection === section.section ? 'expanded' : ''}`}>
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavLink 
                    to={item.path} 
                    className={({ isActive }) => isActive ? 'active' : ''}
                  >
                    <span className="material-icons">{item.icon}</span>
                    <span className="menu-text">{item.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <div className="network-status">
          <span className="status-indicator online"></span>
          <span>Network: Online</span>
        </div>
        <div className="version-info">
          <span>NexaCore v0.1.0</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;