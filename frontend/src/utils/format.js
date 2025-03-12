/**
 * Utility functions for formatting data
 */

// Format a number with commas as thousands separators
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Format a currency value with 2 decimal places
const formatCurrency = (value, decimals = 2) => {
  if (value === undefined || value === null) return '0.00';
  
  const num = parseFloat(value);
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Format a date (YYYY-MM-DD)
const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// Format a short date (MM/DD)
const formatShortDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${month}/${day}`;
};

// Format a date and time (YYYY-MM-DD HH:MM:SS)
const formatDateTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Format a time (HH:MM:SS)
const formatTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
};

// Format a duration in seconds to a human-readable string
const formatDuration = (seconds) => {
  if (seconds === undefined || seconds === null) return '0s';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
};

// Format a file size in bytes to a human-readable string
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format an address to a shortened form
const formatAddress = (address, start = 6, end = 4) => {
  if (!address) return '';
  if (address.length <= start + end) return address;
  
  return `${address.substring(0, start)}...${address.substring(address.length - end)}`;
};

// Format a percentage
const formatPercent = (value, decimals = 2) => {
  if (value === undefined || value === null) return '0%';
  
  return `${parseFloat(value).toFixed(decimals)}%`;
};

export const format = {
  formatNumber,
  formatCurrency,
  formatDate,
  formatShortDate,
  formatDateTime,
  formatTime,
  formatDuration,
  formatFileSize,
  formatAddress,
  formatPercent
};