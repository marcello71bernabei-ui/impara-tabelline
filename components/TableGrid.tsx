
import React from 'react';

interface TableGridProps {
  highlighted: { a: number; b: number } | null;
  solvedCells: Set<string>;
  maxRange: number;
}

const TableGrid: React.FC<TableGridProps> = ({ highlighted, solvedCells, maxRange }) => {
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
        {numbers.map(n => (
          <div key={`h-${n}`} className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center font-brand text-blue-600 bg-blue-50 rounded-lg text-xs md:text-sm">
            {n}
          </div>
        ))}

        {/* Righe */}
        {numbers.map(row => (
          <React.Fragment key={`row-${row}`}>
            {/* Header Sinistro (Righe) */}
            <div className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center font-brand text-blue-600 bg-blue-50 rounded-lg text-xs md:text-sm">
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
                    ${isHighlighted && !isSolved ? 'bg-yellow-400 text-white scale-110 shadow-lg z-10 animate-pulse ring-2 ring-yellow-200' : ''}
                    ${isSolved ? 'bg-green-500 text-white scale-100 shadow-sm' : ''}
                    ${!isSolved && !isHighlighted ? 'bg-gray-50 text-transparent border border-gray-100' : ''}
                    ${!isSolved && isHighlighted ? 'border-2 border-yellow-500' : 'border border-gray-100'}
                  `}
                >
                  {isSolved ? row * col : (isHighlighted ? '?' : '')}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default TableGrid;
