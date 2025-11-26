// Timeline state for video-style text animation editor
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TextClip {
  id: string;
  trackId: string;
  startTime: number; // seconds
  endTime: number; // seconds
  text: string;

  // Typography
  fontFamily: string;
  fontSize: string;
  fontWeight: number | string;
  lineHeight: string;
  letterSpacing: string;
  color: string;

  // Gradient
  gradient?: {
    enabled: boolean;
    type: "linear" | "radial" | "conic";
    angle: number;
    stops: Array<{ color: string; position: number }>;
  };

  // Animation preset applied
  animationPresetId?: string;
  animationPresetName?: string;

  // Animation keyframes
  keyframes?: Array<{
    id: string;
    time: number;
    properties: Record<string, any>;
    transition?: {
      duration: number;
      easing: string;
    };
  }>;
}

export interface Track {
  id: string;
  name: string;
  clips: TextClip[];
  locked: boolean;
  visible: boolean;
}

interface TimelineState {
  tracks: Track[];
  selectedClipId: string | null;
  currentTime: number; // playhead position in seconds
  duration: number; // total timeline duration
  isPlaying: boolean;
  zoom: number; // pixels per second

  // Actions
  addTrack: (name?: string) => string;
  removeTrack: (trackId: string) => void;
  addClip: (trackId: string, clip: Omit<TextClip, "id" | "trackId">) => string;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<TextClip>) => void;
  splitClip: (clipId: string, splitTime: number) => void;
  selectClip: (clipId: string | null) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setZoom: (zoom: number) => void;

  // Utility
  getClipById: (clipId: string) => TextClip | undefined;
  getActiveClips: (time: number) => TextClip[];
}

export const useTimeline = create<TimelineState>()(
  persist(
    (set, get) => ({
      tracks: [],
      selectedClipId: null,
      currentTime: 0,
      duration: 30,
      isPlaying: false,
      zoom: 50, // 50px per second

      // Add track
      addTrack: (name) => {
        const id = `track_${Date.now()}`;
        const track: Track = {
          id,
          name: name || `Track ${get().tracks.length + 1}`,
          clips: [],
          locked: false,
          visible: true,
        };

        set((state) => ({
          tracks: [...state.tracks, track],
        }));

        return id;
      },

      // Remove track
      removeTrack: (trackId) => {
        set((state) => ({
          tracks: state.tracks.filter((t) => t.id !== trackId),
        }));
      },

      // Add clip to track
      addClip: (trackId, clipData) => {
        const id = `clip_${Date.now()}`;
        const clip: TextClip = {
          ...clipData,
          id,
          trackId,
        };

        set((state) => ({
          tracks: state.tracks.map((track) =>
            track.id === trackId
              ? { ...track, clips: [...track.clips, clip] }
              : track
          ),
        }));

        return id;
      },

      // Remove clip
      removeClip: (clipId) => {
        set((state) => ({
          tracks: state.tracks.map((track) => ({
            ...track,
            clips: track.clips.filter((clip) => clip.id !== clipId),
          })),
          selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
        }));
      },

      // Update clip
      updateClip: (clipId, updates) => {
        set((state) => ({
          tracks: state.tracks.map((track) => ({
            ...track,
            clips: track.clips.map((clip) =>
              clip.id === clipId ? { ...clip, ...updates } : clip
            ),
          })),
        }));
      },

      // Split clip at time
      splitClip: (clipId, splitTime) => {
        const state = get();
        const clip = state.getClipById(clipId);
        if (!clip || splitTime <= clip.startTime || splitTime >= clip.endTime) return;

        // Create two clips from split
        const clip1: TextClip = {
          ...clip,
          id: `clip_${Date.now()}_1`,
          endTime: splitTime,
        };

        const clip2: TextClip = {
          ...clip,
          id: `clip_${Date.now()}_2`,
          startTime: splitTime,
        };

        set((state) => ({
          tracks: state.tracks.map((track) => ({
            ...track,
            clips: track.clips.flatMap((c) =>
              c.id === clipId ? [clip1, clip2] : [c]
            ),
          })),
        }));
      },

      // Select clip
      selectClip: (clipId) => {
        set({ selectedClipId: clipId });
      },

      // Set current time
      setCurrentTime: (time) => {
        set({ currentTime: Math.max(0, Math.min(time, get().duration)) });
      },

      // Set playing
      setIsPlaying: (playing) => {
        set({ isPlaying: playing });
      },

      // Set zoom
      setZoom: (zoom) => {
        set({ zoom: Math.max(20, Math.min(zoom, 200)) });
      },

      // Get clip by ID
      getClipById: (clipId) => {
        const state = get();
        for (const track of state.tracks) {
          const clip = track.clips.find((c) => c.id === clipId);
          if (clip) return clip;
        }
        return undefined;
      },

      // Get active clips at time
      getActiveClips: (time) => {
        const state = get();
        const activeClips: TextClip[] = [];

        for (const track of state.tracks) {
          if (!track.visible) continue;
          for (const clip of track.clips) {
            if (clip.startTime <= time && clip.endTime > time) {
              activeClips.push(clip);
            }
          }
        }

        return activeClips;
      },
    }),
    {
      name: "acerox-timeline",
    }
  )
);
