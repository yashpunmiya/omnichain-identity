import React from 'react';

/**
 * Logo component for the Omnichain Identity application
 * Displays a modern, professional logo with optional text
 */
const Logo = ({ showText = true, size = 'default' }) => {
  // Size classes based on the size prop
  const sizeClasses = {
    small: 'w-8 h-8',
    default: 'w-10 h-10',
    large: 'w-12 h-12',
  };

  const logoSize = sizeClasses[size] || sizeClasses.default;
  
  return (
    <div className="flex items-center gap-3">
      <div className={`logo-icon ${logoSize} relative rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary-light to-secondary-dark`}>
        {/* Logo Icon: Chain links forming an identity concept */}
        <svg 
          viewBox="0 0 48 48" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-full h-full p-1"
        >
          <path 
            d="M32 16L38 10C40.2091 7.79086 40.2091 4.20914 38 2C35.7909 -0.209139 32.2091 -0.209139 30 2L24 8M16 32L10 38C7.79086 40.2091 4.20914 40.2091 2 38C-0.209139 35.7909 -0.209139 32.2091 2 30L8 24" 
            stroke="white" 
            strokeWidth="4" 
            strokeLinecap="round"
          />
          <path 
            d="M20 20L28 28" 
            stroke="white" 
            strokeWidth="4" 
            strokeLinecap="round" 
          />
          <circle 
            cx="16" 
            cy="16" 
            r="6" 
            fill="rgba(255,255,255,0.9)" 
            stroke="white" 
            strokeWidth="2"
          />
          <circle 
            cx="32" 
            cy="32" 
            r="6" 
            fill="rgba(255,255,255,0.9)" 
            stroke="white" 
            strokeWidth="2"
          />
        </svg>
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-primary opacity-30 blur-md"></div>
      </div>
      
      {showText && (
        <div className="logo-text font-semibold text-lg text-white">
          <span className="text-primary">Omni</span>
          <span>Chain</span>
          <span className="text-secondary-light ml-1">ID</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
