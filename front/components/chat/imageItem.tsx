import { AnimatePresence, motion } from "framer-motion";
import { Trash2 } from "lucide-react";

const ImageListItem = ({
  imageUrl,
  localPreview,
  uploading,
  onRemove,
}: any) => {
  const src = localPreview ?? imageUrl ?? undefined;

  return (
    <AnimatePresence>
      {(localPreview || imageUrl) && (
        <motion.li
          key={src}
          layout
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="w-full mx-auto flex items-center gap-3"
        >
          <div className="flex items-center gap-3 w-full">
            <div className="size-10 rounded-md overflow-hidden bg-black/5 flex-shrink-0">
              {src ? (
                <img
                  src={src}
                  className="w-full h-full object-cover"
                  alt="preview"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                  No image
                </div>
              )}
            </div>

            {/* main text and status */}
            <div className="flex-1 text-sm min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="truncate"></div>
                {uploading ? (
                  <div className="text-xs text-neutral-400 ml-2">
                    Uploading…
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onRemove}
                    className="grid place-items-center rounded-full text-black w-10 h-10 hover:bg-black/10 transition-all duration-300"
                    aria-label="Delete image"
                    title="Delete"
                  >
                    <Trash2 className="size-5 text-rose-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.li>
      )}
    </AnimatePresence>
  );
};

export default ImageListItem;
