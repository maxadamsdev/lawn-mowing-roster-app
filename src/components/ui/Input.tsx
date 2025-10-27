import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <input className={`input ${className}`.trim()} {...props} />
    </div>
  );
};

