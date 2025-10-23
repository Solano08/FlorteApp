import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import classNames from 'classnames';
import { Camera } from 'lucide-react';
export const AvatarUploader = ({ imageUrl, onSelect, loading }) => {
    const inputRef = useRef(null);
    const [preview, setPreview] = useState(null);
    const handleSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        setPreview(URL.createObjectURL(file));
        onSelect(file);
    };
    return (_jsxs("div", { className: "relative inline-block", children: [_jsx("div", { className: classNames('h-28 w-28 overflow-hidden rounded-full border-[6px] border-white/30 shadow-[0_18px_38px_rgba(18,55,29,0.22)] dark:border-white/15', loading && 'opacity-70'), children: _jsx("img", { src: preview ?? imageUrl ?? 'https://avatars.dicebear.com/api/initials/FlorteApp.svg', alt: "Avatar", className: "h-full w-full object-cover" }) }), _jsx("button", { type: "button", onClick: () => inputRef.current?.click(), className: "absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-sena-green/90 text-white shadow-[0_16px_30px_rgba(57,169,0,0.35)] hover:bg-sena-green", children: _jsx(Camera, { className: "h-5 w-5" }) }), _jsx("input", { ref: inputRef, type: "file", accept: "image/*", onChange: handleSelect, className: "hidden" })] }));
};
