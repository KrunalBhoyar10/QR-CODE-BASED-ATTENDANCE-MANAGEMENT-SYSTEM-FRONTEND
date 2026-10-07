import React from 'react';
import { ROLES } from '../../utils/constants';

const variantClasses = {
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  amber: 'bg-amber-50 text-amber-700 border-amber-200/80',
  rose: 'bg-rose-50 text-rose-700 border-rose-200/80',
  slate: 'bg-slate-100 text-slate-700 border-slate-200/80',
  sky: 'bg-sky-50 text-sky-700 border-sky-200/80',
  purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
};

const dotClasses = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-400',
  sky: 'bg-sky-500',
  purple: 'bg-purple-500',
};

const roleVariantMap = {
  [ROLES.PRINCIPAL]: 'purple',
  [ROLES.HOD]: 'indigo',
  [ROLES.TEACHER]: 'sky',
  [ROLES.STUDENT]: 'emerald',
};

export const Badge = ({
  children,
  variant = 'indigo',
  role,
  size = 'md',
  withDot = false,
  className = '',
}) => {
  const chosenVariant = role ? roleVariantMap[role] || 'slate' : variant;

  const sizeClass =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px]'
      : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${
        variantClasses[chosenVariant] || variantClasses.indigo
      } ${sizeClass} ${className}`}
    >
      {withDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            dotClasses[chosenVariant] || dotClasses.indigo
          }`}
        />
      )}
      {children || (role ? role : null)}
    </span>
  );
};

export default Badge;
