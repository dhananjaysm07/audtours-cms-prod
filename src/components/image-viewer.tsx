import React from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Button } from './ui/button';

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  isOpen,
  onClose,
  imageUrl,
  alt,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-3xl p-0 overflow-hidden">
        <TransformWrapper
          initialScale={1}
          initialPositionX={0}
          initialPositionY={0}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <React.Fragment>
              <div className="absolute top-2 left-2 z-10 flex gap-2">
                <Button
                  onClick={() => zoomIn()}
                  variant={'secondary'}
                  size={'sm'}
                  className="w-8"
                >
                  +
                </Button>
                <Button
                  onClick={() => zoomOut()}
                  variant={'secondary'}
                  size={'sm'}
                  className="w-8"
                >
                  -
                </Button>
                <Button
                  onClick={() => resetTransform()}
                  variant={'secondary'}
                  size={'sm'}
                >
                  Reset
                </Button>
              </div>
              <TransformComponent>
                {/* <div className="w-full h-[80dvh] flex items-center justify-center"> */}
                <img
                  src={imageUrl}
                  alt={alt}
                  className="max-w-full max-h-[80dvh] min-h-[80dvh] object-contain"
                  loading="lazy"
                />
                {/* </div> */}
              </TransformComponent>
            </React.Fragment>
          )}
        </TransformWrapper>
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewer;
