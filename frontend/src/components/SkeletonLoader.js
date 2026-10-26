import React from 'react';

const SkeletonLoader = ({ height = '20px', width = '100%', style = {} }) => {
  return (
    <div
      style={{
        height,
        width,
        backgroundColor: '#e0e0e0',
        borderRadius: '4px',
        animation: 'pulse 1.5s ease-in-out infinite',
        ...style
      }}
    />
  );
};

export default SkeletonLoader;
