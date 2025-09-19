import React from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({
  title,
  value,
  icon: Icon,
  color = 'blue',
  trend = null,
  trendValue = null,
  loading = false,
  onClick = null
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      text: 'text-blue-600'
    },
    green: {
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      text: 'text-green-600'
    },
    red: {
      bg: 'bg-red-50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      text: 'text-red-600'
    },
    yellow: {
      bg: 'bg-yellow-50',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      text: 'text-yellow-600'
    },
    purple: {
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      text: 'text-purple-600'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  const formatValue = (val) => {
    if (loading) return '---';
    if (typeof val === 'number') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
      return val.toLocaleString();
    }
    return val || '0';
  };

  return (
    <div
      className={`
        ${colors.bg} rounded-lg p-4 transition-all duration-200 sm:p-6
        ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''}
        ${loading ? 'animate-pulse-subtle' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {/* Título */}
          <p className="text-xs font-medium text-gray-600 mb-1 sm:text-sm sm:mb-2 truncate">
            {title}
          </p>

          {/* Valor principal */}
          <p className="text-xl font-bold text-gray-900 sm:text-3xl">
            {formatValue(value)}
          </p>
          
          {/* Tendencia */}
          {trend && trendValue && (
            <div className="flex items-center mt-1 sm:mt-2">
              {trend === 'up' ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1 sm:h-4 sm:w-4" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1 sm:h-4 sm:w-4" />
              )}
              <span className={`text-xs font-medium sm:text-sm ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trendValue}
              </span>
              <span className="text-xs text-gray-500 ml-1 hidden sm:inline">
                vs mes anterior
              </span>
            </div>
          )}
        </div>
        
        {/* Icono */}
        {Icon && (
          <div className={`${colors.iconBg} rounded-full p-2 sm:p-3 ml-2 flex-shrink-0`}>
            <Icon className={`h-5 w-5 ${colors.iconColor} sm:h-6 sm:w-6`} />
          </div>
        )}
      </div>
    </div>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType,
  color: PropTypes.oneOf(['blue', 'green', 'red', 'yellow', 'purple']),
  trend: PropTypes.oneOf(['up', 'down']),
  trendValue: PropTypes.string,
  loading: PropTypes.bool,
  onClick: PropTypes.func
};

export default StatCard;