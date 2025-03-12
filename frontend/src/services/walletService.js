/**
 * Wallet service for managing wallets and transactions
 */

import { api } from './api';

// Get all wallets for the current user
const getWallets = async () => {
  try {
    return await api.get('/wallets');
  } catch (error) {
    throw new Error(error);
  }
};

// Get a specific wallet by address
const getWallet = async (address) => {
  try {
    return await api.get(`/wallets/${address}`);
  } catch (error) {
    throw new Error(error);
  }
};

// Get the active wallet
const getActiveWallet = async () => {
  try {
    return await api.get('/wallets/active');
  } catch (error) {
    throw new Error(error);
  }
};

// Create a new wallet
const createWallet = async (name) => {
  try {
    return await api.post('/wallets', { name });
  } catch (error) {
    throw new Error(error);
  }
};

// Import a wallet using private key
const importWallet = async (name, privateKey) => {
  try {
    return await api.post('/wallets/import', { name, private_key: privateKey });
  } catch (error) {
    throw new Error(error);
  }
};

// Set a wallet as active
const setActiveWallet = async (address) => {
  try {
    return await api.post(`/wallets/${address}/activate`);
  } catch (error) {
    throw new Error(error);
  }
};

// Update wallet name
const updateWallet = async (address, name) => {
  try {
    return await api.put(`/wallets/${address}`, { name });
  } catch (error) {
    throw new Error(error);
  }
};

// Delete a wallet
const deleteWallet = async (address) => {
  try {
    return await api.delete(`/wallets/${address}`);
  } catch (error) {
    throw new Error(error);
  }
};

// Get wallet balance
const getBalance = async (address) => {
  try {
    return await api.get(`/wallets/${address}/balance`);
  } catch (error) {
    throw new Error(error);
  }
};

// Get wallet transactions
const getTransactions = async (params = {}) => {
  try {
    return await api.get('/transactions', params);
  } catch (error) {
    throw new Error(error);
  }
};

// Get a specific transaction
const getTransaction = async (id) => {
  try {
    return await api.get(`/transactions/${id}`);
  } catch (error) {
    throw new Error(error);
  }
};

// Send a transaction
const sendTransaction = async (data) => {
  try {
    return await api.post('/transactions', data);
  } catch (error) {
    throw new Error(error);
  }
};

// Get transaction fee estimate
const estimateFee = async (data) => {
  try {
    return await api.post('/transactions/estimate-fee', data);
  } catch (error) {
    throw new Error(error);
  }
};

// Export wallet (returns encrypted private key)
const exportWallet = async (address, password) => {
  try {
    return await api.post(`/wallets/${address}/export`, { password });
  } catch (error) {
    throw new Error(error);
  }
};

// Backup all wallets
const backupWallets = async (password) => {
  try {
    return await api.post('/wallets/backup', { password });
  } catch (error) {
    throw new Error(error);
  }
};

// Restore wallets from backup
const restoreWallets = async (backup, password) => {
  try {
    return await api.post('/wallets/restore', { backup, password });
  } catch (error) {
    throw new Error(error);
  }
};

// Get staking information
const getStakingInfo = async (address) => {
  try {
    return await api.get(`/wallets/${address}/staking`);
  } catch (error) {
    throw new Error(error);
  }
};

// Stake tokens
const stakeTokens = async (address, amount) => {
  try {
    return await api.post(`/wallets/${address}/stake`, { amount });
  } catch (error) {
    throw new Error(error);
  }
};

// Unstake tokens
const unstakeTokens = async (address, amount) => {
  try {
    return await api.post(`/wallets/${address}/unstake`, { amount });
  } catch (error) {
    throw new Error(error);
  }
};

// Claim staking rewards
const claimRewards = async (address) => {
  try {
    return await api.post(`/wallets/${address}/claim-rewards`);
  } catch (error) {
    throw new Error(error);
  }
};

export const walletService = {
  getWallets,
  getWallet,
  getActiveWallet,
  createWallet,
  importWallet,
  setActiveWallet,
  updateWallet,
  deleteWallet,
  getBalance,
  getTransactions,
  getTransaction,
  sendTransaction,
  estimateFee,
  exportWallet,
  backupWallets,
  restoreWallets,
  getStakingInfo,
  stakeTokens,
  unstakeTokens,
  claimRewards
};