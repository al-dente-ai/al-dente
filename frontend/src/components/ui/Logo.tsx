import { Link } from 'react-router-dom';

type LogoProps = {
  to?: string;
  size?: number;
  showText?: boolean;
  className?: string;
  variant?: 'color' | 'mono';
};

export default function Logo({ to = '/', size = 28, showText = true, className, variant = 'color' }: LogoProps) {
  const src = variant === 'mono' ? '/black-alt-logo.svg' : '/alt-logo.svg';
  const img = (
    <img
      src={src}
      alt="Al Dente logo"
      width={size}
      height={size}
      loading="lazy"
      className="inline-block align-middle"
    />
  );

  const content = (
    <div className={`flex items-center space-x-2 ${className ?? ''}`}>
      {img}
      {showText && <span className="text-xl font-bold text-gray-900">Al Dente</span>}
    </div>
  );

  if (!to) return content;
  return (
    <Link to={to} aria-label="Al Dente home">
      {content}
    </Link>
  );
}


