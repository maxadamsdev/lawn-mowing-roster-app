import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`card ${className}`.trim()}>
      {title && <h2 className="card-title">{title}</h2>}
      {children}
    </div>
  );
};

