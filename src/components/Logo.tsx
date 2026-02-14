import { useId } from 'react';

export const Logo = ({ className }: { className?: string }) => {
    const uniqueId = useId();
    const maskId = `logo-mask-${uniqueId.replace(/:/g, '')}`;

    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
        >
            <mask id={maskId}>
                <rect width="24" height="24" fill="white" />
                <path
                    d="M12 3.5V13.5"
                    stroke="black"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                />
                <circle cx="12" cy="11" r="1.5" fill="black" />
            </mask>

            <path
                d="M12 22C12 22 17.5 11 17.5 8.5C17.5 5.5 15 3.5 12 3.5C9 3.5 6.5 5.5 6.5 8.5C6.5 11 12 22 12 22Z"
                mask={`url(#${maskId})`}
                opacity="0.9"
            />

            {/* Qaf Dots */}
            <circle cx="9" cy="1.5" r="1.2" />
            <circle cx="15" cy="1.5" r="1.2" />
        </svg>
    );
};

export default Logo;
