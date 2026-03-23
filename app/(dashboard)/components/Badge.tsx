'use client';

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'neutral' | 'info';

export interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({ variant, children, dot = false, className = '' }: BadgeProps) {
  return (
    <span className={`badge badge--${variant} ${className}`.trim()}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  );
}
