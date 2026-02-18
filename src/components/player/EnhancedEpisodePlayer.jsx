import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
    Cast, Scissors, Bookmark, X, ChevronDown, Lock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useOfflineVault } from '../../hooks/useOfflineVault';
import { useAudioBuffer } from '../../hooks/useAudioBuffer';
import { axiosInstance } from '../../api/apiClient';

export default function EnhancedEpisodePlayer({ episode, onClose }) {
    const { getAudioSrc } = useOfflineVault(episode.id, episode.audio_url);

    // Determine playback strategy:
    //   - "buffer" mode: fetch → decode → AudioBufferSourceNode (for authenticated/secure endpoints)
    //   - "element" mode: <audio> element + createMediaElementSource (for direct URLs / blob URLs)
    const useSecureMode = Boolean(episode.stream_endpoint);

    // AudioBuffer hook (secure/custom fetch path)
    const audioBuffer = useAudioBuffer();

    // Refs
    const audioRef = useRef(null);
    const canvasRef = useRef(null);
    const animFrameRef = useRef(null);
    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const progressBarRef = useRef(null);

    // State
    const [audioSrc, setAudioSrc] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [skipSilence, setSkipSilence] = useState(false);
    const [isCasting, setIsCasting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const placeholderImage = 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80';

    // Fallback audio for episodes with no audio_url stored
    const FALLBACK_AUDIO = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

    // ─── Resolve audio source (runs once per episode) ─────────────────
    useEffect(() => {
        let mounted = true;

        if (useSecureMode) {
            const token = localStorage.getItem('auth_token');
            audioBuffer.loadAudio(episode.stream_endpoint, token).then(buf => {
                if (mounted && buf) {
                    setIsLoaded(true);
                    setDuration(buf.duration);
                }
            });
        } else {
            getAudioSrc().then(src => {
                if (!mounted) return;

                // If we have an offline blob, use it.
                // Otherwise, use the Django Proxy URL which handles CORS and fallbacks.
                const proxyUrl = `${axiosInstance.defaults.baseURL}/episodes/${episode.id}/audio/`;
                const finalSrc = (src && src.startsWith('blob:')) ? src : proxyUrl;

                console.log('[ImmersivePlayer] Source:', finalSrc.startsWith('blob:') ? 'Vault (Offline)' : 'Django Proxy (CORS-Safe)');
                setAudioSrc(finalSrc);
            });
        }

        return () => { mounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [episode.id]); // Only re-run when the episode changes, not on every render

    // ─── Wire up <audio> events ──────────────────────────────────────
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioSrc) return;

        audio.src = audioSrc;
        audio.crossOrigin = "anonymous"; // Trusted proxy sends CORS headers
        audio.load();

        const onLoadedMetadata = () => {
            setDuration(audio.duration);
            setIsLoaded(true);
            console.log('[ImmersivePlayer] Audio loaded, duration:', audio.duration.toFixed(1) + 's');
        };
        const onTimeUpdate = () => {
            if (!isDragging) setCurrentTime(audio.currentTime);
        };
        const onEnded = () => setIsPlaying(false);
        const onError = () => {
            console.error('[ImmersivePlayer] Audio error:', audio.error?.message || 'unknown');
        };

        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);

        return () => {
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
        };
    }, [audioSrc, isDragging]);

    // ─── Web Audio API: connect AnalyserNode ─────────────────────────
    // CRITICAL: createMediaElementSource() hijacks audio output through the
    // Web Audio graph. If CORS fails, Web Audio MUTES all output (outputs zeroes).
    // So we ONLY connect for same-origin or blob URLs where CORS isn't an issue.
    useEffect(() => {
        if (useSecureMode) return;
        const audio = audioRef.current;
        if (!audio || !audioSrc || !isLoaded) return;

        // Connect Web Audio - The proxy sends Access-Control-Allow-Origin: *
        // so we can safely connect without muting.
        if (!audioCtxRef.current) {
            try {
                const AudioCtx = window.AudioContext || window['webkitAudioContext'];
                const ctx = new AudioCtx();
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 256;
                analyser.smoothingTimeConstant = 0.8;

                const source = ctx.createMediaElementSource(audio);
                source.connect(analyser);
                analyser.connect(ctx.destination);

                audioCtxRef.current = ctx;
                analyserRef.current = analyser;
                sourceNodeRef.current = source;
                console.log('[ImmersivePlayer] Web Audio visualizer connected');
            } catch (err) {
                console.warn('[ImmersivePlayer] Visualizer setup failed:', err.message);
            }
        }

        return () => { };
    }, [audioSrc, useSecureMode, isLoaded]);

    // ─── Cleanup on unmount ──────────────────────────────────────────
    useEffect(() => {
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                audioCtxRef.current.close().catch(() => { });
            }
            // Clean up the AudioBuffer hook's context too
            audioBuffer.cleanup();
            // Revoke blob URL
            if (audioSrc && audioSrc.startsWith('blob:')) {
                URL.revokeObjectURL(audioSrc);
            }
        };
    }, [audioSrc, audioBuffer.cleanup]);

    // ─── Canvas visualizer ───────────────────────────────────────────
    const drawVisualizer = useCallback(() => {
        const canvas = canvasRef.current;
        const analyser = analyserRef.current;
        if (!canvas || !analyser) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animFrameRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, width, height);

            const barCount = 64;
            const gap = 2;
            const barWidth = (width - gap * (barCount - 1)) / barCount;
            const step = Math.floor(bufferLength / barCount);

            for (let i = 0; i < barCount; i++) {
                const value = dataArray[i * step];
                const percent = value / 255;
                const barHeight = Math.max(2, percent * height * 0.85);
                const x = i * (barWidth + gap);
                const y = height - barHeight;

                // Gradient: sandstone → amber
                const gradient = ctx.createLinearGradient(x, y, x, height);
                gradient.addColorStop(0, `rgba(194, 173, 144, ${0.4 + percent * 0.6})`);
                gradient.addColorStop(1, `rgba(151, 117, 77, ${0.2 + percent * 0.5})`);

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.roundRect(x, y, barWidth, barHeight, 2);
                ctx.fill();
            }
        };
        draw();
    }, []);

    // Start / stop visualizer based on play state
    // In secure mode, use the AudioBuffer hook's analyser; in element mode, use the local ref.
    useEffect(() => {
        const activeAnalyser = useSecureMode ? audioBuffer.analyser : analyserRef.current;
        if (isPlaying && activeAnalyser) {
            // Point the visualizer at whichever analyser is active
            analyserRef.current = activeAnalyser;
            drawVisualizer();
        } else {
            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current);
                animFrameRef.current = null;
            }
        }
    }, [isPlaying, drawVisualizer, useSecureMode, audioBuffer.analyser]);

    // ─── Update current time for buffer mode ─────────────────────────
    useEffect(() => {
        if (!useSecureMode || !audioBuffer.isPlaying) return;
        const interval = setInterval(() => {
            setCurrentTime(audioBuffer.getCurrentTime());
        }, 100);
        return () => clearInterval(interval);
    }, [useSecureMode, audioBuffer.isPlaying, audioBuffer.getCurrentTime]);

    // ─── Playback controls ───────────────────────────────────────────
    const togglePlay = async () => {
        if (useSecureMode) {
            // BUFFER MODE: play/pause through the AudioBuffer hook
            if (isPlaying) {
                audioBuffer.pause();
            } else {
                audioBuffer.play();
            }
            setIsPlaying(!isPlaying);
            return;
        }

        // ELEMENT MODE: play/pause through the <audio> element
        const audio = audioRef.current;
        if (!audio || !audioSrc) return;

        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            await audioCtxRef.current.resume();
        }

        if (isPlaying) {
            audio.pause();
        } else {
            await audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const skip = (seconds) => {
        if (useSecureMode) {
            const newTime = Math.min(Math.max(0, audioBuffer.getCurrentTime() + seconds), duration);
            audioBuffer.seek(newTime);
            setCurrentTime(newTime);
            return;
        }
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = Math.min(Math.max(0, audio.currentTime + seconds), duration);
    };

    const cyclePlaybackRate = () => {
        const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
        const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
        setPlaybackRate(next);
        if (audioRef.current) audioRef.current.playbackRate = next;
    };

    const toggleMute = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isMuted) {
            audio.volume = volume;
            setIsMuted(false);
        } else {
            audio.volume = 0;
            setIsMuted(true);
        }
    };

    const handleVolumeChange = (e) => {
        const newVol = parseFloat(e.target.value);
        setVolume(newVol);
        setIsMuted(newVol === 0);
        if (audioRef.current) audioRef.current.volume = newVol;
    };

    // ─── Progress bar seek ───────────────────────────────────────────
    const getSeekPosition = (e) => {
        const bar = progressBarRef.current;
        if (!bar || !duration) return 0;
        const rect = bar.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        return (x / rect.width) * duration;
    };

    const onProgressDown = (e) => {
        setIsDragging(true);
        const time = getSeekPosition(e);
        setCurrentTime(time);
    };

    const onProgressMove = useCallback((e) => {
        if (!isDragging) return;
        const time = getSeekPosition(e);
        setCurrentTime(time);
    }, [isDragging, duration]);

    const onProgressUp = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);
        if (useSecureMode) {
            // Buffer mode: seek through the hook
            audioBuffer.seek(currentTime);
        } else if (audioRef.current) {
            audioRef.current.currentTime = currentTime;
        }
    }, [isDragging, currentTime, useSecureMode]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', onProgressMove);
            window.addEventListener('mouseup', onProgressUp);
            window.addEventListener('touchmove', onProgressMove);
            window.addEventListener('touchend', onProgressUp);
        }
        return () => {
            window.removeEventListener('mousemove', onProgressMove);
            window.removeEventListener('mouseup', onProgressUp);
            window.removeEventListener('touchmove', onProgressMove);
            window.removeEventListener('touchend', onProgressUp);
        };
    }, [isDragging, onProgressMove, onProgressUp]);

    // ─── Helpers ─────────────────────────────────────────────────────
    const formatTime = (t) => {
        if (!t || isNaN(t)) return '0:00';
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    // ─── Resize canvas to container ──────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const resize = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }
        };
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    // ─── Render ──────────────────────────────────────────────────────
    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[60] flex flex-col"
        >
            {/* Hidden audio element — NO crossOrigin so external CDNs always work */}
            <audio ref={audioRef} preload="metadata" />

            {/* Blurred background */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 bg-cover bg-center scale-110 blur-[60px] opacity-30"
                    style={{ backgroundImage: `url('${episode.cover_image || placeholderImage}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0C100E]/60 via-[#0C100E]/80 to-[#0C100E]" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full px-6 py-5 overflow-hidden">

                {/* Top bar */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl glass flex items-center justify-center text-[#F5F0EA]/60 hover:text-[#F5F0EA] transition-colors"
                    >
                        <ChevronDown className="w-5 h-5" />
                    </button>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#F5F0EA]/25 font-medium">
                        Now Playing
                    </span>
                    <div className="w-10" /> {/* spacer */}
                </div>

                {/* Cover art + visualizer */}
                <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                    {/* Cover */}
                    <motion.div
                        animate={{ scale: isPlaying ? 1 : 0.92, opacity: isPlaying ? 1 : 0.8 }}
                        transition={{ duration: 0.5 }}
                        className="relative w-56 h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 mb-6 flex-shrink-0"
                    >
                        <div className={`w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/5 ${isPlaying ? 'shadow-[0_0_80px_rgba(194,173,144,0.15)]' : ''}`}>
                            <img
                                src={episode.cover_image || placeholderImage}
                                alt={episode.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {/* Glow ring when playing */}
                        {isPlaying && (
                            <div className="absolute -inset-1 rounded-3xl border border-[#C2AD90]/10 animate-pulse pointer-events-none" />
                        )}
                    </motion.div>

                    {/* Visualizer */}
                    <div className="w-full max-w-md h-16 md:h-20 mb-6 flex-shrink-0">
                        <canvas ref={canvasRef} className="w-full h-full" />
                    </div>
                </div>

                {/* Track info */}
                <div className="text-center mb-5 flex-shrink-0">
                    <h2 className="text-lg md:text-xl font-bold text-[#F5F0EA] line-clamp-1 mb-1">
                        {episode.title}
                    </h2>
                    <p className="text-sm text-[#C2AD90]/60">
                        {episode.podcast_title || 'Podcast'}
                        {episode.season && episode.episode_number && (
                            <span className="text-[#F5F0EA]/20 ml-2">
                                S{episode.season} · E{episode.episode_number}
                            </span>
                        )}
                    </p>
                </div>

                {/* Progress bar */}
                <div className="mb-4 flex-shrink-0">
                    <div
                        ref={progressBarRef}
                        className="relative w-full h-6 flex items-center cursor-pointer group"
                        onMouseDown={onProgressDown}
                        onTouchStart={onProgressDown}
                    >
                        {/* Track background */}
                        <div className="absolute left-0 right-0 h-1 rounded-full bg-[#F5F0EA]/10 group-hover:h-1.5 transition-all" />

                        {/* Filled track */}
                        <div
                            className="absolute left-0 h-1 rounded-full bg-gradient-to-r from-[#C2AD90] to-[#97754D] group-hover:h-1.5 transition-all"
                            style={{ width: `${progressPercent}%` }}
                        />

                        {/* Thumb */}
                        <div
                            className="absolute w-3 h-3 rounded-full bg-[#F5F0EA] shadow-[0_0_10px_rgba(194,173,144,0.4)] opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2"
                            style={{ left: `${progressPercent}%` }}
                        />
                    </div>

                    <div className="flex justify-between text-[10px] text-[#F5F0EA]/30 font-mono mt-0.5">
                        <span>{formatTime(currentTime)}</span>
                        <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
                    </div>
                </div>

                {/* Main controls */}
                <div className="flex items-center justify-center gap-8 mb-5 flex-shrink-0">
                    <button
                        onClick={() => skip(-15)}
                        className="text-[#F5F0EA]/50 hover:text-[#F5F0EA] transition-colors relative"
                    >
                        <SkipBack className="w-6 h-6" />
                        <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[8px] text-[#F5F0EA]/30">15</span>
                    </button>

                    <button
                        onClick={togglePlay}
                        disabled={!isLoaded}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
                            ${isLoaded
                                ? 'bg-[#C2AD90] hover:bg-[#97754D] shadow-[0_0_40px_rgba(194,173,144,0.25)] hover:shadow-[0_0_60px_rgba(194,173,144,0.35)] hover:scale-105'
                                : 'bg-[#364442] opacity-50 cursor-not-allowed'
                            }`}
                    >
                        {isPlaying
                            ? <Pause className="w-7 h-7 text-[#0C100E] fill-current" />
                            : <Play className="w-7 h-7 text-[#0C100E] fill-current ml-1" />
                        }
                    </button>

                    <button
                        onClick={() => skip(15)}
                        className="text-[#F5F0EA]/50 hover:text-[#F5F0EA] transition-colors relative"
                    >
                        <SkipForward className="w-6 h-6" />
                        <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[8px] text-[#F5F0EA]/30">15</span>
                    </button>
                </div>

                {/* Secondary controls */}
                <div className="flex items-center justify-between flex-shrink-0 pb-4">
                    {/* Left: speed + skip silence */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={cyclePlaybackRate}
                            className="text-[#F5F0EA]/60 hover:text-[#C2AD90] hover:bg-white/5 font-mono text-xs px-2"
                        >
                            {playbackRate}×
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSkipSilence(!skipSilence)}
                            className={`w-8 h-8 ${skipSilence ? 'text-[#C2AD90] bg-[#C2AD90]/10' : 'text-[#F5F0EA]/40'} hover:bg-white/5`}
                            title="Skip Silence"
                        >
                            <Scissors className="w-3.5 h-3.5" />
                        </Button>
                    </div>

                    {/* Center: bookmark + cast */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-[#F5F0EA]/40 hover:text-[#C2AD90] hover:bg-white/5"
                            title="Bookmark"
                        >
                            <Bookmark className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsCasting(!isCasting)}
                            className={`w-8 h-8 ${isCasting ? 'text-[#C2AD90] animate-pulse' : 'text-[#F5F0EA]/40'} hover:bg-white/5`}
                            title="Cast"
                        >
                            <Cast className="w-3.5 h-3.5" />
                        </Button>
                    </div>

                    {/* Right: volume */}
                    <div className="flex items-center gap-2">
                        <button onClick={toggleMute} className="text-[#F5F0EA]/40 hover:text-[#F5F0EA] transition-colors">
                            {isMuted || volume === 0
                                ? <VolumeX className="w-4 h-4" />
                                : <Volume2 className="w-4 h-4" />
                            }
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-20 h-1 appearance-none bg-[#F5F0EA]/10 rounded-full outline-none
                                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
                                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#C2AD90] [&::-webkit-slider-thumb]:cursor-pointer
                                       [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:rounded-full
                                       [&::-moz-range-thumb]:bg-[#C2AD90] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
