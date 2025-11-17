import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
import classNames from 'classnames';
export const TextArea = forwardRef(({ label, error, hint, className, rows = 4, ...props }, ref) => {
    return (_jsxs("label", { className: "flex flex-col gap-2 text-sm font-medium text-[var(--color-text)]", children: [label, _jsx("textarea", { ref: ref, rows: rows, className: classNames('rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[var(--color-text)] outline-none transition-all focus:border-sena-green focus:ring-2 focus:ring-sena-green/30 dark:border-white/15 dark:bg-white/10', error && 'border-red-400/80 focus:ring-red-400/40', className), ...props }), hint && !error && _jsx("span", { className: "text-xs text-[var(--color-muted)]", children: hint }), error && _jsx("span", { className: "text-xs text-red-400", children: error })] }));
});
TextArea.displayName = 'TextArea';
