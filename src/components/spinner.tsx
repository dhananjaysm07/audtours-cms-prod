import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const LoadingSpinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  color = 'text-gray-600',
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {[...Array(50)].map((_, index) => (
        <div
          key={index}
          className={`absolute w-[8.33%] h-[25%] ${color} rounded-full transform -translate-y-1/2 opacity-0 animate-macos-spin`}
          style={{
            top: '50%',
            left: '50%',
            animationDelay: `${index * 0.1}s`,
            transform: `rotate(${index * 30}deg) translateY(-150%)`,
          }}
        ></div>
      ))}
    </div>
  );
};

export default LoadingSpinner;
