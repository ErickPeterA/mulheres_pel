import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  images: { url: string; title?: string }[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImageLightbox = ({ images, initialIndex, open, onOpenChange }: ImageLightboxProps) => {
  const [current, setCurrent] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    if (open) setCurrent(initialIndex);
  }, [open, initialIndex]);

  const goNext = useCallback(() => setCurrent((c) => Math.min(c + 1, images.length - 1)), [images.length]);
  const goPrev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, goNext, goPrev, onOpenChange]);

  if (images.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] max-h-[100dvh] w-screen h-[100dvh] p-0 border-0 bg-black/95 rounded-none [&>button]:hidden">
        <div
          className="relative w-full h-full flex items-center justify-center"
          onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStart === null) return;
            const diff = e.changedTouches[0].clientX - touchStart;
            if (diff > 50) goPrev();
            if (diff < -50) goNext();
            setTouchStart(null);
          }}
        >
          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Navigation arrows */}
          {images.length > 1 && current > 0 && (
            <button
              onClick={goPrev}
              className="absolute left-2 z-50 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          {images.length > 1 && current < images.length - 1 && (
            <button
              onClick={goNext}
              className="absolute right-2 z-50 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Image */}
          <img
            src={images[current].url}
            alt={images[current].title || ""}
            className="max-w-full max-h-[85dvh] object-contain select-none"
            draggable={false}
          />

          {/* Dots + counter */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2">
              <div className="flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      i === current ? "bg-white w-4" : "bg-white/40"
                    )}
                  />
                ))}
              </div>
              <span className="text-white/60 text-xs">{current + 1} / {images.length}</span>
            </div>
          )}

          {/* Title */}
          {images[current].title && (
            <div className="absolute top-4 left-4 right-16">
              <p className="text-white font-semibold text-sm truncate">{images[current].title}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageLightbox;
