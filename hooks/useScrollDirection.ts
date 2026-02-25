import { useEffect, useRef, useState } from 'react';

interface UseScrollDirectionReturn {
    isVisible: boolean;
    scrollDirection: 'up' | 'down' | 'idle';
}

/**
 * Hook to detect scroll direction and trigger FAB visibility changes.
 *
 * Returns a state object with:
 * - isVisible: Whether the FAB should be visible (true when scrolling up or idle)
 * - scrollDirection: Current scroll direction ('up', 'down', or 'idle')
 *
 * The hook implements industry-standard scroll-aware FAB behavior:
 * - FAB immediately hides on scroll down (to prevent obstruction)
 * - FAB instantly restores on scroll up (responsive behavior)
 * - FAB stays visible during idle periods
 *
 * Performance optimized with throttling to 60fps (16.7ms intervals).
 */
export const useScrollDirection = (
    scrollThreshold = 10,
): UseScrollDirectionReturn => {
    const [isVisible, setIsVisible] = useState(true);
    const [scrollDirection, setScrollDirection] = useState<
        'up' | 'down' | 'idle'
    >('idle');

    const lastScrollYRef = useRef(0);
    const hasScrolledRef = useRef(false);
    const throttleTimerRef = useRef<number | null>(null);
    const idleTimerRef = useRef<number | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            // Clear idle timer on scroll activity
            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
                idleTimerRef.current = null;
            }

            // Throttle scroll events to ~60fps for performance
            if (throttleTimerRef.current !== null) {
                return;
            }

            throttleTimerRef.current = window.setTimeout(() => {
                const currentScrollY = window.scrollY;

                if (!hasScrolledRef.current) {
                    // First scroll event
                    hasScrolledRef.current = true;
                    lastScrollYRef.current = currentScrollY;
                    throttleTimerRef.current = null;
                    return;
                }

                const scrollDelta = currentScrollY - lastScrollYRef.current;
                lastScrollYRef.current = currentScrollY;

                // Only process significant scroll movements to avoid jitter
                if (Math.abs(scrollDelta) < scrollThreshold) {
                    throttleTimerRef.current = null;
                    return;
                }

                if (scrollDelta > 0) {
                    // Scrolling down - immediately hide FAB
                    setScrollDirection('down');
                    setIsVisible(false);
                } else if (scrollDelta < 0) {
                    // Scrolling up - instantly restore FAB
                    setScrollDirection('up');
                    setIsVisible(true);
                }

                throttleTimerRef.current = null;
            }, 16.7); // ~60fps throttle interval (1000ms / 60fps)
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (throttleTimerRef.current) {
                clearTimeout(throttleTimerRef.current);
            }
            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
            }
        };
    }, [scrollThreshold]);

    return { isVisible, scrollDirection };
};
