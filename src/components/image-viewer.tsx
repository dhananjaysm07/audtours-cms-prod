import React from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Button } from './ui/button';
import { Minus, Plus } from 'lucide-react';

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
  console.log('Used image viewer');
  return (
    <div className="relative">
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="p-0 max-w-[600px] overflow-hidden">
          <TransformWrapper
            initialScale={1}
            initialPositionX={0}
            initialPositionY={0}
            centerZoomedOut={true}
            disablePadding={true}
            minScale={0.5}
            maxScale={7}
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
                    <Plus strokeWidth={1.5} />
                  </Button>
                  <Button
                    onClick={() => zoomOut()}
                    variant={'secondary'}
                    size={'sm'}
                    className="w-8"
                  >
                    <Minus strokeWidth={1.5} />
                  </Button>
                  <Button
                    onClick={() => resetTransform()}
                    variant={'secondary'}
                    size={'sm'}
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={() =>
                      window.open(imageUrl, '_blank', 'noopener,noreferrer')
                    }
                    variant="secondary"
                    size="sm"
                  >
                    Open In New Tab
                  </Button>
                </div>
                <TransformComponent>
                  {/* <div className="w-full h-[80dvh] flex items-center justify-center"> */}
                  <img
                    src={imageUrl}
                    alt={alt}
                    className="max-w-full object-cover max-h-[80dvh] min-h-[80dvh] w-full"
                    loading="lazy"
                  />
                  {/* </div> */}
                </TransformComponent>
              </React.Fragment>
            )}
          </TransformWrapper>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageViewer;
