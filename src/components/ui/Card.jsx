import React from 'react';

export const Card = ({
  children,
  title,
  subtitle,
  action,
  footer,
  className = '',
  bodyClassName = '',
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-150 hover:shadow-md ${className}`}
    >
      {(title || subtitle || action) && (
        <CardHeader action={action}>
          {title && <CardTitle>{title}</CardTitle>}
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </CardHeader>
      )}

      <CardContent className={bodyClassName}>{children}</CardContent>

      {footer && (
        <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
};

export const CardHeader = ({ children, className = '', action }) => (
  <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-100 ${className}`}>
    <div>{children}</div>
    {action && <div className="ml-4 shrink-0">{action}</div>}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-base font-semibold text-slate-900 leading-snug ${className}`}>
    {children}
  </h3>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`px-6 py-5 ${className}`}>{children}</div>
);

export default Card;
