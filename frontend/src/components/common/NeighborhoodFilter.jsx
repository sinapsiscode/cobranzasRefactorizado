import { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';

const NeighborhoodFilter = ({ 
  onFilterChange, 
  selectedNeighborhoods = [], 
  availableNeighborhoods = [],
  className = "" 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState(availableNeighborhoods);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setNeighborhoods(availableNeighborhoods);
  }, [availableNeighborhoods]);

  const handleNeighborhoodToggle = (neighborhood) => {
    const isSelected = selectedNeighborhoods.includes(neighborhood);
    let newSelected;
    
    if (isSelected) {
      newSelected = selectedNeighborhoods.filter(n => n !== neighborhood);
    } else {
      newSelected = [...selectedNeighborhoods, neighborhood];
    }
    
    onFilterChange(newSelected);
  };

  const clearAllFilters = () => {
    onFilterChange([]);
  };

  const hasFilters = selectedNeighborhoods.length > 0;

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`flex items-center justify-between gap-2 px-3 py-2 text-sm border rounded-lg transition-all duration-200 w-full md:w-auto ${
            hasFilters 
              ? 'bg-blue-50 border-blue-200 text-blue-800 shadow-sm' 
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {hasFilters 
                ? `${selectedNeighborhoods.length} barrio${selectedNeighborhoods.length > 1 ? 's' : ''}`
                : 'Filtrar por Barrio'
              }
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">
                {selectedNeighborhoods.length}
              </span>
            )}
            <svg 
              className={`h-4 w-4 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {hasFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200 border border-transparent hover:border-red-200"
            title="Limpiar todos los filtros"
          >
            <X className="h-3 w-3" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>
        )}
      </div>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          <div 
            ref={dropdownRef}
            className="absolute left-0 mt-2 w-full min-w-64 max-w-sm bg-white border border-gray-200 rounded-lg shadow-xl z-20 md:w-80 lg:w-64"
            style={{
              boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
            }}
          >
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Seleccionar Barrios</h3>
              <p className="text-xs text-gray-500 mt-1">
                Selecciona uno o más barrios para filtrar
              </p>
            </div>
            
            <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {neighborhoods.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No hay barrios disponibles</p>
                </div>
              ) : (
                neighborhoods.map((neighborhood) => (
                  <label
                    key={neighborhood}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors duration-150 border-b border-gray-50 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedNeighborhoods.includes(neighborhood)}
                      onChange={() => handleNeighborhoodToggle(neighborhood)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span className="text-sm text-gray-700 flex-1 font-medium">
                      {neighborhood}
                    </span>
                    {selectedNeighborhoods.includes(neighborhood) && (
                      <div className="flex items-center justify-center w-5 h-5 bg-blue-600 rounded-full">
                        <span className="text-xs text-white">✓</span>
                      </div>
                    )}
                  </label>
                ))
              )}
            </div>

            {hasFilters && (
              <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-gray-600">
                    <span className="font-semibold text-blue-700">{selectedNeighborhoods.length}</span> 
                    <span className="ml-1">barrio{selectedNeighborhoods.length > 1 ? 's' : ''} seleccionado{selectedNeighborhoods.length > 1 ? 's' : ''}</span>
                  </div>
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-gray-500 hover:text-red-600 underline transition-colors"
                  >
                    Limpiar todo
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedNeighborhoods.map(neighborhood => (
                    <span 
                      key={neighborhood}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-blue-800 text-xs rounded-full shadow-sm hover:shadow-md transition-shadow"
                    >
                      <span className="font-medium">{neighborhood}</span>
                      <button
                        onClick={() => handleNeighborhoodToggle(neighborhood)}
                        className="hover:bg-red-100 hover:text-red-600 rounded-full p-0.5 transition-colors"
                        title={`Remover ${neighborhood}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NeighborhoodFilter;