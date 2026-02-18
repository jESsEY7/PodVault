import { useState, useRef, useCallback } from 'react';

/**
 * useAudioBuffer — Full Web Audio API decoding pipeline.
 *
 * This hook demonstrates the secure audio playback pattern:
 *   1. Fetch the audio file (supports auth headers)
 *   2. Decode the ArrayBuffer into an AudioBuffer
 *   3. Route through AudioContext → AnalyserNode → destination
 *
 * Use this when you need to:
 *   - Send Authorization headers with audio requests
 *   - Decode raw binary data before playback
 *   - Pipe audio through a visualizer or effects chain
 *
 * For simpler direct-URL playback, the <audio> element approach
 * in EnhancedEpisodePlayer is more appropriate.
 */
export function useAudioBuffer() {
    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const bufferRef = useRef(null);
    const startTimeRef = useRef(0);
    const pauseOffsetRef = useRef(0);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState(null);

    // ─── Step 1: Create/get the AudioContext ─────────────────────────
    const getContext = useCallback(() => {
        if (!audioCtxRef.current) {
            const AudioCtx = window.AudioContext || window['webkitAudioContext'];
            const ctx = new AudioCtx();

            // Create the analyser for visualizations
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            analyser.connect(ctx.destination);

            audioCtxRef.current = ctx;
            analyserRef.current = analyser;
        }
        return { ctx: audioCtxRef.current, analyser: analyserRef.current };
    }, []);

    // ─── Step 2: Fetch + Decode ──────────────────────────────────────
    // This is the core of the "custom fetched data" pattern.
    // It fetches raw bytes, decodes them into a playable AudioBuffer.
    const loadAudio = useCallback(async (url, authToken = null) => {
        setIsLoading(true);
        setError(null);

        try {
            const { ctx } = getContext();

            // Resume context if suspended (browser autoplay policy)
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            // ── Fetch the audio as raw bytes ──
            const headers = new Headers();
            if (authToken) {
                headers.set('Authorization', `Bearer ${authToken}`);
            }

            const response = await fetch(url, { headers });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // ── Get the ArrayBuffer ──
            const arrayBuffer = await response.arrayBuffer();

            // ── Decode into an AudioBuffer ──
            // This converts raw MP3/WAV/OGG bytes into PCM sample data
            // that the Web Audio API can play back.
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

            bufferRef.current = audioBuffer;
            pauseOffsetRef.current = 0;
            setDuration(audioBuffer.duration);

            console.log('[AudioBuffer] Decoded:', {
                channels: audioBuffer.numberOfChannels,
                sampleRate: audioBuffer.sampleRate,
                duration: audioBuffer.duration.toFixed(2) + 's',
                length: audioBuffer.length + ' samples'
            });

            return audioBuffer;
        } catch (err) {
            console.error('[AudioBuffer] Load failed:', err);
            setError(err.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [getContext]);

    // ─── Step 3: Play from buffer ────────────────────────────────────
    // Creates a new AudioBufferSourceNode (they are one-shot:
    // once stopped, you must create a new one to play again).
    const play = useCallback((offset = null) => {
        const { ctx, analyser } = getContext();
        const buffer = bufferRef.current;
        if (!buffer) return;

        // Stop any currently playing source
        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch { /* already stopped */ }
        }

        // Create a NEW source node (they are single-use)
        const source = ctx.createBufferSource();
        source.buffer = buffer;

        // Route: source → analyser → destination (speakers)
        //
        //   [BufferSource] ──→ [AnalyserNode] ──→ [Destination]
        //                         ↓
        //                   (frequency data for visualizer)
        //
        source.connect(analyser);

        // Handle playback end
        source.onended = () => {
            setIsPlaying(false);
        };

        // Start at the correct offset
        const startOffset = offset !== null ? offset : pauseOffsetRef.current;
        source.start(0, startOffset);
        startTimeRef.current = ctx.currentTime - startOffset;
        sourceRef.current = source;

        setIsPlaying(true);
    }, [getContext]);

    // ─── Pause ───────────────────────────────────────────────────────
    const pause = useCallback(() => {
        const ctx = audioCtxRef.current;
        if (!ctx || !sourceRef.current) return;

        // Save how far we've played so we can resume
        pauseOffsetRef.current = ctx.currentTime - startTimeRef.current;

        try { sourceRef.current.stop(); } catch { /* no-op */ }
        sourceRef.current = null;
        setIsPlaying(false);
    }, []);

    // ─── Seek ────────────────────────────────────────────────────────
    const seek = useCallback((time) => {
        const clampedTime = Math.max(0, Math.min(time, duration));
        pauseOffsetRef.current = clampedTime;
        if (isPlaying) {
            play(clampedTime); // stop + restart at new position
        }
    }, [isPlaying, duration, play]);

    // ─── Current Time ────────────────────────────────────────────────
    const getCurrentTime = useCallback(() => {
        const ctx = audioCtxRef.current;
        if (!ctx || !isPlaying) return pauseOffsetRef.current;
        return ctx.currentTime - startTimeRef.current;
    }, [isPlaying]);

    // ─── Cleanup ─────────────────────────────────────────────────────
    const cleanup = useCallback(() => {
        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch { /* no-op */ }
        }
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
            audioCtxRef.current.close().catch(() => { });
        }
        audioCtxRef.current = null;
        analyserRef.current = null;
        sourceRef.current = null;
        bufferRef.current = null;
    }, []);

    return {
        // State
        isPlaying,
        isLoading,
        duration,
        error,

        // The analyser node — pass to a canvas visualizer
        analyser: analyserRef.current,

        // Actions
        loadAudio,    // (url, authToken?) → Promise<AudioBuffer>
        play,         // (offset?) → void
        pause,        // () → void
        seek,         // (seconds) → void
        getCurrentTime, // () → number
        cleanup,      // () → void
    };
}
