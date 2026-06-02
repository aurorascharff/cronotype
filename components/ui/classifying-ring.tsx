type Props = {
  failed?: boolean;
  variant?: 'inset' | 'fixed';
  size?: number;
};

export function ClassifyingRing({ failed = false, variant = 'inset', size }: Props) {
  const positionClass = variant === 'inset' ? 'absolute inset-0' : '';
  const fixedStyle = variant === 'fixed' && size ? { height: size, width: size } : undefined;
  return (
    <span
      aria-label={failed ? 'Classification failed' : 'Classifying'}
      className={`${positionClass} rounded-full border-2 ${
        failed
          ? 'border-muted/20 dark:border-muted-dark/20 border-dotted'
          : 'border-muted/25 dark:border-muted-dark/25 animate-pulse border-dashed'
      }`}
      style={fixedStyle}
    />
  );
}
