import { ReactNode } from 'react';
import { AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface CalloutProps {
  type?: 'info' | 'warn' | 'error' | 'success';
  title?: string;
  children: ReactNode;
}

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const config = {
    info: {
      icon: Info,
      className: 'border-blue-500/50 bg-blue-500/10 text-blue-900 dark:text-blue-100',
      iconClassName: 'text-blue-500',
    },
    warn: {
      icon: AlertTriangle,
      className: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-900 dark:text-yellow-100',
      iconClassName: 'text-yellow-500',
    },
    error: {
      icon: AlertCircle,
      className: 'border-red-500/50 bg-red-500/10 text-red-900 dark:text-red-100',
      iconClassName: 'text-red-500',
    },
    success: {
      icon: CheckCircle,
      className: 'border-green-500/50 bg-green-500/10 text-green-900 dark:text-green-100',
      iconClassName: 'text-green-500',
    },
  };

  const { icon: Icon, className, iconClassName } = config[type];

  return (
    <div className={`my-6 flex gap-3 rounded-lg border p-4 ${className}`}>
      <Icon className={`flex-shrink-0 w-5 h-5 mt-0.5 ${iconClassName}`} />
      <div className='flex-1'>
        {title && <div className='font-semibold mb-1'>{title}</div>}
        <div className='text-sm leading-relaxed'>{children}</div>
      </div>
    </div>
  );
}
