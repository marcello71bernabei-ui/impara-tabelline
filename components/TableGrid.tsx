
import React from 'react';

interface TableGridProps {
  highlighted: { a: number; b: number } | null;
  solvedCells: Set<string>;
  maxRange: number;
  isHintActive?: boolean;
}

const TableGrid: React.FC<TableGridProps> = ({ highlighted, solvedCells, maxRange, isHintActive }) => {
  const numbers = Array.from({ length: maxRange }, (_, i) => i + 1);

  return (
    <div className="bg-white p-4 rounded-3xl shadow-xl border-4 border-blue-200 overflow-auto max-w-full">
      <div 
        className="grid gap-1 min-w-[280px]" 
        style={{ 
          gridTemplateColumns: `repeat(${maxRange + 1}, minmax(0, 1fr))` 
        }}
      >
        {/* Angolo Header */}
        <div className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center font-bold text-gray-400 text-xs md:text-sm">×</div>
        
        {/* Header Superiore (Colonne) */}
        {numbers.map(n => {
          const isColHighlighted = highlighted?.b === n;
          return (
            <div 
              key={`h-${n}`} 
              className={`w-7 h-7 md:w-9 md:h-9 flex items-center justify-center font-brand rounded-lg text-xs md:text-sm transition-colors duration-300 ${isColHighlighted ? 'bg-yellow-400 text-white shadow-sm' : 'bg-blue-50 text-blue-600'}`}
            >
              {n}
            </div>
          );
        })}

        {/* Righe */}
        {numbers.map(row => {
          const isRowHighlighted = highlighted?.a === row;
          return (
            <React.Fragment key={`row-${row}`}>
              {/* Header Sinistro (Righe) */}
              <div className={`w-7 h-7 md:w-9 md:h-9 flex items-center justify-center font-brand rounded-lg text-xs md:text-sm transition-colors duration-300 ${isRowHighlighted ? 'bg-yellow-400 text-white shadow-sm' : 'bg-blue-50 text-blue-600'}`}>
                {row}
              </div>
              
              {/* Celle della Tabella */}
              {numbers.map(col => {
                const isHighlighted = highlighted?.a === row && highlighted?.b === col;
                const isSolved = solvedCells.has(`${row}x${col}`);
                
                return (
                  <div
                    key={`${row}-${col}`}
                    className={`
                      w-7 h-7 md:w-9 md:h-9 flex items-center justify-center text-[10px] md:text-xs font-semibold rounded-lg transition-all duration-500
                      ${isHighlighted && !isSolved ? 'bg-yellow-100 text-yellow-700 scale-110 shadow-lg z-10 animate-pulse ring-2 ring-yellow-300' : ''}
                      ${isHintActive && isHighlighted && !isSolved ? 'bg-orange-400 text-white animate-bounce' : ''}
                      ${isSolved ? 'bg-green-500 text-white scale-100 shadow-sm' : ''}
                      ${!isSolved && !isHighlighted ? 'bg-gray-50 text-transparent border border-gray-100' : ''}
                      ${!isSolved && isHighlighted ? 'border-2 border-yellow-500' : 'border border-gray-100'}
                    `}
                  >
                    {isSolved ? row * col : (isHighlighted ? (isHintActive ? row * col : '?') : '')}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default TableGrid;
