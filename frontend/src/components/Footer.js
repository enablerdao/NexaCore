import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/global.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>NexaCore</h3>
          <p>Next-generation blockchain platform with AI integration, sharding, and zk-SNARKs.</p>
          <div className="social-links">
            <a href="https://github.com/enablerdao/NexaCore" target="_blank" rel="noopener noreferrer">
              <span className="material-icons">code</span>
            </a>
            <a href="https://twitter.com/nexacore" target="_blank" rel="noopener noreferrer">
              <span className="material-icons">alternate_email</span>
            </a>
            <a href="https://discord.gg/nexacore" target="_blank" rel="noopener noreferrer">
              <span className="material-icons">forum</span>
            </a>
            <a href="https://t.me/nexacore" target="_blank" rel="noopener noreferrer">
              <span className="material-icons">send</span>
            </a>
          </div>
        </div>
        
        <div className="footer-section">
          <h3>Resources</h3>
          <ul>
            <li><Link to="/explorer">Block Explorer</Link></li>
            <li><a href="https://docs.nexacore.io" target="_blank" rel="noopener noreferrer">Documentation</a></li>
            <li><a href="https://github.com/enablerdao/NexaCore" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            <li><Link to="/support">Support</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Products</h3>
          <ul>
            <li><Link to="/wallet">Wallet</Link></li>
            <li><Link to="/staking">Staking</Link></li>
            <li><Link to="/governance">Governance</Link></li>
            <li><Link to="/marketplace">Marketplace</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Company</h3>
          <ul>
            <li><a href="https://nexacore.io/about" target="_blank" rel="noopener noreferrer">About</a></li>
            <li><a href="https://nexacore.io/careers" target="_blank" rel="noopener noreferrer">Careers</a></li>
            <li><a href="https://nexacore.io/blog" target="_blank" rel="noopener noreferrer">Blog</a></li>
            <li><a href="https://nexacore.io/contact" target="_blank" rel="noopener noreferrer">Contact</a></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="footer-legal">
          <p>&copy; {currentYear} NexaCore. All rights reserved.</p>
          <div className="legal-links">
            <a href="https://nexacore.io/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>
            <a href="https://nexacore.io/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;