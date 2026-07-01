import React from 'react';

export default function Card({ children, className = '', elevated = false, ...props }) {
  return (
    <div 
      className={`${elevated ? 'elevated-surface' : 'card-surface'} p-5 rounded-2xl shadow-sm ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
}
