import { cn } from '@/lib/cn';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary';
type ButtonSize = 'sm' | 'xs';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  iconPosition?: 'start' | 'end';
  size?: ButtonSize;
  variant?: ButtonVariant;
};

export function Button({
  children,
  className,
  icon,
  iconPosition = 'end',
  size = 'sm',
  type = 'button',
  variant = 'secondary',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 font-semibold transition-[border-color,color,opacity,filter,box-shadow] disabled:cursor-wait disabled:opacity-60',
        size === 'sm' && 'min-w-28 rounded-md px-3 py-1.5 text-xs',
        size === 'xs' && 'min-w-24 rounded-md px-2 py-1 text-[10.5px] tracking-wide uppercase',
        variant === 'primary' &&
          'bg-brand text-on-brand dark:text-ink border border-cyan-300/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_1px_2px_rgba(0,0,0,0.20)] ring-1 ring-cyan-400/25 hover:border-cyan-200/80 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.46),0_4px_14px_rgba(6,182,212,0.20)] active:translate-y-px active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.18)] dark:border-cyan-200/50 dark:ring-cyan-200/20',
        variant === 'secondary' &&
          'text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper dark:bg-ink-2 border border-black/10 bg-white/60 shadow-sm hover:border-black/25 dark:border-white/10 dark:hover:border-white/25',
        className,
      )}
      {...props}
    >
      {iconPosition === 'start' && icon}
      {children}
      {iconPosition === 'end' && icon}
    </button>
  );
}
