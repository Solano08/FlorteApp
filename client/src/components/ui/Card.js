import { jsx as _jsx } from "react/jsx-runtime";
import classNames from 'classnames';
export const Card = ({ children, className, padded = true }) => {
    return (_jsx("div", { className: classNames('rounded-2xl border border-white/20 bg-white/10 shadow-[0_18px_32px_rgba(30,60,32,0.12)] backdrop-blur-lg', 'dark:border-white/10 dark:bg-white/5', padded && 'p-4', className), children: children }));
};
