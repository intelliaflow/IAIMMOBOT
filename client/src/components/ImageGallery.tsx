import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  className?: string;
}

export function ImageGallery({ images, className }: ImageGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const showNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const showPrevious = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      <div className={cn("grid grid-cols-2 gap-2", className)}>
        {images.map((image, index) => (
          <div
            key={image}
            className={cn(
              "relative aspect-[4/3] cursor-pointer overflow-hidden rounded-lg",
              index >= 4 && "hidden"
            )}
            onClick={() => {
              setCurrentImageIndex(index);
              setIsOpen(true);
            }}
          >
            <img
              src={image}
              alt={`Image ${index + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
            />
            {index === 3 && images.length > 4 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                <span className="text-lg font-medium">+{images.length - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-50 rounded-full bg-black/50 text-white hover:bg-black/75"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
              <img
                src={images[currentImageIndex]}
                alt={`Image ${currentImageIndex + 1}`}
                className="h-full w-full object-contain"
              />
            </div>

            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 z-50 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/75"
                  onClick={showPrevious}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 z-50 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/75"
                  onClick={showNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          <div className="mt-2 flex justify-center">
            <span className="rounded-full bg-black/50 px-2 py-1 text-sm text-white">
              {currentImageIndex + 1} / {images.length}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
