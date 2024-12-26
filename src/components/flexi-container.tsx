import { cn } from '@/lib/utils';
import React, { useEffect, useRef, useState, forwardRef } from 'react';

export interface FlexiContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const FlexiContainer = forwardRef<HTMLDivElement, FlexiContainerProps>(
  ({ children, className, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Function to handle refs properly
    const combinedRef = (node: HTMLDivElement | null) => {
      containerRef.current = node;

      // If `ref` is a function, call it with the node
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        // Otherwise, assign the node to the `ref` object if it's not null
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    };

    const [maxHeight, setMaxHeight] = useState<string>('0');

    useEffect(() => {
      const calculateHeight = () => {
        if (containerRef.current) {
          const parent = containerRef.current.parentElement;
          if (parent) {
            const parentHeight = parent.offsetHeight;
            const siblingHeight = Array.from(parent.children)
              .filter((child) => child !== containerRef.current)
              .reduce(
                (total, child) => total + (child as HTMLElement).offsetHeight,
                0
              );

            const availableHeight = parentHeight - siblingHeight;
            setMaxHeight(`${availableHeight}px`);
          }
        }
      };

      calculateHeight();
      window.addEventListener('resize', calculateHeight);

      return () => {
        window.removeEventListener('resize', calculateHeight);
      };
    }, []);

    return (
      <div
        ref={combinedRef}
        className={cn('flex-1 flex flex-col overflow-hidden h-full', className)}
        style={{ maxHeight }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export default FlexiContainer;
