import { useContentStore } from "@/store/useContentStore";
import { useState, useEffect, useRef } from "react";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Languages, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface AudioItem {
  id: string;
  name: string;
  type: string;
  path: string;
  repoId: number;
  filename: string;
  size: number;
  mimeType: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

interface AudioPlayerState {
  currentTrackIndex: number;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
}

const AudioPlayer = () => {
  const { currentPath, items } = useContentStore();
  const [{ currentTrackIndex, isPlaying, duration, currentTime }, setState] =
    useState<AudioPlayerState>({
      currentTrackIndex: 0,
      isPlaying: false,
      duration: 0,
      currentTime: 0,
    });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { isLoading } = useContentStore();

  const currentTrack: AudioItem | undefined = items[currentTrackIndex];

  useEffect(() => {
    if (currentTrack) {
      audioRef.current = new Audio(currentTrack.path);

      const handleLoadedMetadata = () => {
        setState((prev) => ({
          ...prev,
          duration: audioRef.current?.duration || 0,
        }));
      };

      const handleTimeUpdate = () => {
        setState((prev) => ({
          ...prev,
          currentTime: audioRef.current?.currentTime || 0,
        }));
      };

      const handleEnded = () => {
        setState((prev) => ({
          ...prev,
          isPlaying: false,
        }));
        handleNext();
      };

      audioRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);
      audioRef.current.addEventListener("timeupdate", handleTimeUpdate);
      audioRef.current.addEventListener("ended", handleEnded);

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener(
            "loadedmetadata",
            handleLoadedMetadata
          );
          audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
          audioRef.current.removeEventListener("ended", handleEnded);
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    }
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        void audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handlePlayPause = (): void => {
    setState((prev) => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));
  };

  const handleNext = (): void => {
    if (currentTrackIndex < items.length - 1) {
      setState((prev) => ({
        ...prev,
        currentTrackIndex: prev.currentTrackIndex + 1,
        isPlaying: false,
        currentTime: 0,
      }));
    }
  };

  const handlePrevious = (): void => {
    if (currentTrackIndex > 0) {
      setState((prev) => ({
        ...prev,
        currentTrackIndex: prev.currentTrackIndex - 1,
        isPlaying: false,
        currentTime: 0,
      }));
    }
  };

  const handleSeek = (value: number[]): void => {
    if (audioRef.current && value[0] !== undefined) {
      const newTime = (value[0] / 100) * duration;
      audioRef.current.currentTime = newTime;
      setState((prev) => ({
        ...prev,
        currentTime: newTime,
      }));
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getCurrentProgress = (): number => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  };

  const playDisabled: boolean = isLoading || !currentTrack;
  const nextDisabled: boolean =
    isLoading || currentTrackIndex >= items.length - 1;
  const prevDisabled: boolean = isLoading || currentTrackIndex <= 0;

  if (!currentTrack) return null;

  return (
    <Drawer>
      <div className="w-full grid grid-cols-2 pr-4 h-24 bottom-0 rounded-lg absolute left-0 bg-neutral-100">
        <DrawerTrigger asChild>
          <div className="flex group pl-4 py-4 hover:opacity-75 hover:bg-neutral-50 hover:cursor-pointer transition-colors duration-150 shrink items-center gap-4">
            <img
              src="/public/audio_placeholder_img.jpeg"
              alt={currentTrack.name}
              className="md:h-16 h-10 aspect-square rounded-md object-cover"
            />
            <div className="md:grid md:grid-rows-2 flex items-center my-auto gap-1">
              <h3 className="font-semibold text-sm truncate">
                {currentTrack.name}
              </h3>
              <span className="text-xs">
                {Math.round(currentTrack.size / 1024)} KB
              </span>
            </div>
          </div>
        </DrawerTrigger>
        <div className="flex gap-2 items-center justify-end">
          <button
            onClick={handlePrevious}
            disabled={prevDisabled}
            className="p-2 rounded-full h-10 aspect-square hover:opacity-75 transition-colors text-neutral-500 dark:hover:bg-neutral-800 disabled:opacity-50"
          >
            <SkipBack size={24} fill="currentColor" />
          </button>
          <button
            className="p-2 rounded-full h-14 aspect-square flex items-center justify-center shrink-0 hover:opacity-75 transition-colors text-neutral-700 dark:hover:bg-neutral-800 disabled:opacity-50"
            onClick={handlePlayPause}
            disabled={playDisabled}
          >
            {isPlaying ? (
              <Pause size={32} fill="currentColor" />
            ) : (
              <Play size={32} fill="currentColor" />
            )}
          </button>
          <button
            onClick={handleNext}
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
            src="/public/audio_placeholder_img.jpeg"
            alt={currentTrack.name}
            className="h-[40dvh] md:h-[80dvh] max-w-full mx-auto aspect-square rounded-md object-cover"
          />
          <div className="flex md:gap-4 justify-end md:justify-center flex-col">
            <h3 className="font-semibold text-4xl truncate">
              {currentTrack.name}
            </h3>
            <span className="text-sm">
              {Math.round(currentTrack.size / 1024)} KB
            </span>
            <span className="flex gap-2 items-center">
              <Languages size={16} className="text-neutral-500" />
              <span>{currentTrack.mimeType}</span>
            </span>

            <div className="flex gap-2 md:py-8 items-center justify-center">
              <button
                onClick={handlePrevious}
                disabled={prevDisabled}
                className="p-2 rounded-full h-10 aspect-square hover:opacity-75 transition-colors text-neutral-500 dark:hover:bg-neutral-800 disabled:opacity-50"
              >
                <SkipBack size={24} fill="currentColor" />
              </button>
              <button
                className="p-2 rounded-full h-14 aspect-square flex items-center justify-center shrink-0 hover:opacity-75 transition-colors text-neutral-700 dark:hover:bg-neutral-800 disabled:opacity-50"
                onClick={handlePlayPause}
                disabled={playDisabled}
              >
                {isPlaying ? (
                  <Pause size={32} fill="currentColor" />
                ) : (
                  <Play size={32} fill="currentColor" />
                )}
              </button>
              <button
                onClick={handleNext}
                disabled={nextDisabled}
                className="p-2 rounded-full h-10 aspect-square hover:opacity-75 transition-colors text-neutral-500 dark:hover:bg-neutral-800 disabled:opacity-50"
              >
                <SkipForward size={24} fill="currentColor" />
              </button>
            </div>
            <div className="flex gap-2 text-xs font-semibold text-muted-foreground items-center">
              <span>{formatTime(currentTime)}</span>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[getCurrentProgress()]}
                onValueChange={handleSeek}
                className="w-full p-2"
              />
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AudioPlayer;
