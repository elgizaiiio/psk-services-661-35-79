import React, { useEffect, useState } from 'react';

const MatrixBackground: React.FC = () => {
  const [columns, setColumns] = useState<number>(40);

  useEffect(() => {
    const updateColumns = () => {
      const screenWidth = window.innerWidth;
      const columnWidth = 25; // Width of each column
      const newColumns = Math.ceil(screenWidth / columnWidth) + 10; // Extra columns for coverage
      setColumns(newColumns);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  return (
    <div className="matrix-container">
      <div className="matrix-pattern">
        {Array.from({ length: columns }, (_, i) => (
          <div 
            key={i} 
            className="matrix-column"
            style={{
              left: `${i * 25}px`,
              animationDelay: `-${Math.random() * 4}s`,
              animationDuration: `${2.5 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default MatrixBackground;