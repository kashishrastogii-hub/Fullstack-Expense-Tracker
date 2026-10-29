import React from 'react';
import './button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  ...props 
}) => {
  const classes = [
    'btn-ui',
    'btn-ui--' + variant,
    'btn-ui--' + size,
    className
  ].filter(Boolean).join(' ');

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...props}>
      {loading && <span className='btn-ui__spinner'></span>}
      {!loading && Icon && iconPosition === 'left' && <Icon size={18} className='btn-ui__icon' />}
      <span className='btn-ui__text'>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon size={18} className='btn-ui__icon' />}
    </button>
  );
};

export default Button;
