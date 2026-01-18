
import React from 'react';

interface KeypadProps {
  onPress: (val: string) => void;
  onClear: () => void;
  onSubmit: () => void;
}

const Keypad: React.FC<KeypadProps> = ({ onPress, onClear, onSubmit }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'];

  return (
    <div className="grid grid-cols-3 gap-3 mt-6">
      {keys.map((key) => (
        <button
          key={key}
          onClick={() => {
            if (key === 'C') onClear();
            else if (key === 'OK') onSubmit();
            else onPress(key);
          }}
          className={`
            h-14 md:h-16 rounded-2xl font-brand text-xl shadow-md active:scale-95 transition-transform
            ${key === 'OK' ? 'bg-green-500 text-white col-span-1' : ''}
            ${key === 'C' ? 'bg-red-500 text-white' : ''}
            ${key !== 'OK' && key !== 'C' ? 'bg-white text-gray-700 border-2 border-gray-100' : ''}
          `}
        >
          {key}
        </button>
      ))}
    </div>
  );
};

export default Keypad;
