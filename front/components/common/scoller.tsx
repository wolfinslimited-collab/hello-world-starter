import React, { useRef, forwardRef, useImperativeHandle } from "react";
import { useDraggable } from "react-use-draggable-scroll";

interface DraggableScrollProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface DraggableScrollRef {
  next: () => void;
  prev: () => void;
}

const DraggableScroll = forwardRef<DraggableScrollRef, DraggableScrollProps>(
  ({ children, ...attr }, ref) => {
    const xref = useRef<HTMLDivElement>(null);
    const { events } = useDraggable(
      xref as React.MutableRefObject<HTMLElement>,
      {
        applyRubberBandEffect: true,
        decayRate: 0.96,
        safeDisplacement: 11,
        isMounted: true,
      }
    );

    useImperativeHandle(ref, () => ({
      next() {
        if (xref.current) {
          xref.current.scrollTo({
            left:
              xref.current.scrollLeft +
              (window.innerWidth - window.innerWidth / 5),
            behavior: "smooth",
          });
        }
      },
      prev() {
        if (xref.current) {
          xref.current.scrollTo({
            left:
              xref.current.scrollLeft -
              (window.innerWidth - window.innerWidth / 5),
            behavior: "smooth",
          });
        }
      },
    }));

    // Disable default image drag behavior
    const handleImageDragStart = (event: React.DragEvent<HTMLImageElement>) => {
      event.preventDefault();
    };

    return (
      <div {...attr} {...events} ref={xref}>
        {/* Automatically disable drag for all images */}
        {React.Children.map(children, (child) =>
          React.isValidElement(child) && child.type === "img"
            ? React.cloneElement(child as React.ReactElement<any>, {
                onDragStart: handleImageDragStart,
              })
            : child
        )}
      </div>
    );
  }
);

export default DraggableScroll;
