import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import Spinner from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    disabled, 
    className, 
    children,
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-400 shadow-sm',
      secondary: 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 focus:ring-neutral-300 border border-neutral-200',
      outline: 'border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 focus:ring-primary-400',
      ghost: 'bg-transparent hover:bg-neutral-100 text-neutral-700 focus:ring-primary-400',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <Spinner size="sm" className="mr-2" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
