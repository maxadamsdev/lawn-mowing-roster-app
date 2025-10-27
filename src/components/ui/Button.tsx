import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'logout' | 'secondary';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '',
  ...props 
}) => {
  const variantClass = `btn-${variant}`;
  
  return (
    <button 
      className={`btn ${variantClass} ${className}`.trim()} 
      {...props}
    >
      {children}
    </button>
  );
};

