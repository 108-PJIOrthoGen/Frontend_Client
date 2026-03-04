import { ComponentProps } from "react";

const SprayIcon = (props: ComponentProps<"svg">) => {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M3 9h2l1-3h4l1 3h2" />
            <path d="M5 9v10a1 1 0 001 1h6a1 1 0 001-1V9" />
            <path d="M16 6h5M16 9h5M16 12h5" />
        </svg>
    );
};

export default SprayIcon;