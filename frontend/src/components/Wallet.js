import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { walletService } from '../services/walletService';
import { format } from '../utils/format';
import '../styles/wallet.css';

const Wallet = ({ showNotification }) => {
  const [wallets, setWallets] = useState([]);
  const [activeWallet, setActiveWallet] = useState(null);
  const [balance, setBalance] = useState({ available: 0, staked: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        setIsLoading(true);
        const walletList = await walletService.getWallets();
        setWallets(walletList);
        
        if (walletList.length > 0) {
          const active = walletList.find(w => w.isActive) || walletList[0];
          setActiveWallet(active);
          
          const walletBalance = await walletService.getBalance(active.address);
          setBalance(walletBalance);
        }
      } catch (error) {
        showNotification(error.message || 'Failed to load wallets', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWallets();
  }, [showNotification]);

  const handleWalletChange = async (walletAddress) => {
    try {
      setIsLoading(true);
      await walletService.setActiveWallet(walletAddress);
      
      const updatedWallets = wallets.map(wallet => ({
        ...wallet,
        isActive: wallet.address === walletAddress
      }));
      
      setWallets(updatedWallets);
      const active = updatedWallets.find(w => w.address === walletAddress);
      setActiveWallet(active);
      
      const walletBalance = await walletService.getBalance(walletAddress);
      setBalance(walletBalance);
      
      showNotification('Wallet switched successfully', 'success');
    } catch (error) {
      showNotification(error.message || 'Failed to switch wallet', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWallet = async (e) => {
    e.preventDefault();
    
    if (!newWalletName.trim()) {
      showNotification('Wallet name is required', 'error');
      return;
    }
    
    try {
      setIsLoading(true);
      const newWallet = await walletService.createWallet(newWalletName);
      
      setWallets([...wallets, newWallet]);
      setShowCreateModal(false);
      setNewWalletName('');
      
      showNotification('Wallet created successfully', 'success');
    } catch (error) {
      showNotification(error.message || 'Failed to create wallet', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && wallets.length === 0) {
    return (
      <div className="wallet-container loading">
        <div className="spinner"></div>
        <p>Loading wallet...</p>
      </div>
    );
  }

  return (
    <div className="wallet-container">
      <div className="wallet-header">
        <div className="wallet-selector">
          <select 
            value={activeWallet?.address || ''}
            onChange={(e) => handleWalletChange(e.target.value)}
            disabled={isLoading}
          >
            {wallets.map(wallet => (
              <option key={wallet.address} value={wallet.address}>
                {wallet.name} ({wallet.address.substring(0, 8)}...{wallet.address.substring(wallet.address.length - 6)})
              </option>
            ))}
          </select>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => setShowCreateModal(true)}
          >
            <span className="material-icons">add</span>
          </button>
        </div>
        
        {activeWallet && (
          <div className="wallet-actions">
            <Link to="/send" className="btn btn-primary">
              <span className="material-icons">send</span> Send
            </Link>
            <Link to="/transactions" className="btn btn-outline">
              <span className="material-icons">history</span> History
            </Link>
          </div>
        )}
      </div>
      
      {activeWallet ? (
        <div className="wallet-content">
          <div className="wallet-balance">
            <div className="balance-card total">
              <h3>Total Balance</h3>
              <div className="balance-amount">
                <span className="amount">{format.formatCurrency(balance.total)}</span>
                <span className="currency">NEXA</span>
              </div>
            </div>
            
            <div className="balance-details">
              <div className="balance-card available">
                <h4>Available</h4>
                <div className="balance-amount">
                  <span className="amount">{format.formatCurrency(balance.available)}</span>
                  <span className="currency">NEXA</span>
                </div>
              </div>
              
              <div className="balance-card staked">
                <h4>Staked</h4>
                <div className="balance-amount">
                  <span className="amount">{format.formatCurrency(balance.staked)}</span>
                  <span className="currency">NEXA</span>
                </div>
                <Link to="/staking" className="btn btn-text">Manage Staking</Link>
              </div>
            </div>
          </div>
          
          <div className="wallet-address">
            <div className="address-container">
              <span className="address-label">Wallet Address:</span>
              <span className="address-value">{activeWallet.address}</span>
              <button 
                className="btn btn-icon" 
                onClick={() => {
                  navigator.clipboard.writeText(activeWallet.address);
                  showNotification('Address copied to clipboard', 'success');
                }}
              >
                <span className="material-icons">content_copy</span>
              </button>
            </div>
            <div className="qr-code">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${activeWallet.address}`} 
                alt="Wallet QR Code" 
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="wallet-empty">
          <span className="material-icons">account_balance_wallet</span>
          <h3>No Wallet Found</h3>
          <p>Create a new wallet to get started</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            Create Wallet
          </button>
        </div>
      )}
      
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Wallet</h3>
              <button 
                className="btn btn-icon" 
                onClick={() => setShowCreateModal(false)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateWallet}>
              <div className="form-group">
                <label htmlFor="wallet-name">Wallet Name</label>
                <input
                  type="text"
                  id="wallet-name"
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  placeholder="Enter wallet name"
                  required
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Wallet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;