import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DynamicSelectInputProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  label?: string;
}

export const DynamicSelectInput: React.FC<DynamicSelectInputProps> = ({
  name,
  value,
  onChange,
  suggestions,
  placeholder,
  required,
  className = "",
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>(suggestions);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const filtered = suggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredSuggestions(filtered);
  }, [value, suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    setIsOpen(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    const syntheticEvent = {
      target: {
        name,
        value: suggestion
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      inputRef.current?.focus();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        />
        
        <button
          type="button"
          onClick={handleToggleDropdown}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredSuggestions.length > 0 ? (
              <>
                {filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                  >
                    {suggestion}
                  </button>
                ))}
                {value && !suggestions.includes(value) && value.trim() !== '' && (
                  <div className="px-4 py-2 border-t border-gray-200 bg-green-50 text-green-700 text-sm">
                    <strong>Custom value:</strong> "{value}"
                  </div>
                )}
              </>
            ) : value.trim() !== '' ? (
              <div className="px-4 py-2 text-green-700 bg-green-50 text-sm">
                <strong>Custom value:</strong> "{value}" will be saved
              </div>
            ) : (
              <div className="px-4 py-2 text-gray-500 text-sm">
                No suggestions found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};