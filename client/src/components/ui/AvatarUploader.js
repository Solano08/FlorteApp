import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { Camera } from 'lucide-react';
export const AvatarUploader = ({ imageUrl, onSelect, onRemove, loading }) => {
    const inputRef = useRef(null);
    const [preview, setPreview] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const handleSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        setPreview(URL.createObjectURL(file));
        onSelect(file);
        setMenuOpen(false);
    };
    const toggleMenu = () => {
        if (loading)
            return;
        setMenuOpen((prev) => !prev);
    };
    useEffect(() => {
        if (!menuOpen)
            return;
        const handleClickOutside = (event) => {
            if (!menuRef.current?.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen]);
    return (_jsxs("div", { className: "relative inline-block", ref: menuRef, children: [_jsx("div", { className: classNames('h-28 w-28 overflow-hidden rounded-full border-[6px] border-white/30 shadow-[0_18px_38px_rgba(18,55,29,0.22)] dark:border-white/15', loading && 'opacity-70'), children: _jsx("img", { src: preview ?? imageUrl ?? 'https://avatars.dicebear.com/api/initials/FlorteApp.svg', alt: "Avatar", className: "h-full w-full object-cover" }) }), _jsxs("div", { className: "absolute bottom-1 -right-3 sm:-right-4", children: [_jsx("button", { type: "button", onClick: toggleMenu, disabled: loading, className: "flex h-11 w-11 items-center justify-center rounded-full bg-sena-green/90 text-white shadow-[0_16px_30px_rgba(57,169,0,0.35)] transition hover:bg-sena-green disabled:cursor-not-allowed disabled:opacity-60", children: _jsx(Camera, { className: "h-5 w-5" }) }), menuOpen && (_jsxs("div", { className: "absolute right-0 z-20 mt-2 w-44 translate-x-5 rounded-2xl border border-slate-200/70 bg-white/95 p-2 text-sm text-slate-600 shadow-[0_20px_50px_rgba(15,38,25,0.25)] backdrop-blur dark:border-white/20 dark:bg-slate-900/90 dark:text-white", children: [_jsx("button", { type: "button", className: "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-sena-green/10", onClick: () => {
                                    setMenuOpen(false);
                                    inputRef.current?.click();
                                }, children: "Actualizar foto" }), onRemove && (_jsx("button", { type: "button", className: "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-rose-500 hover:bg-rose-50", onClick: () => {
                                    setMenuOpen(false);
                                    onRemove();
                                }, children: "Eliminar foto" }))] }))] }), _jsx("input", { ref: inputRef, type: "file", accept: "image/*", onChange: handleSelect, className: "hidden" })] }));
};
