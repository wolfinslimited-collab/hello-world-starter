import {
  useState,
  useEffect,
  cloneElement,
  ReactElement,
  isValidElement,
  ReactNode,
} from "react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { X } from "lucide-react";

type ModalPosition = "top" | "center" | "bottom";

interface ModalProps {
  /** The element that opens the modal when clicked */
  trigger?: ReactElement;
  /** Vertical alignment of the modal */
  position?: ModalPosition;
  /** Controlled state for opening */
  open?: boolean;
  /** Callback when modal closes */
  onClose?: () => void;
  /** The content of the modal. If a function component, it receives a `close` prop. */
  children: ReactNode;
  /** Custom classes for the modal panel */
  bodyClass?: string;
  /** Custom classes for the close button wrapper */
  closeClass?: string;
  /** Allow clicking outside or pressing Escape to close */
  canClose?: boolean;
  /** Width/Layout classes */
  className?: string;
}

const positionClasses: Record<ModalPosition, string> = {
  bottom: "items-end sm:items-center", // Mobile bottom, Center desktop
  top: "items-start mt-10",
  center: "items-center",
};

export default function Modal({
  trigger,
  children,
  position = "center",
  open = false,
  canClose = true,
  closeClass = "",
  onClose,
  bodyClass = "",
  className = "",
}: ModalProps) {
  const [isOpen, setIsOpen] = useState(open);

  // Sync internal state with external prop
  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleClose = () => {
    if (!canClose) return;
    setIsOpen(false);
    onClose?.();
  };

  return (
    <>
      {/* Trigger Logic */}
      {trigger &&
        isValidElement(trigger) &&
        cloneElement(trigger as ReactElement<any>, {
          onClick: () => setIsOpen(true),
        })}

      <Transition appear show={isOpen}>
        <Dialog as="div" className="relative z-[9999]" onClose={handleClose}>
          {/* Backdrop */}
          <TransitionChild
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
          </TransitionChild>

          {/* Scrollable Container */}
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div
              className={`flex min-h-full justify-center p-4 text-center ${positionClasses[position]}`}
            >
              <TransitionChild
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95 translate-y-4"
                enterTo="opacity-100 scale-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100 translate-y-0"
                leaveTo="opacity-0 scale-95 translate-y-4"
              >
                <DialogPanel
                  className={`
                    w-full max-w-lg transform overflow-hidden rounded-2xl 
                    bg-white dark:bg-neutral-900 
                    p-3 text-left align-middle shadow-2xl transition-all 
                    border border-white/20 dark:border-neutral-700
                    backdrop-blur-md
                    ${bodyClass} ${className}
                  `}
                >
                  {/* Close Button - Top Right Absolute */}
                  {canClose && (
                    <button
                      onClick={handleClose}
                      className={`
                        absolute right-4 top-4 rounded-full p-1 transition-colors
                        hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:scale-110
                        focus:outline-none focus:ring-2 focus:ring-neutral-400
                        z-99
                        ${closeClass}
                      `}
                      aria-label="Close modal"
                    >
                      <X className="size-5 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200" />
                    </button>
                  )}

                  {/* Content Injection */}
                  <div className="mt-2">
                    {isValidElement(children)
                      ? cloneElement(children as ReactElement<any>, {
                          close: handleClose,
                        })
                      : children}
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
