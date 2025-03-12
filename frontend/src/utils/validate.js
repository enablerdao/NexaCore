/**
 * Utility functions for validating data
 */

// Check if a value is empty (null, undefined, empty string, empty array, empty object)
const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// Check if a value is a valid email address
const isEmail = (value) => {
  if (isEmpty(value)) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

// Check if a value is a valid URL
const isUrl = (value) => {
  if (isEmpty(value)) return false;
  
  try {
    new URL(value);
    return true;
  } catch (e) {
    return false;
  }
};

// Check if a value is a valid number
const isNumber = (value) => {
  if (isEmpty(value)) return false;
  return !isNaN(parseFloat(value)) && isFinite(value);
};

// Check if a value is a valid integer
const isInteger = (value) => {
  if (isEmpty(value)) return false;
  return Number.isInteger(Number(value));
};

// Check if a value is a valid positive number
const isPositive = (value) => {
  return isNumber(value) && parseFloat(value) > 0;
};

// Check if a value is a valid non-negative number
const isNonNegative = (value) => {
  return isNumber(value) && parseFloat(value) >= 0;
};

// Check if a value is within a range
const isInRange = (value, min, max) => {
  if (!isNumber(value)) return false;
  
  const num = parseFloat(value);
  return num >= min && num <= max;
};

// Check if a value has a minimum length
const hasMinLength = (value, minLength) => {
  if (isEmpty(value)) return false;
  return String(value).length >= minLength;
};

// Check if a value has a maximum length
const hasMaxLength = (value, maxLength) => {
  if (isEmpty(value)) return false;
  return String(value).length <= maxLength;
};

// Check if a value matches a regular expression pattern
const matchesPattern = (value, pattern) => {
  if (isEmpty(value)) return false;
  
  const regex = new RegExp(pattern);
  return regex.test(value);
};

// Check if a value is a valid blockchain address (simplified example)
const isAddress = (value) => {
  if (isEmpty(value)) return false;
  
  // This is a simplified check for Ethereum-like addresses
  // In a real application, you would use a more sophisticated validation
  return /^0x[a-fA-F0-9]{40}$/.test(value);
};

// Check if a value is a valid transaction hash (simplified example)
const isTransactionHash = (value) => {
  if (isEmpty(value)) return false;
  
  // This is a simplified check for Ethereum-like transaction hashes
  // In a real application, you would use a more sophisticated validation
  return /^0x[a-fA-F0-9]{64}$/.test(value);
};

// Check if a value is a valid password (example requirements)
const isStrongPassword = (value) => {
  if (isEmpty(value)) return false;
  
  // At least 8 characters, containing uppercase, lowercase, number, and special character
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/.test(value);
};

export const validate = {
  isEmpty,
  isEmail,
  isUrl,
  isNumber,
  isInteger,
  isPositive,
  isNonNegative,
  isInRange,
  hasMinLength,
  hasMaxLength,
  matchesPattern,
  isAddress,
  isTransactionHash,
  isStrongPassword
};