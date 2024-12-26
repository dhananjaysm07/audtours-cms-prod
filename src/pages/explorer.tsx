import AudioPlayer from '@/components/audio-player';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useContentStore } from '@/store/useContentStore';
import { useEffect } from 'react';
import { useLocation } from 'react-router';
import FlexiContainer from './flexi-container';
import FolderItem from '@/components/folder-item';
import { FolderUp, Home } from 'lucide-react';

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const getBreadcrumb = (path: string) => {
  const segments = path.split('/').filter((segment) => segment.length > 0);

  const breadcrumbItems = segments.map((segment, index) => {
    const currentPath = `/explorer/${segments.slice(0, index + 1).join('/')}`;
    return {
      label: capitalize(segment),
      path: currentPath,
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
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">
              {isLoading ? (
                <Skeleton className="w-20 h-4 bg-neutral-200" />
              ) : (
                'My Folders'
              )}
            </h2>
            <span>
              {isLoading ? (
                <Skeleton className="w-20 h-4 bg-neutral-200" />
              ) : (
                '2 items'
              )}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              size={'sm'}
              variant={'secondary'}
              className="min-w-0"
              disabled={isLoading}
            >
              <FolderUp size={16} />
            </Button>
            <Button
              size={'sm'}
              variant={'secondary'}
              className="min-w-0"
              disabled={isLoading}
            >
              <Home size={16} />
            </Button>
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
      </div>
    </div>
  );
};

const FolderView: React.FC = () => {
  const { isLoading } = useContentStore();

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
    <FlexiContainer
      onDrop={handleDrop}
      onDragEnd={handleDrop}
      onDragOver={handleDragOver}
      className="cursor-auto"
    >
      <div className="flex-1 flex flex-wrap gap-6 p-2 overflow-y-auto scroll-smooth h-full justify-start items-start rounded-lg">
        {isLoading
          ? new Array(5)
              .fill(0)
              .map((_, index) => (
                <Skeleton
                  key={'skeleton' + index}
                  className="h-28 aspect-square rounded-lg bg-neutral-200"
                />
              ))
          : new Array(20).fill(0).map((_, index) => {
              const kind = index % 2 === 0 ? 'folder' : 'file'; // Alternate between folder and file
              const fileKind = index % 3 === 0 ? 'audio' : 'image'; // Determine fileKind

              return (
                <FolderItem
                  {...(kind === 'file' ? { fileKind } : {})} // Conditionally pass fileKind
                  {...(kind === 'file' && fileKind === 'audio'
                    ? {
                        audioMetadata: {
                          duration: 120,
                          size: '1.2 MB',
                          createdAt: '2021-09-01',
                        },
                      }
                    : {
                        imageMetadata: {
                          url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
                          position: index,
                          createdAt: '2021-09-01',
                        },
                      })}
                  itemId={String(index)}
                  kind={kind}
                  parentId={
                    index % 2 === 0
                      ? String(index)
                      : String(Math.floor(index / 2))
                  } // Assign parentId based on kind
                  name={kind === 'folder' ? 'Folder ' + index : 'File ' + index}
                  key={index}
                />
              );
            })}
      </div>
    </FlexiContainer>
  );
};

export default ContentExplorer;
