interface CardProps {
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  accentColor?: 'green' | 'cyan' | 'red' | 'yellow';
  className?: string;
}

const accentMap = {
  green: 'bg-green-500',
  cyan: 'bg-cyan-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
};

export function Card({
  title,
  children,
  icon,
  footer,
  accentColor = 'green',
  className = '',
}: CardProps) {
  return (
    <div className={`bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden relative ${className}`}>
      <div className={`absolute top-0 left-0 w-1 h-full ${accentMap[accentColor]}`} />
      <div className="pl-4">
        {(title || icon) && (
          <div className="flex items-center justify-between p-5 pb-3">
            {title && <h3 className="font-semibold text-white">{title}</h3>}
            {icon && <div className="text-green-400">{icon}</div>}
          </div>
        )}
        <div className={title || icon ? 'px-5 pb-5' : 'p-5'}>{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-slate-700 bg-slate-800/50">{footer}</div>
        )}
      </div>
    </div>
  );
}
