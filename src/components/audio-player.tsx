import { useContentStore } from '@/store/useContentStore';
import { useState } from 'react';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import {
  ChevronUp,
  Languages,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { isLoading } = useContentStore();
  const playDisabled = isLoading || false;
  const nextDisabled = isLoading || false;
  const prevDisabled = isLoading || false;

  return (
    <Drawer>
      <div className="w-full grid grid-cols-2 pr-4 h-24 bottom-0 rounded-lg absolute left-0 bg-neutral-100">
        <DrawerTrigger asChild>
          <div className="flex group pl-4 py-4 hover:opacity-75 hover:bg-neutral-50 hover:cursor-pointer transition-colors duration-150 shrink items-center gap-4">
            {/* <Button
              variant={'ghost'}
              size={'sm'}
              disabled={isLoading}
              className="hidden px-2 py-1 self-start shrink-0 group-hover:block hover:bg-neutral-200"
            >
              <ChevronUp size={24} />
            </Button> */}
            <img
              src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400"
              alt="Sample Audio"
              className="md:h-16 h-10 aspect-square rounded-md object-cover"
            />
            <div className="md:grid md:grid-rows-2 flex items-center my-auto gap-1">
              <h3 className="font-semibold text-sm truncate">
                Germany - Countryside Audio
              </h3>
              <span className="text-xs">1.2 MB</span>
            </div>
          </div>
        </DrawerTrigger>
        <div className="flex gap-2 items-center justify-end">
          <button
            disabled={prevDisabled}
            className="p-2 rounded-full h-10 aspect-square hover:opacity-75 transition-colors text-neutral-500 dark:hover:bg-neutral-800  disabled:opacity-50"
          >
            <SkipBack size={24} fill="currentColor" />
          </button>
          <button
            className="p-2 rounded-full h-14 aspect-square flex items-center justify-center shrink-0 hover:opacity-75 transition-colors text-neutral-700 dark:hover:bg-neutral-800  disabled:opacity-50"
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={playDisabled}
          >
            {isPlaying ? (
              <Pause size={32} fill="currentColor" />
            ) : (
              <Play size={32} fill="currentColor" />
            )}
          </button>
          <button
            disabled={nextDisabled}
            className="p-2 rounded-full h-10 aspect-square hover:opacity-75 transition-colors text-neutral-500 dark:hover:bg-neutral-800 disabled:opacity-50"
          >
            <SkipForward size={24} fill="currentColor" />
          </button>
        </div>
      </div>
      <DrawerContent className="min-h-[90dvh]">
        <div className="p-8 grid grid-rows-2 grow grid-cols-1 md:grid-cols-2 md:grid-rows-1 gap-4">
          <img
            src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=900"
            alt="Sample Audio"
            className="h-[40dvh] md:h-[80dvh] max-w-full mx-auto aspect-square rounded-md object-cover"
          />
          <div className="flex md:gap-4 justify-end md:justify-center flex-col">
            <h3 className="font-semibold text-4xl truncate">
              Germany - Countryside Audio
            </h3>
            <span className="text-sm">1.2 MB</span>
            <span className="flex gap-2 items-center">
              <Languages size={16} className="text-neutral-500" />
              <span>French Audio</span>
            </span>
            {/* Playback Controls */}

            <div className="flex gap-2 md:py-8 items-center justify-center">
              <button className="p-2 rounded-full h-10 aspect-square hover:opacity-75 transition-colors text-neutral-500 dark:hover:bg-neutral-800">
                <SkipBack size={24} fill="currentColor" />
              </button>
              <button
                className="p-2 rounded-full h-14 aspect-square flex items-center justify-center shrink-0 hover:opacity-75 transition-colors text-neutral-700 dark:hover:bg-neutral-800"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause size={32} fill="currentColor" />
                ) : (
                  <Play size={32} fill="currentColor" />
                )}
              </button>
              <button
                disabled
                className="p-2 rounded-full h-10 aspect-square hover:opacity-75 transition-colors text-neutral-500 dark:hover:bg-neutral-800 disabled:opacity-50"
              >
                <SkipForward size={24} fill="currentColor" />
              </button>
            </div>
            <div className="flex gap-2 text-xs font-semibold text-muted-foreground items-center">
              <span>0:00</span>
              <Slider
                min={0}
                max={100}
                step={1}
                defaultValue={[20]}
                className="w-full p-2"
              />
              <span>2:34</span>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AudioPlayer;
