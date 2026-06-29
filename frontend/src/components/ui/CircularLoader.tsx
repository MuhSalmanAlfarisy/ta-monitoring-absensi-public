import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface CircularLoaderProps {
    isLoading: boolean;
}

export function CircularLoader({ isLoading }: CircularLoaderProps) {
    const [shouldRender, setShouldRender] = useState(isLoading);

    useEffect(() => {
        if (isLoading) {
            setShouldRender(true);
        } else {
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 200); // Wait for fade out
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    if (!shouldRender) return null;

    const text = "LOADING...";
    const characters = text.split("");
    const radius = 80; // Radius of the circle

    return createPortal(
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity duration-200 ${!isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
        >
            <div className="circular-loader-3d">
                <div className="ring-3d">
                    {characters.map((char, index) => {
                        const angle = (index / characters.length) * 360;
                        const style = {
                            '--char-index': index,
                            '--char-angle': `${angle}deg`,
                            '--radius': `${radius}px`,
                        } as React.CSSProperties;

                        return (
                            <span key={index} className="char-3d" style={style}>
                                {char}
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>,
        document.body
    );
}
