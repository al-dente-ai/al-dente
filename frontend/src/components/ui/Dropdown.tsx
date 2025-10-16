import { useState, useRef, useEffect } from 'react';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

export default function Dropdown({ trigger, children, align = 'right' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={`absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="py-1" onClick={() => setIsOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
}

export function DropdownItem({ onClick, children, variant = 'default' }: DropdownItemProps) {
  const colorClasses =
    variant === 'danger'
      ? 'text-red-700 hover:bg-red-50 hover:text-red-800'
      : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900';

  return (
    <button
      onClick={onClick}
      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${colorClasses}`}
    >
      {children}
    </button>
  );
}
