'use client';

import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useFormStatus } from 'react-dom';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary';
type ButtonSize = 'sm' | 'xs';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  iconPosition?: 'start' | 'end';
  isPending?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

export function Button({
  'aria-busy': ariaBusy,
  children,
  className,
  disabled,
  icon,
  iconPosition = 'end',
  isPending = false,
  size = 'sm',
  type = 'button',
  variant = 'secondary',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 font-semibold transition-[border-color,color,opacity,filter,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm' && 'min-w-28 rounded-md px-3 py-1.5 text-xs',
        size === 'xs' && 'min-w-24 rounded-md px-2 py-1 text-[10.5px] tracking-wide uppercase',
        variant === 'primary' &&
          'bg-brand text-on-brand dark:text-ink border border-cyan-300/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_1px_2px_rgba(0,0,0,0.20)] ring-1 ring-cyan-400/25 enabled:hover:border-cyan-200/80 enabled:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.46),0_4px_14px_rgba(6,182,212,0.20)] enabled:active:translate-y-px enabled:active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.18)] dark:border-cyan-200/50 dark:ring-cyan-200/20',
        variant === 'secondary' &&
          'text-muted dark:text-muted-dark dark:bg-ink-2 border border-black/10 bg-white/60 shadow-sm enabled:hover:border-black/25 enabled:hover:text-ink dark:border-white/10 dark:enabled:hover:border-white/25 dark:enabled:hover:text-paper',
        className,
      )}
      {...props}
      disabled={disabled}
      aria-busy={ariaBusy ?? isPending}
    >
      {iconPosition === 'start' && (isPending ? <Spinner size={size} /> : icon)}
      {children}
      {iconPosition === 'end' && (isPending ? <Spinner size={size} /> : icon)}
    </button>
  );
}

export function SubmitButton(props: Omit<ButtonProps, 'isPending' | 'type'>) {
  const { pending } = useFormStatus();
  return <Button {...props} type="submit" disabled={props.disabled || pending} isPending={pending} />;
}

function Spinner({ size }: { size: ButtonSize }) {
  const dimension = size === 'xs' ? 10 : 12;
  return (
    <LoaderCircle
      width={dimension}
      height={dimension}
      className="block shrink-0 animate-spin text-current"
      aria-hidden
    />
  );
}
