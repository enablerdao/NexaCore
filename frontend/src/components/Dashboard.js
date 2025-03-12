import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Chart from './Chart';
import Transaction from './Transaction';
import { walletService } from '../services/walletService';
import { nodeService } from '../services/nodeService';
import { format } from '../utils/format';
import '../styles/dashboard.css';

const Dashboard = ({ user, showNotification }) => {
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [networkStats, setNetworkStats] = useState(null);
  const [nodeStats, setNodeStats] = useState(null);
  const [priceData, setPriceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('1w'); // 1d, 1w, 1m, 1y

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch wallet data
        const wallet = await walletService.getActiveWallet();
        setWalletData(wallet);
        
        // Fetch recent transactions
        const recentTx = await walletService.getTransactions({ limit: 5 });
        setTransactions(recentTx);
        
        // Fetch network statistics
        const network = await nodeService.getNetworkStats();
        setNetworkStats(network);
        
        // Fetch node statistics if user is running a node
        if (user.isNodeOperator) {
          const node = await nodeService.getNodeStats();
          setNodeStats(node);
        }
        
        // Fetch price data for the chart
        const prices = await fetchPriceData(timeRange);
        setPriceData(prices);
      } catch (error) {
        showNotification(error.message || 'Failed to load dashboard data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, showNotification, timeRange]);

  const fetchPriceData = async (range) => {
    // This would be a real API call in production
    // For this example, we'll generate mock data
    const now = new Date();
    const data = [];
    
    let points;
    let interval;
    
    switch (range) {
      case '1d':
        points = 24;
        interval = 60 * 60 * 1000; // 1 hour
        break;
      case '1w':
        points = 7;
        interval = 24 * 60 * 60 * 1000; // 1 day
        break;
      case '1m':
        points = 30;
        interval = 24 * 60 * 60 * 1000; // 1 day
        break;
      case '1y':
        points = 12;
        interval = 30 * 24 * 60 * 60 * 1000; // 1 month
        break;
      default:
        points = 7;
        interval = 24 * 60 * 60 * 1000; // 1 day
    }
    
    // Generate mock price data
    let price = 10 + Math.random() * 5; // Start around $10-15
    
    for (let i = points; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * interval));
      
      // Add some random price movement
      price = price + (Math.random() - 0.5) * 2;
      if (price < 5) price = 5;
      if (price > 20) price = 20;
      
      data.push({
        date: date.toISOString(),
        price: price
      });
    }
    
    return data;
  };

  if (isLoading && !walletData) {
    return (
      <div className="dashboard-container loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="dashboard-actions">
          <Link to="/wallet" className="btn btn-outline">
            <span className="material-icons">account_balance_wallet</span> Wallet
          </Link>
          <Link to="/send" className="btn btn-primary">
            <span className="material-icons">send</span> Send
          </Link>
        </div>
      </div>
      
      <div className="dashboard-grid">
        {/* Wallet Balance Card */}
        <div className="dashboard-card balance-card">
          <div className="card-header">
            <h3>Wallet Balance</h3>
            <Link to="/wallet" className="btn btn-text">View Details</Link>
          </div>
          
          <div className="balance-display">
            <div className="balance-amount">
              <span className="amount">{format.formatCurrency(walletData?.balance?.total || 0)}</span>
              <span className="currency">NEXA</span>
            </div>
            
            <div className="balance-details">
              <div className="balance-item">
                <span className="label">Available:</span>
                <span className="value">{format.formatCurrency(walletData?.balance?.available || 0)} NEXA</span>
              </div>
              <div className="balance-item">
                <span className="label">Staked:</span>
                <span className="value">{format.formatCurrency(walletData?.balance?.staked || 0)} NEXA</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Price Chart Card */}
        <div className="dashboard-card chart-card">
          <div className="card-header">
            <h3>NEXA Price</h3>
            <div className="time-range-selector">
              <button 
                className={timeRange === '1d' ? 'active' : ''} 
                onClick={() => setTimeRange('1d')}
              >
                1D
              </button>
              <button 
                className={timeRange === '1w' ? 'active' : ''} 
                onClick={() => setTimeRange('1w')}
              >
                1W
              </button>
              <button 
                className={timeRange === '1m' ? 'active' : ''} 
                onClick={() => setTimeRange('1m')}
              >
                1M
              </button>
              <button 
                className={timeRange === '1y' ? 'active' : ''} 
                onClick={() => setTimeRange('1y')}
              >
                1Y
              </button>
            </div>
          </div>
          
          <div className="chart-container">
            {priceData ? (
              <Chart 
                data={priceData} 
                type="line" 
                xKey="date" 
                yKey="price" 
                label="Price (USD)" 
              />
            ) : (
              <div className="chart-loading">
                <div className="spinner"></div>
                <p>Loading chart data...</p>
              </div>
            )}
          </div>
          
          <div className="price-info">
            <div className="price-current">
              <span className="label">Current Price:</span>
              <span className="value">${format.formatCurrency(priceData ? priceData[priceData.length - 1].price : 0)}</span>
            </div>
            
            <div className="price-change">
              <span className="label">24h Change:</span>
              <span className={`value ${priceData && priceData[priceData.length - 1].price > priceData[0].price ? 'positive' : 'negative'}`}>
                {priceData ? (((priceData[priceData.length - 1].price - priceData[0].price) / priceData[0].price) * 100).toFixed(2) : 0}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Recent Transactions Card */}
        <div className="dashboard-card transactions-card">
          <div className="card-header">
            <h3>Recent Transactions</h3>
            <Link to="/transactions" className="btn btn-text">View All</Link>
          </div>
          
          <div className="transactions-list">
            {transactions.length > 0 ? (
              transactions.map(tx => (
                <Transaction key={tx.id} transaction={tx} />
              ))
            ) : (
              <div className="empty-state">
                <span className="material-icons">swap_horiz</span>
                <p>No recent transactions</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Network Stats Card */}
        <div className="dashboard-card network-card">
          <div className="card-header">
            <h3>Network Statistics</h3>
            <Link to="/explorer" className="btn btn-text">Explorer</Link>
          </div>
          
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-icon">
                <span className="material-icons">speed</span>
              </span>
              <div className="stat-info">
                <span className="stat-value">{format.formatNumber(networkStats?.tps || 0)}</span>
                <span className="stat-label">TPS</span>
              </div>
            </div>
            
            <div className="stat-item">
              <span className="stat-icon">
                <span className="material-icons">view_module</span>
              </span>
              <div className="stat-info">
                <span className="stat-value">{format.formatNumber(networkStats?.blockHeight || 0)}</span>
                <span className="stat-label">Block Height</span>
              </div>
            </div>
            
            <div className="stat-item">
              <span className="stat-icon">
                <span className="material-icons">device_hub</span>
              </span>
              <div className="stat-info">
                <span className="stat-value">{format.formatNumber(networkStats?.nodeCount || 0)}</span>
                <span className="stat-label">Nodes</span>
              </div>
            </div>
            
            <div className="stat-item">
              <span className="stat-icon">
                <span className="material-icons">group</span>
              </span>
              <div className="stat-info">
                <span className="stat-value">{format.formatNumber(networkStats?.validatorCount || 0)}</span>
                <span className="stat-label">Validators</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Node Stats Card (only shown for node operators) */}
        {user.isNodeOperator && nodeStats && (
          <div className="dashboard-card node-card">
            <div className="card-header">
              <h3>Your Node</h3>
              <Link to="/nodes" className="btn btn-text">Manage</Link>
            </div>
            
            <div className="node-status">
              <div className="status-indicator">
                <span className={`indicator ${nodeStats.status === 'online' ? 'online' : 'offline'}`}></span>
                <span className="status-text">{nodeStats.status === 'online' ? 'Online' : 'Offline'}</span>
              </div>
              
              <div className="node-uptime">
                <span className="label">Uptime:</span>
                <span className="value">{format.formatDuration(nodeStats.uptime)}</span>
              </div>
            </div>
            
            <div className="node-stats">
              <div className="node-stat">
                <span className="label">Contribution Score:</span>
                <span className="value">{nodeStats.contributionScore}</span>
              </div>
              
              <div className="node-stat">
                <span className="label">Validated Blocks:</span>
                <span className="value">{format.formatNumber(nodeStats.validatedBlocks)}</span>
              </div>
              
              <div className="node-stat">
                <span className="label">Rewards (24h):</span>
                <span className="value">{format.formatCurrency(nodeStats.rewards24h)} NEXA</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Staking Card */}
        <div className="dashboard-card staking-card">
          <div className="card-header">
            <h3>Staking</h3>
            <Link to="/staking" className="btn btn-text">Manage</Link>
          </div>
          
          <div className="staking-info">
            <div className="staking-amount">
              <span className="label">Total Staked:</span>
              <span className="value">{format.formatCurrency(walletData?.balance?.staked || 0)} NEXA</span>
            </div>
            
            <div className="staking-rewards">
              <span className="label">Rewards (30d):</span>
              <span className="value">{format.formatCurrency(walletData?.stakingRewards || 0)} NEXA</span>
            </div>
            
            <div className="staking-apy">
              <span className="label">Current APY:</span>
              <span className="value">{networkStats?.stakingApy || 0}%</span>
            </div>
          </div>
          
          <div className="staking-actions">
            <Link to="/staking" className="btn btn-primary">Stake More</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;