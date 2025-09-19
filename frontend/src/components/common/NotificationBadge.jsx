import React from 'react';
import PropTypes from 'prop-types';

const NotificationBadge = ({ count, className = '', size = 'small', maxCount = 99 }) => {
  if (!count || count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count;

  const sizeClasses = {
    small: 'h-4 w-4 text-xs',
    medium: 'h-5 w-5 text-xs',
    large: 'h-6 w-6 text-sm'
  };

  const positionClasses = {
    small: '-top-1 -right-3',
    medium: '-top-2 -right-4', 
    large: '-top-2 -right-4'
  };

  return (
    <span 
      className={`
        absolute ${positionClasses[size]} 
        ${sizeClasses[size]}
        bg-red-500 text-white font-bold rounded-full 
        flex items-center justify-center
        border-2 border-white
        animate-pulse
        ${className}
      `}
    >
      {displayCount}
    </span>
  );
};

NotificationBadge.propTypes = {
  count: PropTypes.number.isRequired,
  className: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  maxCount: PropTypes.number
};

export default NotificationBadge;