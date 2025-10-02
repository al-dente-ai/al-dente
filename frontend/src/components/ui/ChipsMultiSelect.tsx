import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface ChipsMultiSelectOption {
  value: string;
  label: string;
}

interface ChipsMultiSelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: ChipsMultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  className?: string;
}

const ChipsMultiSelect = forwardRef<HTMLDivElement, ChipsMultiSelectProps>(
  ({ label, error, helperText, options, value, onChange, disabled, className }, ref) => {
    const toggle = (val: string) => {
      if (disabled) return;
      const set = new Set(value);
      if (set.has(val)) set.delete(val); else set.add(val);
      onChange(Array.from(set));
    };

    return (
      <div ref={ref} className={cn('w-full', className)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => {
            const isSelected = value.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                disabled={disabled}
                className={cn(
                  'px-3 py-1 rounded-full text-sm border transition-colors',
                  isSelected
                    ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
                  disabled && 'opacity-60 pointer-events-none'
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

ChipsMultiSelect.displayName = 'ChipsMultiSelect';

export default ChipsMultiSelect;



