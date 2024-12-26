import { create } from 'zustand';
import type { AudioState, AudioActions, AudioTrack } from '@/types';

interface AudioStore extends AudioState, AudioActions {}

export const useAudioStore = create<AudioStore>((set, get) => ({
  // Initial state
  isLoading: false,
  error: null,
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  volume: 1,
  tracks: [],
  queue: [],

  // Actions
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),

  setError: (error: string | null) => set({ error }),

  setCurrentTrack: (track: AudioTrack | null) =>
    set({ currentTrack: track, isPlaying: false, currentTime: 0 }),

  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),

  setCurrentTime: (time: number) => set({ currentTime: time }),

  setVolume: (volume: number) =>
    set({ volume: Math.max(0, Math.min(1, volume)) }),

  setTracks: (tracks: AudioTrack[]) => set({ tracks }),

  addToQueue: (trackId: string) =>
    set((state) => ({ queue: [...state.queue, trackId] })),

  removeFromQueue: (trackId: string) =>
    set((state) => ({
      queue: state.queue.filter((id) => id !== trackId),
    })),

  playNext: () => {
    const state = get();
    if (!state.currentTrack) return;

    const currentIndex = state.tracks.findIndex(
      (track) => track.id === state.currentTrack?.id
    );

    const nextTrack = state.tracks[currentIndex + 1];
    if (nextTrack) {
      set({
        currentTrack: nextTrack,
        currentTime: 0,
        isPlaying: true,
      });
    }
  },

  playPrevious: () => {
    const state = get();
    if (!state.currentTrack) return;

    const currentIndex = state.tracks.findIndex(
      (track) => track.id === state.currentTrack?.id
    );

    const previousTrack = state.tracks[currentIndex - 1];
    if (previousTrack) {
      set({
        currentTrack: previousTrack,
        currentTime: 0,
        isPlaying: true,
      });
    }
  },
}));
