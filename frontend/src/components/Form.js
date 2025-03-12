import React, { useState } from 'react';
import { validate } from '../utils/validate';
import '../styles/global.css';

const Form = ({ 
  fields, 
  onSubmit, 
  submitText = 'Submit', 
  cancelText = 'Cancel',
  onCancel = null,
  loading = false,
  initialValues = {},
  validationRules = {}
}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setValues({
      ...values,
      [name]: fieldValue
    });
    
    // Validate field on change if it's been touched
    if (touched[name]) {
      validateField(name, fieldValue);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    setTouched({
      ...touched,
      [name]: true
    });
    
    validateField(name, value);
  };

  const validateField = (name, value) => {
    const rules = validationRules[name];
    
    if (!rules) {
      return;
    }
    
    const fieldErrors = [];
    
    for (const rule of rules) {
      const { type, message } = rule;
      
      if (type === 'required' && !value) {
        fieldErrors.push(message || 'This field is required');
      } else if (type === 'email' && !validate.isEmail(value)) {
        fieldErrors.push(message || 'Please enter a valid email address');
      } else if (type === 'minLength' && value.length < rule.value) {
        fieldErrors.push(message || `Must be at least ${rule.value} characters`);
      } else if (type === 'maxLength' && value.length > rule.value) {
        fieldErrors.push(message || `Must be no more than ${rule.value} characters`);
      } else if (type === 'pattern' && !new RegExp(rule.pattern).test(value)) {
        fieldErrors.push(message || 'Invalid format');
      } else if (type === 'match' && value !== values[rule.field]) {
        fieldErrors.push(message || `Must match ${rule.field}`);
      } else if (type === 'custom' && rule.validate && !rule.validate(value, values)) {
        fieldErrors.push(message || 'Invalid value');
      }
    }
    
    setErrors({
      ...errors,
      [name]: fieldErrors.length > 0 ? fieldErrors : null
    });
  };

  const validateForm = () => {
    const formErrors = {};
    let isValid = true;
    
    // Mark all fields as touched
    const allTouched = fields.reduce((acc, field) => {
      acc[field.name] = true;
      return acc;
    }, {});
    
    setTouched(allTouched);
    
    // Validate all fields
    for (const field of fields) {
      const { name } = field;
      const value = values[name];
      
      validateField(name, value);
      
      if (errors[name]) {
        formErrors[name] = errors[name];
        isValid = false;
      }
    }
    
    setErrors(formErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(values);
    }
  };

  const renderField = (field) => {
    const { 
      name, 
      label, 
      type = 'text', 
      placeholder = '', 
      options = [], 
      disabled = false,
      autoComplete = 'on',
      helpText = null,
      icon = null
    } = field;
    
    const value = values[name] !== undefined ? values[name] : '';
    const fieldErrors = errors[name];
    const hasError = touched[name] && fieldErrors;
    
    const commonProps = {
      id: name,
      name,
      value,
      onChange: handleChange,
      onBlur: handleBlur,
      disabled: disabled || loading,
      className: hasError ? 'error' : '',
      autoComplete
    };
    
    let fieldComponent;
    
    switch (type) {
      case 'textarea':
        fieldComponent = (
          <textarea
            {...commonProps}
            placeholder={placeholder}
            rows={field.rows || 3}
          />
        );
        break;
        
      case 'select':
        fieldComponent = (
          <select {...commonProps}>
            {placeholder && <option value="">{placeholder}</option>}
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        break;
        
      case 'checkbox':
        fieldComponent = (
          <div className="checkbox-field">
            <input
              type="checkbox"
              {...commonProps}
              checked={!!value}
            />
            <label htmlFor={name}>{label}</label>
          </div>
        );
        break;
        
      case 'radio':
        fieldComponent = (
          <div className="radio-group">
            {options.map(option => (
              <div key={option.value} className="radio-field">
                <input
                  type="radio"
                  id={`${name}-${option.value}`}
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={handleChange}
                  disabled={disabled || loading}
                />
                <label htmlFor={`${name}-${option.value}`}>{option.label}</label>
              </div>
            ))}
          </div>
        );
        break;
        
      default:
        fieldComponent = (
          <div className="input-field">
            {icon && <span className="input-icon material-icons">{icon}</span>}
            <input
              type={type}
              {...commonProps}
              placeholder={placeholder}
            />
          </div>
        );
    }
    
    return (
      <div key={name} className={`form-group ${type === 'checkbox' ? 'checkbox-group' : ''}`}>
        {type !== 'checkbox' && label && (
          <label htmlFor={name}>{label}</label>
        )}
        
        {fieldComponent}
        
        {helpText && <div className="help-text">{helpText}</div>}
        
        {hasError && (
          <div className="error-message">
            {fieldErrors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      {fields.map(renderField)}
      
      <div className="form-actions">
        {onCancel && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
        )}
        
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-small"></span>
              <span>Loading...</span>
            </>
          ) : (
            submitText
          )}
        </button>
      </div>
    </form>
  );
};

export default Form;