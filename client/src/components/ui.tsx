import React, { useState, useRef, useEffect, forwardRef, Fragment } from 'react';
import { X, ChevronDown, ChevronUp, Check, AlertCircle, Info, CheckCircle, XCircle, Eye, EyeOff, Search, Loader2 } from 'lucide-react';

// ─── BUTTON ───────────────────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning' | 'outline';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant; size?: ButtonSize; loading?: boolean;
  icon?: React.ReactNode; iconRight?: React.ReactNode; full?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'secondary', size = 'md', loading, icon, iconRight, full, children, className = '', disabled, ...rest
}, ref) => {
  const variantCls = {
    primary: 'btn-primary text-white', secondary: 'btn-secondary', ghost: 'btn-ghost',
    danger: 'btn-danger text-white', success: 'btn-success text-white',
    warning: 'btn-warning text-white', outline: 'bg-transparent border-2 border-brand-500 text-brand-600 hover:bg-brand-50',
  }[variant];
  const sizeCls = { xs: 'btn-xs', sm: 'btn-sm', md: 'btn-md', lg: 'btn-lg', xl: 'btn-xl' }[size];
  return (
    <button ref={ref} className={`btn ${variantCls} ${sizeCls} ${full ? 'w-full' : ''} ${className}`} disabled={disabled || loading} {...rest}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
});
Button.displayName = 'Button';

// ─── ICON BUTTON ──────────────────────────────────────────────────────────────
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize; variant?: ButtonVariant; tooltip?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({ size = 'md', variant = 'ghost', tooltip, children, className = '', ...rest }) => {
  const sizeCls = { xs: 'p-1', sm: 'p-1.5', md: 'p-2', lg: 'p-2.5', xl: 'p-3' }[size];
  const variantCls = {
    primary: 'btn-primary text-white', secondary: 'btn-secondary', ghost: 'hover:bg-surface-100 text-surface-500 hover:text-surface-700',
    danger: 'text-danger-500 hover:bg-danger-50', success: 'text-success-500 hover:bg-success-50',
    warning: 'text-warning-500 hover:bg-warning-50', outline: 'border border-surface-200 hover:bg-surface-100',
  }[variant];
  return (
    <button className={`inline-flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer ${sizeCls} ${variantCls} ${className}`} title={tooltip} {...rest}>
      {children}
    </button>
  );
};

// ─── CARD ─────────────────────────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean; padding?: 'none' | 'sm' | 'md' | 'lg';
  accent?: 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'orange';
}

export const Card: React.FC<CardProps> = ({ interactive, padding = 'md', accent, children, className = '', ...rest }) => {
  const padCls = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6' }[padding];
  const accentBorder = accent ? { brand: 'border-t-brand-500', success: 'border-t-success-500', warning: 'border-t-warning-500', danger: 'border-t-danger-500', info: 'border-t-info-500', purple: 'border-t-purple-500', orange: 'border-t-orange-500' }[accent] : '';
  return (
    <div className={`card ${padCls} ${interactive ? 'card-interactive' : ''} ${accent ? `border-t-4 ${accentBorder}` : ''} ${className}`} {...rest}>
      {children}
    </div>
  );
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string; value: string | number; icon?: React.ReactNode;
  iconBg?: string; trend?: { value: number; label?: string };
  subtitle?: string; className?: string; accent?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, iconBg = 'bg-brand-100 text-brand-600', trend, subtitle, className = '', accent }) => (
  <div className={`card p-5 relative overflow-hidden ${className}`}>
    {accent && <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent}`} />}
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">{label}</p>
        <p className="text-[2rem] font-[800] font-display leading-none text-surface-900 tabular-nums">{value}</p>
        {subtitle && <p className="text-xs text-surface-400 mt-1">{subtitle}</p>}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trend.value >= 0 ? 'text-success-600' : 'text-danger-500'}`}>
            <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
            {trend.label && <span className="text-surface-400 font-normal">{trend.label}</span>}
          </div>
        )}
      </div>
      {icon && <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>{icon}</div>}
    </div>
  </div>
);

// ─── BADGE ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'orange' | 'gray';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant; dot?: boolean; size?: 'xs' | 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'gray', dot, size = 'sm', children, className = '', ...rest }) => {
  const sizeCls = { xs: 'text-[10px] px-1.5 py-0.5', sm: 'text-[11px] px-2.5 py-0.5 gap-1', md: 'text-xs px-3 py-1' }[size];
  const dotColors: Record<BadgeVariant, string> = {
    brand: 'bg-brand-500', success: 'bg-success-500', warning: 'bg-warning-500',
    danger: 'bg-danger-500', info: 'bg-info-500', purple: 'bg-purple-500', orange: 'bg-orange-500', gray: 'bg-surface-400',
  };
  return (
    <span className={`badge badge-${variant} ${sizeCls} ${className}`} {...rest}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
interface ProgressBarProps {
  value: number; max?: number; size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'brand' | 'success' | 'warning' | 'danger';
  showLabel?: boolean; label?: string; className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, max = 100, size = 'sm', variant = 'brand', showLabel, label, className = '' }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const heights = { xs: 'h-1', sm: 'h-2', md: 'h-3', lg: 'h-4' };
  const colors = {
    brand: 'from-brand-500 to-brand-400', success: 'from-success-500 to-success-400',
    warning: 'from-warning-500 to-warning-400', danger: 'from-danger-500 to-danger-400',
  };
  return (
    <div className={className}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-surface-600">{label}</span>
          {showLabel && <span className="text-xs font-bold text-surface-700">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={`progress-bar ${heights[size]}`}>
        <div className={`h-full rounded-full bg-gradient-to-r ${colors[variant]} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ─── AVATAR ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['bg-brand-500', 'bg-success-500', 'bg-warning-500', 'bg-purple-500', 'bg-info-500', 'bg-orange-500', 'bg-danger-500'];

export const Avatar: React.FC<{ name: string; src?: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; online?: boolean; className?: string }> = ({ name, src, size = 'md', online, className = '' }) => {
  const sizes = { xs: 'w-6 h-6 text-[10px]', sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base', xl: 'w-14 h-14 text-lg' };
  const colorIdx = (name || 'A').charCodeAt(0) % AVATAR_COLORS.length;
  const initials = (name || 'A').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {src ? (
        <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover ring-2 ring-white`} />
      ) : (
        <div className={`${sizes[size]} ${AVATAR_COLORS[colorIdx]} rounded-full flex items-center justify-center text-white font-bold ring-2 ring-white`}>
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${online ? 'bg-success-500' : 'bg-surface-300'}`} />
      )}
    </div>
  );
};

// ─── INPUT ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; hint?: string;
  icon?: React.ReactNode; iconRight?: React.ReactNode; prefix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, icon, iconRight, prefix, className = '', type, ...rest }, ref) => {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="w-full">
      {label && <label className="form-label">{label}</label>}
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-sm text-surface-400 pointer-events-none font-medium">{prefix}</span>}
        {icon && <span className="absolute left-3 text-surface-400 pointer-events-none flex items-center">{icon}</span>}
        <input
          ref={ref}
          type={isPassword ? (show ? 'text' : 'password') : type}
          className={`form-input ${icon ? 'pl-10' : ''} ${prefix ? 'pl-8' : ''} ${(iconRight || isPassword) ? 'pr-10' : ''} ${error ? 'border-danger-400 focus:border-danger-500' : ''} ${className}`}
          {...rest}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 text-surface-400 hover:text-surface-600 transition-colors">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {iconRight && !isPassword && <span className="absolute right-3 text-surface-400 pointer-events-none flex items-center">{iconRight}</span>}
      </div>
      {error && <p className="form-error flex items-center gap-1 mt-1"><AlertCircle size={12} />{error}</p>}
      {hint && !error && <p className="text-xs text-surface-400 mt-1">{hint}</p>}
    </div>
  );
});
Input.displayName = 'Input';

// ─── TEXTAREA ─────────────────────────────────────────────────────────────────
export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string; hint?: string }>(({ label, error, hint, className = '', ...rest }, ref) => (
  <div className="w-full">
    {label && <label className="form-label">{label}</label>}
    <textarea ref={ref} className={`form-input resize-none min-h-[100px] ${error ? 'border-danger-400' : ''} ${className}`} {...rest} />
    {error && <p className="form-error flex items-center gap-1 mt-1"><AlertCircle size={12} />{error}</p>}
    {hint && !error && <p className="text-xs text-surface-400 mt-1">{hint}</p>}
  </div>
));
Textarea.displayName = 'Textarea';

// ─── SELECT ───────────────────────────────────────────────────────────────────
export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string; options: { value: string; label: string }[]; placeholder?: string }>(({ label, error, options, placeholder, className = '', ...rest }, ref) => (
  <div className="w-full">
    {label && <label className="form-label">{label}</label>}
    <div className="relative">
      <select ref={ref} className={`form-input appearance-none pr-10 ${error ? 'border-danger-400' : ''} ${className}`} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
    </div>
    {error && <p className="form-error flex items-center gap-1 mt-1"><AlertCircle size={12} />{error}</p>}
  </div>
));
Select.displayName = 'Select';

// ─── MODAL ────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean; onClose: () => void; title?: string; subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'; children: React.ReactNode; footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, subtitle, size = 'md', children, footer }) => {
  useEffect(() => { if (open) document.body.style.overflow = 'hidden'; else document.body.style.overflow = ''; return () => { document.body.style.overflow = ''; }; }, [open]);
  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-full mx-4' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${widths[size]} animate-scale-in max-h-[90vh] flex flex-col z-10`}>
        {(title || subtitle) && (
          <div className="flex items-start justify-between p-6 pb-4 border-b border-surface-100">
            <div>
              {title && <h3 className="text-lg font-bold font-display text-surface-900">{title}</h3>}
              {subtitle && <p className="text-sm text-surface-500 mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors ml-4 flex-shrink-0">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="p-4 pt-0">{footer}</div>}
      </div>
    </div>
  );
};

// ─── ALERT ────────────────────────────────────────────────────────────────────
export const Alert: React.FC<{ variant?: 'info' | 'success' | 'warning' | 'error'; title?: string; children: React.ReactNode; onClose?: () => void; className?: string }> = ({ variant = 'info', title, children, onClose, className = '' }) => {
  const configs = {
    info: { cls: 'bg-info-50 border-info-200', text: 'text-info-800', icon: <Info size={16} className="text-info-500" /> },
    success: { cls: 'bg-success-50 border-success-200', text: 'text-success-800', icon: <CheckCircle size={16} className="text-success-500" /> },
    warning: { cls: 'bg-warning-50 border-warning-200', text: 'text-warning-800', icon: <AlertCircle size={16} className="text-warning-500" /> },
    error: { cls: 'bg-danger-50 border-danger-200', text: 'text-danger-800', icon: <XCircle size={16} className="text-danger-500" /> },
  };
  const { cls, text, icon } = configs[variant];
  return (
    <div className={`flex gap-3 p-4 rounded-xl border ${cls} ${className}`}>
      <span className="flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        {title && <p className={`text-sm font-semibold ${text}`}>{title}</p>}
        <div className={`text-sm ${text} mt-0.5`}>{children}</div>
      </div>
      {onClose && <button onClick={onClose} className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"><X size={14} /></button>}
    </div>
  );
};

// ─── TABS ─────────────────────────────────────────────────────────────────────
interface Tab { key: string; label: string; icon?: React.ReactNode; count?: number; }

export const Tabs: React.FC<{ tabs: Tab[]; active: string; onChange: (k: string) => void; variant?: 'line' | 'pill' | 'card'; className?: string }> = ({ tabs, active, onChange, variant = 'line', className = '' }) => {
  if (variant === 'pill') return (
    <div className={`flex gap-1 p-1 bg-surface-100 rounded-xl ${className}`}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${t.key === active ? 'bg-white text-brand-600 shadow-sm font-semibold' : 'text-surface-500 hover:text-surface-700'}`}>
          {t.icon}{t.label}
          {t.count !== undefined && <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${t.key === active ? 'bg-brand-100 text-brand-600' : 'bg-surface-200 text-surface-500'}`}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
  return (
    <div className={`flex gap-0 border-b border-surface-200 ${className}`}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${t.key === active ? 'border-brand-500 text-brand-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}>
          {t.icon}{t.label}
          {t.count !== undefined && <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${t.key === active ? 'bg-brand-100 text-brand-600' : 'bg-surface-200 text-surface-500'}`}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
};

// ─── DROPDOWN ─────────────────────────────────────────────────────────────────
interface DropdownItem { key: string; label: string; icon?: React.ReactNode; danger?: boolean; divider?: boolean; disabled?: boolean; onClick?: () => void; }

export const Dropdown: React.FC<{ trigger: React.ReactNode; items: DropdownItem[]; align?: 'left' | 'right'; className?: string }> = ({ trigger, items, align = 'right', className = '' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className={`relative ${className}`}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">{trigger}</div>
      {open && (
        <div className={`absolute top-full mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-surface-100 py-1 min-w-[180px] animate-scale-in ${align === 'right' ? 'right-0' : 'left-0'}`}>
          {items.map((item, i) => item.divider ? <div key={i} className="my-1 border-t border-surface-100" /> : (
            <button key={item.key} disabled={item.disabled} onClick={() => { item.onClick?.(); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-left transition-colors ${item.danger ? 'text-danger-600 hover:bg-danger-50' : 'text-surface-700 hover:bg-surface-50'} ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
              {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── TOOLTIP ─────────────────────────────────────────────────────────────────
export const Tooltip: React.FC<{ content: string; children: React.ReactNode; position?: 'top' | 'bottom' | 'left' | 'right' }> = ({ content, children, position = 'top' }) => {
  const [show, setShow] = useState(false);
  const pos = { top: 'bottom-full left-1/2 -translate-x-1/2 mb-2', bottom: 'top-full left-1/2 -translate-x-1/2 mt-2', left: 'right-full top-1/2 -translate-y-1/2 mr-2', right: 'left-full top-1/2 -translate-y-1/2 ml-2' }[position];
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && <div className={`absolute ${pos} bg-surface-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap z-50 pointer-events-none animate-fade-in shadow-lg`}>{content}</div>}
    </div>
  );
};

// ─── MODAL (ConfirmDialog) ────────────────────────────────────────────────────
export const ConfirmDialog: React.FC<{ open: boolean; onClose: () => void; onConfirm: () => void; title: string; description?: string; confirmLabel?: string; variant?: 'danger' | 'warning' | 'default'; loading?: boolean }> = ({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', variant = 'default', loading }) => (
  <Modal open={open} onClose={onClose} size="sm">
    <div className="text-center">
      <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${variant === 'danger' ? 'bg-danger-100' : variant === 'warning' ? 'bg-warning-100' : 'bg-brand-100'}`}>
        {variant === 'danger' ? <XCircle size={24} className="text-danger-500" /> : <AlertCircle size={24} className={variant === 'warning' ? 'text-warning-500' : 'text-brand-500'} />}
      </div>
      <h3 className="text-base font-bold text-surface-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-surface-500 mb-6">{description}</p>}
      <div className="flex gap-3">
        <Button variant="secondary" full onClick={onClose}>Cancel</Button>
        <Button variant={variant === 'danger' ? 'danger' : 'primary'} full loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </div>
  </Modal>
);

// ─── TOGGLE ───────────────────────────────────────────────────────────────────
export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label?: string; size?: 'sm' | 'md'; disabled?: boolean }> = ({ checked, onChange, label, size = 'md', disabled }) => {
  const trackCls = { sm: 'w-8 h-4', md: 'w-11 h-6' }[size];
  const thumbBase = { sm: 'w-3 h-3', md: 'w-4 h-4' }[size];
  const thumbTranslate = { sm: checked ? 'translate-x-[18px]' : 'translate-x-[2px]', md: checked ? 'translate-x-[22px]' : 'translate-x-[2px]' }[size];
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div onClick={() => !disabled && onChange(!checked)} className={`relative ${trackCls} rounded-full transition-colors cursor-pointer ${checked ? 'bg-brand-500' : 'bg-surface-300'}`}>
        <span className={`absolute top-1/2 -translate-y-1/2 ${thumbBase} bg-white rounded-full shadow-sm transition-transform ${thumbTranslate}`} />
      </div>
      {label && <span className="text-sm font-medium text-surface-700">{label}</span>}
    </label>
  );
};

// ─── CHECKBOX ────────────────────────────────────────────────────────────────
export const Checkbox: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }> = ({ checked, onChange, label, disabled }) => (
  <label className={`flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <div onClick={() => !disabled && onChange(!checked)}
      className={`w-4 h-4 rounded-[4px] border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${checked ? 'bg-brand-500 border-brand-500' : 'bg-white border-surface-300 hover:border-brand-400'}`}>
      {checked && <Check size={10} className="text-white" strokeWidth={3} />}
    </div>
    {label && <span className="text-sm text-surface-700">{label}</span>}
  </label>
);

// ─── SCORE RING ───────────────────────────────────────────────────────────────
export const ScoreRing: React.FC<{ score: number; size?: number; strokeWidth?: number; label?: string; showValue?: boolean }> = ({ score, size = 80, strokeWidth = 6, label, showValue = true }) => {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#F43F5E';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth} />
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-bold font-display text-surface-900" style={{ fontSize: size * 0.22 }}>{score}</span>
          </div>
        )}
      </div>
      {label && <span className="text-xs text-surface-500 font-medium">{label}</span>}
    </div>
  );
};

// ─── STREAK WIDGET ────────────────────────────────────────────────────────────
export const StreakWidget: React.FC<{ streak: number; xp?: number; level?: number; compact?: boolean }> = ({ streak, xp, level, compact }) => {
  if (compact) return (
    <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-1.5">
      <span className="text-base" style={{ animation: 'streakFire 1.5s ease-in-out infinite' }}>🔥</span>
      <span className="font-bold text-sm text-orange-600">{streak}</span>
    </div>
  );
  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl" style={{ animation: 'streakFire 1.5s ease-in-out infinite' }}>🔥</div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-[800] font-display text-orange-500">{streak}</span>
            <span className="text-sm font-medium text-orange-400">day streak</span>
          </div>
          {xp !== undefined && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-orange-400">{xp} XP</span>
              {level && <span className="badge badge-orange text-[10px]">LVL {level}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export const EmptyState: React.FC<{ icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; className?: string }> = ({ icon, title, description, action, className = '' }) => (
  <div className={`empty-state ${className}`}>
    {icon && <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mb-4 text-surface-400">{icon}</div>}
    <h3 className="text-base font-semibold text-surface-700 mb-1">{title}</h3>
    {description && <p className="text-sm text-surface-400 max-w-xs mb-4">{description}</p>}
    {action}
  </div>
);

// ─── LOADING PAGE ─────────────────────────────────────────────────────────────
export const LoadingPage: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-glow">
      <Loader2 size={24} className="animate-spin text-white" />
    </div>
    <p className="text-sm text-surface-500 font-medium">{message}</p>
  </div>
);

// ─── SKELETON ─────────────────────────────────────────────────────────────────
export const Skeleton: React.FC<{ className?: string; count?: number }> = ({ className = 'h-4', count = 1 }) => (
  <>{Array.from({ length: count }).map((_, i) => <div key={i} className={`skeleton ${className} ${i > 0 ? 'mt-2' : ''}`} />)}</>
);

// ─── SECTION TITLE ────────────────────────────────────────────────────────────
export const SectionTitle: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode; className?: string }> = ({ title, subtitle, action, className = '' }) => (
  <div className={`flex items-start justify-between gap-4 ${className}`}>
    <div>
      <h2 className="text-lg font-bold font-display text-surface-900">{title}</h2>
      {subtitle && <p className="text-sm text-surface-500 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ─── PAGE HEADER ──────────────────────────────────────────────────────────────
export const PageHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode; breadcrumb?: string[]; back?: () => void }> = ({ title, subtitle, actions, breadcrumb, back }) => (
  <div className="page-header">
    <div className="flex items-center gap-3 min-w-0">
      {back && (
        <button onClick={back} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors flex-shrink-0">
          <ChevronDown size={18} className="rotate-90" />
        </button>
      )}
      <div className="min-w-0">
        {breadcrumb && (
          <div className="flex items-center gap-1 text-xs text-surface-400 mb-0.5">
            {breadcrumb.map((c, i) => <Fragment key={i}>{i > 0 && <span>/</span>}<span>{c}</span></Fragment>)}
          </div>
        )}
        <h1 className="text-xl font-bold font-display text-surface-900 truncate">{title}</h1>
        {subtitle && <p className="text-sm text-surface-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
  </div>
);

// ─── SEARCH INPUT ─────────────────────────────────────────────────────────────
export const SearchInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string; className?: string }> = ({ value, onChange, placeholder = 'Search...', className = '' }) => (
  <div className={`relative ${className}`}>
    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="form-input pl-9 pr-3 py-2 text-sm" />
    {value && <button onClick={() => onChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"><X size={14} /></button>}
  </div>
);

// ─── DATA TABLE ───────────────────────────────────────────────────────────────
interface Column<T> { key: string; header: string; render?: (row: T) => React.ReactNode; width?: string; }

export function DataTable<T>({ columns, data, rowKey, loading, emptyState, onRowClick }: { columns: Column<T>[]; data: T[]; rowKey: (row: T) => string; loading?: boolean; emptyState?: React.ReactNode; onRowClick?: (row: T) => void }) {
  if (loading) return <div className="p-8 flex justify-center"><Loader2 size={24} className="animate-spin text-brand-500" /></div>;
  if (!data.length) return <div>{emptyState || <EmptyState title="No data yet" />}</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-100">
            {columns.map(col => <th key={col.key} className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-4 py-3" style={{ width: col.width }}>{col.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={rowKey(row)} onClick={() => onRowClick?.(row)} className={`border-b border-surface-50 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-surface-50' : ''}`}>
              {columns.map(col => <td key={col.key} className="px-4 py-3 text-sm text-surface-700">{col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as React.ReactNode}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── METRIC CARD ──────────────────────────────────────────────────────────────
const MetricColorMap = {
  brand: { iconBg: 'bg-brand-100 text-brand-600', border: 'border-brand-100' },
  success: { iconBg: 'bg-success-100 text-success-600', border: 'border-success-100' },
  warning: { iconBg: 'bg-warning-100 text-warning-600', border: 'border-warning-100' },
  danger: { iconBg: 'bg-danger-100 text-danger-600', border: 'border-danger-100' },
  info: { iconBg: 'bg-info-100 text-info-600', border: 'border-info-100' },
  purple: { iconBg: 'bg-purple-100 text-purple-600', border: 'border-purple-100' },
  orange: { iconBg: 'bg-orange-100 text-orange-600', border: 'border-orange-100' },
};

export const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; subValue?: string; trend?: number; color?: keyof typeof MetricColorMap; className?: string }> = ({ icon, label, value, subValue, trend, color = 'brand', className = '' }) => {
  const c = MetricColorMap[color];
  return (
    <div className={`card p-4 border ${c.border} ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.iconBg}`}>{icon}</div>
        <span className="text-sm font-medium text-surface-500 leading-tight">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-2xl font-[800] font-display text-surface-900 tabular-nums">{value}</span>
          {subValue && <p className="text-xs text-surface-400 mt-0.5">{subValue}</p>}
        </div>
        {trend !== undefined && <span className={`text-xs font-bold ${trend >= 0 ? 'text-success-600' : 'text-danger-500'}`}>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>}
      </div>
    </div>
  );
};

// ─── CHART CONTAINER ──────────────────────────────────────────────────────────
export const ChartContainer: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, subtitle, action, children, className = '' }) => (
  <div className={`chart-container ${className}`}>
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="chart-title">{title}</h3>
        {subtitle && <p className="chart-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

// ─── ACCORDION ────────────────────────────────────────────────────────────────
export const Accordion: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; icon?: React.ReactNode }> = ({ title, children, defaultOpen = false, icon }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-surface-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 bg-surface-50 hover:bg-surface-100 transition-colors text-left">
        <span className="flex items-center gap-2 text-sm font-semibold text-surface-800">{icon}{title}</span>
        {open ? <ChevronUp size={16} className="text-surface-400" /> : <ChevronDown size={16} className="text-surface-400" />}
      </button>
      {open && <div className="p-4 bg-white">{children}</div>}
    </div>
  );
};

// ─── SPINNER ─────────────────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: 'xs' | 'sm' | 'md' | 'lg'; className?: string }> = ({ size = 'md', className = '' }) => {
  const sizes = { xs: 12, sm: 16, md: 20, lg: 28 };
  return <Loader2 size={sizes[size]} className={`animate-spin text-brand-500 ${className}`} />;
};

// ─── CHIP ─────────────────────────────────────────────────────────────────────
export const Chip: React.FC<{ label: string; onRemove?: () => void; color?: 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'gray'; size?: 'sm' | 'md'; icon?: React.ReactNode }> = ({ label, onRemove, color = 'gray', size = 'sm', icon }) => {
  const colorCls = {
    brand: 'bg-brand-50 text-brand-700 border-brand-200', success: 'bg-success-50 text-success-700 border-success-200',
    warning: 'bg-warning-50 text-warning-700 border-warning-200', danger: 'bg-danger-50 text-danger-700 border-danger-200',
    info: 'bg-info-50 text-info-700 border-info-200', gray: 'bg-surface-100 text-surface-600 border-surface-200',
  }[color];
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${colorCls} ${size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-sm px-2.5 py-1 gap-1.5'}`}>
      {icon}{label}
      {onRemove && <button onClick={onRemove} className="ml-0.5 hover:opacity-70 transition-opacity rounded-full"><X size={12} /></button>}
    </span>
  );
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastItem { id: string; message: string; variant: ToastVariant; }

let _addToast: ((t: Omit<ToastItem, 'id'>) => void) | null = null;

function fireToast(message: string, variant: ToastVariant = 'info') {
  _addToast?.({ message, variant });
}
fireToast.success = (m: string) => fireToast(m, 'success');
fireToast.error = (m: string) => fireToast(m, 'error');
fireToast.warning = (m: string) => fireToast(m, 'warning');
fireToast.info = (m: string) => fireToast(m, 'info');

export const toast = fireToast;

export const Toaster: React.FC = () => {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    _addToast = (t) => {
      const id = Math.random().toString(36).slice(2, 9);
      setItems((prev) => [...prev, { ...t, id }]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== id)), 3500);
    };
    return () => { _addToast = null; };
  }, []);

  const configs: Record<ToastVariant, { bg: string; icon: React.ReactNode }> = {
    success: { bg: 'bg-success-500', icon: <CheckCircle size={16} className="text-white flex-shrink-0" /> },
    error: { bg: 'bg-danger-500', icon: <XCircle size={16} className="text-white flex-shrink-0" /> },
    warning: { bg: 'bg-warning-500', icon: <AlertCircle size={16} className="text-white flex-shrink-0" /> },
    info: { bg: 'bg-brand-500', icon: <Info size={16} className="text-white flex-shrink-0" /> },
  };

  if (!items.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {items.map((item) => {
        const { bg, icon } = configs[item.variant];
        return (
          <div
            key={item.id}
            className={`flex items-center gap-3 ${bg} text-white px-4 py-3 rounded-xl shadow-xl text-sm font-semibold animate-slide-in-right pointer-events-auto`}
          >
            {icon}
            <span className="flex-1 min-w-0 leading-snug">{item.message}</span>
            <button
              onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
              className="ml-1 opacity-70 hover:opacity-100 transition-opacity flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

// ─── DATE RANGE ───────────────────────────────────────────────────────────────
export const DateRange: React.FC<{ from: string; to: string; onFromChange: (v: string) => void; onToChange: (v: string) => void; label?: string }> = ({ from, to, onFromChange, onToChange, label }) => (
  <div>
    {label && <label className="form-label">{label}</label>}
    <div className="flex items-center gap-2">
      <input type="date" value={from} onChange={e => onFromChange(e.target.value)} className="form-input text-sm" />
      <span className="text-surface-400 text-sm font-medium flex-shrink-0">→</span>
      <input type="date" value={to} onChange={e => onToChange(e.target.value)} className="form-input text-sm" />
    </div>
  </div>
);
