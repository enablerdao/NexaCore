/**
 * Contract service for managing and interacting with smart contracts
 */

import { api } from './api';

// Get all contracts for the current user
const getUserContracts = async () => {
  try {
    return await api.get('/contracts');
  } catch (error) {
    throw new Error(error);
  }
};

// Get a specific contract by address
const getContract = async (address) => {
  try {
    return await api.get(`/contracts/${address}`);
  } catch (error) {
    throw new Error(error);
  }
};

// Deploy a new contract
const deployContract = async (contractData) => {
  try {
    return await api.post('/contracts', contractData);
  } catch (error) {
    throw new Error(error);
  }
};

// Call a contract method (read-only)
const callContractMethod = async (address, method, params = []) => {
  try {
    return await api.post(`/contracts/${address}/call`, { method, params });
  } catch (error) {
    throw new Error(error);
  }
};

// Execute a contract method (state-changing)
const executeContractMethod = async (address, method, params = [], value = 0) => {
  try {
    return await api.post(`/contracts/${address}/execute`, { method, params, value });
  } catch (error) {
    throw new Error(error);
  }
};

// Get contract events
const getContractEvents = async (address, eventName = null, params = {}) => {
  try {
    const queryParams = { ...params };
    if (eventName) {
      queryParams.event = eventName;
    }
    return await api.get(`/contracts/${address}/events`, queryParams);
  } catch (error) {
    throw new Error(error);
  }
};

// Get contract transaction history
const getContractTransactions = async (address, params = {}) => {
  try {
    return await api.get(`/contracts/${address}/transactions`, params);
  } catch (error) {
    throw new Error(error);
  }
};

// Verify contract source code
const verifyContract = async (address, sourceCode, compilerVersion, optimizationUsed = false) => {
  try {
    return await api.post(`/contracts/${address}/verify`, {
      source_code: sourceCode,
      compiler_version: compilerVersion,
      optimization_used: optimizationUsed
    });
  } catch (error) {
    throw new Error(error);
  }
};

// Get contract source code (if verified)
const getContractSource = async (address) => {
  try {
    return await api.get(`/contracts/${address}/source`);
  } catch (error) {
    throw new Error(error);
  }
};

// Get contract ABI
const getContractABI = async (address) => {
  try {
    return await api.get(`/contracts/${address}/abi`);
  } catch (error) {
    throw new Error(error);
  }
};

// Estimate gas for contract method execution
const estimateGas = async (address, method, params = [], value = 0) => {
  try {
    return await api.post(`/contracts/${address}/estimate-gas`, {
      method,
      params,
      value
    });
  } catch (error) {
    throw new Error(error);
  }
};

// Compile contract source code
const compileContract = async (sourceCode, compilerVersion, optimizationUsed = false) => {
  try {
    return await api.post('/contracts/compile', {
      source_code: sourceCode,
      compiler_version: compilerVersion,
      optimization_used: optimizationUsed
    });
  } catch (error) {
    throw new Error(error);
  }
};

// Get available compiler versions
const getCompilerVersions = async () => {
  try {
    return await api.get('/contracts/compiler-versions');
  } catch (error) {
    throw new Error(error);
  }
};

// Debug a contract transaction
const debugTransaction = async (txHash) => {
  try {
    return await api.get(`/contracts/debug/${txHash}`);
  } catch (error) {
    throw new Error(error);
  }
};

// Get contract templates
const getContractTemplates = async () => {
  try {
    return await api.get('/contracts/templates');
  } catch (error) {
    throw new Error(error);
  }
};

// Get a specific contract template
const getContractTemplate = async (templateId) => {
  try {
    return await api.get(`/contracts/templates/${templateId}`);
  } catch (error) {
    throw new Error(error);
  }
};

export const contractService = {
  getUserContracts,
  getContract,
  deployContract,
  callContractMethod,
  executeContractMethod,
  getContractEvents,
  getContractTransactions,
  verifyContract,
  getContractSource,
  getContractABI,
  estimateGas,
  compileContract,
  getCompilerVersions,
  debugTransaction,
  getContractTemplates,
  getContractTemplate
};