import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'medium', color = 'blue-500' }) => {
  const sizeClasses = {
    small: 'w-6 h-6 border-2',
    medium: 'w-8 h-8 border-4',
    large: 'w-12 h-12 border-6',
  };

  return (
    <div
      className={`
        animate-spin
        rounded-full
        border-t-transparent
        ${sizeClasses[size]}
        border-${color}
      `}
    ></div>
  );
};

export default Spinner;
