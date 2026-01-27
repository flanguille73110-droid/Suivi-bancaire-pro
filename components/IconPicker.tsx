
import React from 'react';

const ICON_BANK = [
  '🏦', '💳', '💰', '💸', '🪙', '💹', '📈', '📉', '🏠', '🚗', '🛵', '✈️',
  '🛒', '🍱', '🍔', '🍕', '☕', '🍷', '🍺', '🎭', '🎬', '🎮', '🎧', '⚽',
  '🏀', '🏋️', '🏥', '💊', '🧼', '👕', '👠', '🎁', '🎓', '📚', '💼', '💻',
  '📱', '⚡', '💧', '🔥', '🌳', '🐾', '👶', '❤️', '💍', '🛠️', '🧹', '🛡️',
  '📫', '🔔', '🔒'
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  label?: string;
  hideInput?: boolean;
}

const IconPicker: React.FC<IconPickerProps> = ({ value, onChange, label = "Icône", hideInput = false }) => {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-slate-500 uppercase">{label}</label>
      <div className="flex flex-col space-y-3">
        {!hideInput && (
          <div className="flex items-center space-x-2">
            <div className="w-12 h-12 flex items-center justify-center text-2xl bg-slate-100 rounded-xl border-2 border-slate-200">
              {value || '?'}
            </div>
            <input 
              type="text" 
              placeholder="Ou collez ici..."
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        )}
        <div className="grid grid-cols-10 gap-1 p-2 bg-slate-50 border border-slate-200 rounded-xl max-h-32 overflow-y-auto scrollbar-thin">
          {ICON_BANK.map((icon, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(icon)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all text-lg ${value === icon ? 'bg-white shadow-md border border-blue-200' : ''}`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IconPicker;
