import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useContentStore } from '@/store/useContentStore';
import {
  ChevronUp,
  Folder,
  Languages,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const getBreadcrumb = (path: string) => {
  const segments = path
    .split('/')
    .filter(segment => segment.length > 0);

  const breadcrumbItems = segments.map((segment, index) => {
    const currentPath = `/explorer/${segments.slice(0, index + 1).join('/')}`;
    return {
      label: capitalize(segment),
      path: currentPath
    };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/explorer">Home</BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbItems.length > 0 && <BreadcrumbSeparator />}
        {breadcrumbItems.map((item, index) => (
          <BreadcrumbItem key={item.path}>
            {index === breadcrumbItems.length - 1 ? (
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            ) : (
              <>
                <BreadcrumbLink href={item.path}>{item.label}</BreadcrumbLink>
                <BreadcrumbSeparator />
              </>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

const ContentExplorer = () => {
  const { isLoading } = useContentStore();
  const location = useLocation();

  const currentPath = location.pathname.replace('/explorer', '');

  useEffect(() => {
    setTimeout(() => {
      useContentStore.setState({ isLoading: false });
    }, 1500);
  }, []);

  return (
    <div className="flex flex-col bg-white p-4 rounded-lg gap-4 flex-1">
      {/* Breadcrumb */}
      <div className="bg-neutral-100 w-full rounded-md p-2">
        {getBreadcrumb(currentPath)}
      </div>
      {/* End of Breadcrumb */}

      <div className="grow w-full rounded-lg relative">
        <div className="flex p-2 justify-between">
          <div className="flex gap-2">
            <h2 className="font-semibold">Germany</h2>
            <span>2 items</span>
          </div>
          <div className="flex gap-2">
            <Button size={'sm'} variant={'secondary'} disabled={isLoading}>
              + Create
            </Button>
            <Button size={'sm'} variant={'secondary'} disabled={isLoading}>
              Sort
            </Button>
          </div>
        </div>
        <FolderView />
        <AudioPlayer />
        {/* Folder View Container */}
        {/* End of Folder View */}
      </div>
    </div>
  );
};

const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { isLoading } = useContentStore();
  const playDisabled = isLoading || false;
  const nextDisabled = isLoading || false;
  const prevDisabled = isLoading || false;

  return (
    <Drawer>
      <div className="w-full grid grid-cols-2 pr-4 h-24 bottom-0 rounded-lg absolute left-0 bg-neutral-100">
        <div className="flex group pl-4 py-4 shrink items-center gap-4">
          <DrawerTrigger asChild>
            <Button
              variant={'ghost'}
              size={'sm'}
              disabled={isLoading}
              className="hidden px-2 py-1 self-start shrink-0 group-hover:block hover:bg-neutral-200"
            >
              <ChevronUp size={24} />
            </Button>
          </DrawerTrigger>
          <img
            src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400"
            alt="Sample Audio"
            className="md:h-16 h-6 aspect-square rounded-md object-cover"
          />
          <div className="md:grid md:grid-rows-2 flex items-center my-auto gap-1">
            <h3 className="font-semibold text-sm truncate">
              Germany - Countryside Audio
            </h3>
            <span className="text-xs">1.2 MB</span>
          </div>
        </div>
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
        <div className="p-8 h-full grid grid-rows-2 md:grid-cols-2 md:grid-rows-1 gap-4">
          <img
            src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=900"
            alt="Sample Audio"
            className="h-[30dvh] md:h-[80dvh] aspect-square rounded-md object-cover"
          />
          <div className="flex md:gap-4 justify-center flex-col">
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

const FolderView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null); // Typed ref
  const [maxHeight, setMaxHeight] = useState<string>('0');
  const { isLoading } = useContentStore();
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

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer.files);
    const acceptedFiles = files.filter((file) =>
      ['image/', 'audio/'].some((type) => file.type.startsWith(type))
    );

    if (acceptedFiles.length) {
      alert(`${acceptedFiles.length} file(s) accepted!`);
    } else {
      alert('Only image or audio files are allowed!');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div
      onDrop={handleDrop}
      onDragEnd={handleDrop}
      onDragOver={handleDragOver}
      ref={containerRef}
      className="flex-1 flex flex-col overflow-hidden"
      style={{ maxHeight }}
    >
      <div className="flex-1 flex flex-wrap gap-6 p-2 overflow-y-auto scroll-smooth h-full rounded-lg">
        {isLoading
          ? new Array(5)
              .fill(0)
              .map((_, index) => (
                <Skeleton
                  key={'skeleton' + index}
                  className="h-28 aspect-square rounded-lg bg-neutral-200"
                />
              ))
          : new Array(50).fill(0).map((_, index) => <FolderItem key={index} />)}
      </div>
    </div>
  );
};

const FolderItem: React.FC = () => {
  const [isSelected, setIsSelected] = useState(false);
  const handleDoubleClick = () => {
    // setNewData
  };
  return (
    <div
      onClick={handleDoubleClick}
      onDoubleClick={() => alert('Double clicked!')}
      className={cn(
        'h-28 aspect-square flex flex-col items-center justify-center shrink-0 rounded-lg',
        isSelected && 'bg-blue-50 outline outline-blue-200'
      )}
    >
      <Folder className="text-blue-400" fill="currentColor" size={64} />
      <span className="text-sm">Folder 1</span>
    </div>
  );
};

export default ContentExplorer;
