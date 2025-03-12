/**
 * Node service for managing and interacting with blockchain nodes
 */

import { api } from './api';

// Get network statistics
const getNetworkStats = async () => {
  try {
    return await api.get('/network/stats');
  } catch (error) {
    throw new Error(error);
  }
};

// Get node statistics for the current user's node
const getNodeStats = async () => {
  try {
    return await api.get('/nodes/stats');
  } catch (error) {
    throw new Error(error);
  }
};

// Get all nodes operated by the current user
const getUserNodes = async () => {
  try {
    return await api.get('/nodes');
  } catch (error) {
    throw new Error(error);
  }
};

// Get a specific node by ID
const getNode = async (nodeId) => {
  try {
    return await api.get(`/nodes/${nodeId}`);
  } catch (error) {
    throw new Error(error);
  }
};

// Register a new node
const registerNode = async (nodeData) => {
  try {
    return await api.post('/nodes', nodeData);
  } catch (error) {
    throw new Error(error);
  }
};

// Update node information
const updateNode = async (nodeId, nodeData) => {
  try {
    return await api.put(`/nodes/${nodeId}`, nodeData);
  } catch (error) {
    throw new Error(error);
  }
};

// Delete a node
const deleteNode = async (nodeId) => {
  try {
    return await api.delete(`/nodes/${nodeId}`);
  } catch (error) {
    throw new Error(error);
  }
};

// Start a node
const startNode = async (nodeId) => {
  try {
    return await api.post(`/nodes/${nodeId}/start`);
  } catch (error) {
    throw new Error(error);
  }
};

// Stop a node
const stopNode = async (nodeId) => {
  try {
    return await api.post(`/nodes/${nodeId}/stop`);
  } catch (error) {
    throw new Error(error);
  }
};

// Restart a node
const restartNode = async (nodeId) => {
  try {
    return await api.post(`/nodes/${nodeId}/restart`);
  } catch (error) {
    throw new Error(error);
  }
};

// Get node logs
const getNodeLogs = async (nodeId, params = {}) => {
  try {
    return await api.get(`/nodes/${nodeId}/logs`, params);
  } catch (error) {
    throw new Error(error);
  }
};

// Get node performance metrics
const getNodeMetrics = async (nodeId, params = {}) => {
  try {
    return await api.get(`/nodes/${nodeId}/metrics`, params);
  } catch (error) {
    throw new Error(error);
  }
};

// Get node validation history
const getValidationHistory = async (nodeId, params = {}) => {
  try {
    return await api.get(`/nodes/${nodeId}/validation-history`, params);
  } catch (error) {
    throw new Error(error);
  }
};

// Get node reward history
const getRewardHistory = async (nodeId, params = {}) => {
  try {
    return await api.get(`/nodes/${nodeId}/reward-history`, params);
  } catch (error) {
    throw new Error(error);
  }
};

// Update node configuration
const updateNodeConfig = async (nodeId, config) => {
  try {
    return await api.put(`/nodes/${nodeId}/config`, config);
  } catch (error) {
    throw new Error(error);
  }
};

// Get node configuration
const getNodeConfig = async (nodeId) => {
  try {
    return await api.get(`/nodes/${nodeId}/config`);
  } catch (error) {
    throw new Error(error);
  }
};

// Get node connection status
const getNodeConnectionStatus = async (nodeId) => {
  try {
    return await api.get(`/nodes/${nodeId}/connection`);
  } catch (error) {
    throw new Error(error);
  }
};

// Get node peers
const getNodePeers = async (nodeId) => {
  try {
    return await api.get(`/nodes/${nodeId}/peers`);
  } catch (error) {
    throw new Error(error);
  }
};

// Get node shard assignment
const getNodeShard = async (nodeId) => {
  try {
    return await api.get(`/nodes/${nodeId}/shard`);
  } catch (error) {
    throw new Error(error);
  }
};

// Request shard reassignment
const requestShardReassignment = async (nodeId, targetShardId) => {
  try {
    return await api.post(`/nodes/${nodeId}/reassign-shard`, { shard_id: targetShardId });
  } catch (error) {
    throw new Error(error);
  }
};

export const nodeService = {
  getNetworkStats,
  getNodeStats,
  getUserNodes,
  getNode,
  registerNode,
  updateNode,
  deleteNode,
  startNode,
  stopNode,
  restartNode,
  getNodeLogs,
  getNodeMetrics,
  getValidationHistory,
  getRewardHistory,
  updateNodeConfig,
  getNodeConfig,
  getNodeConnectionStatus,
  getNodePeers,
  getNodeShard,
  requestShardReassignment
};