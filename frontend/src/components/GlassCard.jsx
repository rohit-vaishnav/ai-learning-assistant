import React from 'react';

const GlassCard = ({ children, className = "", onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`glass-premium rounded-2xl p-6 transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default GlassCard;
