import React from 'react';
import { Link } from 'react-router-dom';
import { format } from '../utils/format';
import '../styles/global.css';

const Transaction = ({ transaction, showDetails = false }) => {
  const {
    id,
    type,
    status,
    amount,
    fee,
    timestamp,
    from,
    to,
    hash,
    blockNumber,
    confirmations
  } = transaction;

  const getStatusClass = () => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed';
      case 'pending':
        return 'status-pending';
      case 'failed':
        return 'status-failed';
      default:
        return '';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'send':
        return 'call_made';
      case 'receive':
        return 'call_received';
      case 'stake':
        return 'savings';
      case 'unstake':
        return 'savings';
      case 'contract':
        return 'code';
      default:
        return 'swap_horiz';
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'send':
        return 'Sent';
      case 'receive':
        return 'Received';
      case 'stake':
        return 'Staked';
      case 'unstake':
        return 'Unstaked';
      case 'contract':
        return 'Contract';
      default:
        return 'Transaction';
    }
  };

  const getAmountPrefix = () => {
    return type === 'send' || type === 'stake' ? '-' : type === 'receive' || type === 'unstake' ? '+' : '';
  };

  const getAmountClass = () => {
    return type === 'send' || type === 'stake' ? 'amount-negative' : type === 'receive' || type === 'unstake' ? 'amount-positive' : '';
  };

  return (
    <div className={`transaction ${showDetails ? 'transaction-detailed' : ''}`}>
      {!showDetails ? (
        // Compact view for transaction lists
        <Link to={`/transactions/${id}`} className="transaction-link">
          <div className="transaction-icon">
            <span className="material-icons">{getTypeIcon()}</span>
          </div>
          
          <div className="transaction-info">
            <div className="transaction-primary">
              <span className="transaction-type">{getTypeLabel()}</span>
              <span className={`transaction-amount ${getAmountClass()}`}>
                {getAmountPrefix()}{format.formatCurrency(amount)} NEXA
              </span>
            </div>
            
            <div className="transaction-secondary">
              <span className="transaction-date">{format.formatDate(timestamp)}</span>
              <span className={`transaction-status ${getStatusClass()}`}>{status}</span>
            </div>
          </div>
        </Link>
      ) : (
        // Detailed view for transaction details page
        <div className="transaction-detailed-content">
          <div className="transaction-header">
            <div className="transaction-icon-large">
              <span className="material-icons">{getTypeIcon()}</span>
            </div>
            
            <div className="transaction-title">
              <h2>{getTypeLabel()}</h2>
              <span className={`transaction-status ${getStatusClass()}`}>{status}</span>
            </div>
            
            <div className="transaction-amount-large">
              <span className={getAmountClass()}>
                {getAmountPrefix()}{format.formatCurrency(amount)} NEXA
              </span>
              {fee > 0 && (
                <span className="transaction-fee">
                  Fee: {format.formatCurrency(fee)} NEXA
                </span>
              )}
            </div>
          </div>
          
          <div className="transaction-details">
            <div className="detail-row">
              <span className="detail-label">Date:</span>
              <span className="detail-value">{format.formatDateTime(timestamp)}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">From:</span>
              <span className="detail-value address">
                {from}
                <button 
                  className="btn btn-icon" 
                  onClick={() => {
                    navigator.clipboard.writeText(from);
                  }}
                >
                  <span className="material-icons">content_copy</span>
                </button>
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">To:</span>
              <span className="detail-value address">
                {to}
                <button 
                  className="btn btn-icon" 
                  onClick={() => {
                    navigator.clipboard.writeText(to);
                  }}
                >
                  <span className="material-icons">content_copy</span>
                </button>
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Transaction Hash:</span>
              <span className="detail-value hash">
                {hash}
                <button 
                  className="btn btn-icon" 
                  onClick={() => {
                    navigator.clipboard.writeText(hash);
                  }}
                >
                  <span className="material-icons">content_copy</span>
                </button>
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Block:</span>
              <span className="detail-value">
                <Link to={`/explorer/block/${blockNumber}`}>
                  {blockNumber}
                </Link>
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Confirmations:</span>
              <span className="detail-value">{confirmations}</span>
            </div>
          </div>
          
          <div className="transaction-actions">
            <Link to={`/explorer/tx/${hash}`} className="btn btn-outline">
              <span className="material-icons">explore</span> View in Explorer
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transaction;