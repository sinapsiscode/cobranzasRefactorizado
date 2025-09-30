import React from 'react';
import PropTypes from 'prop-types';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action = null,
  size = 'medium'
}) => {
  const sizeClasses = {
    small: {
      container: 'py-8',
      icon: 'h-12 w-12',
      title: 'text-lg',
      description: 'text-sm'
    },
    medium: {
      container: 'py-12',
      icon: 'h-16 w-16',
      title: 'text-xl',
      description: 'text-base'
    },
    large: {
      container: 'py-20',
      icon: 'h-20 w-20',
      title: 'text-2xl',
      description: 'text-lg'
    }
  };

  const classes = sizeClasses[size] || sizeClasses.medium;

  return (
    <div className={`text-center ${classes.container}`}>
      {/* Icono */}
      {Icon && (
        <div className="mx-auto mb-4">
          <Icon className={`${classes.icon} text-gray-300 mx-auto`} />
        </div>
      )}

      {/* Título */}
      <h3 className={`${classes.title} font-semibold text-gray-900 mb-2`}>
        {title}
      </h3>

      {/* Descripción */}
      <p className={`${classes.description} text-gray-500 max-w-md mx-auto mb-6`}>
        {description}
      </p>

      {/* Acción */}
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  action: PropTypes.node,
  size: PropTypes.oneOf(['small', 'medium', 'large'])
};

export default EmptyState;