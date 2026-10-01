import { cn } from '../../utils/cn';

interface LogoMarkProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 rounded-lg text-xs font-black',
  sm: 'w-8 h-8 rounded-xl text-base font-black',
  md: 'w-9 h-9 rounded-xl text-xl font-black',
  lg: 'w-12 h-12 rounded-2xl text-2xl font-black',
  xl: 'w-20 h-20 rounded-[22px] text-4xl font-black',
};

export function LogoMark({ size = 'md', className }: LogoMarkProps) {
  return (
    <div
      className={cn(
        'bg-[#FF453A] text-white flex items-center justify-center font-sans select-none shadow-md shrink-0 leading-none',
        sizeClasses[size],
        className
      )}
      style={{ background: 'var(--color-primary, #FF453A)' }}
    >
      <span>P</span>
    </div>
  );
}

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showSubtitle = true, className }: LogoProps) {
  const markSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';
  const textClass = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-xl';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <LogoMark size={markSize} />
      <div>
        <span className={cn('font-extrabold tracking-tight text-[var(--color-dark)]', textClass)}>
          Pace<span className="text-[var(--color-primary)]">Wise</span>
        </span>
        {showSubtitle && (
          <p className="text-[10px] text-[var(--color-gray-dark)] font-bold uppercase tracking-wider">
            Personal Budget
          </p>
        )}
      </div>
    </div>
  );
}
