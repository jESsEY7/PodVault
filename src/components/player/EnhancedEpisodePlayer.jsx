import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Settings, Cast, FastForward, Scissors, Bookmark } from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { apiClient } from '@/api/apiClient';
import { useOfflineVault } from '../../hooks/useOfflineVault';

export default function EnhancedEpisodePlayer({ episode, onClose }) {
    const { getAudioSrc } = useOfflineVault(episode.id, episode.audio_url);
    const audioRef = useRef(new Audio());
    const [audioSrc, setAudioSrc] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [skipSilence, setSkipSilence] = useState(false);
    const [showControls, setShowControls] = useState(false);

    // Mock casting state
    const [isCasting, setIsCasting] = useState(false);

    // Resolve Audio Source (Offline Priority)
    useEffect(() => {
        let mounted = true;
        getAudioSrc().then(src => {
            if (mounted && src) {
                console.log('[Player] Playing from:', src.startsWith('blob:') ? 'Vault (Offline)' : 'Network');
                setAudioSrc(src);
                audioRef.current.src = src;
                // audioRef.current.load(); // helpful?
            }
        });
        return () => { mounted = false; };
    }, [episode.audio_url, getAudioSrc]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audioSrc) return;

        const updateProgress = () => setProgress(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', () => setIsPlaying(false));

        // Auto-play when source changes? Maybe not, consistent with user intent.
        // For now, let's respect isPlaying state if we switch sources? 
        // Actually, simpler to just wait for user.

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', () => setIsPlaying(false));
            audio.pause();
        };
    }, [audioSrc]);

    useEffect(() => {
        audioRef.current.playbackRate = playbackRate;
    }, [playbackRate]);

    // Mock silence skipping logic
    useEffect(() => {
        if (skipSilence) {
            console.log('Silence skipping enabled (mock)');
        }
    }, [skipSilence]);

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (value) => {
        const newTime = value[0];
        audioRef.current.currentTime = newTime;
        setProgress(newTime);
    };

    const handleVolume = (value) => {
        const newVol = value[0];
        audioRef.current.volume = newVol;
        setVolume(newVol);
    };

    const formatTime = (time) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const toggleCast = () => {
        setIsCasting(!isCasting);
        // Integrate with real Cast API here
    };

    const cyclePlaybackRate = () => {
        const rates = [0.5, 1, 1.25, 1.5, 2];
        const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
        setPlaybackRate(nextRate);
    };

    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed bottom-0 left-0 right-0 bg-[#0C100E] border-t border-[#364442] p-4 lg:p-6 z-50 shadow-2xl"
        >
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-center">

                {/* Track Info */}
                <div className="flex items-center gap-4">
                    <img
                        src={episode.cover_image || 'https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?w=200&q=80'}
                        alt={episode.title}
                        className="w-14 h-14 rounded-xl object-cover"
                    />
                    <div>
                        <h3 className="text-[#F5F0EA] font-bold line-clamp-1">{episode.title}</h3>
                        <p className="text-[#F5F0EA]/60 text-xs">{episode.podcast_title || 'Unknown Podcast'}</p>
                    </div>
                </div>

                {/* Main Controls */}
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => { audioRef.current.currentTime -= 15; }}
                            className="text-[#F5F0EA]/60 hover:text-[#F5F0EA] transition-colors"
                        >
                            <SkipBack className="w-5 h-5" />
                        </button>

                        <button
                            onClick={togglePlay}
                            className="w-12 h-12 rounded-full bg-[#C2AD90] flex items-center justify-center text-[#0C100E] hover:scale-105 transition-transform"
                        >
                            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                        </button>

                        <button
                            onClick={() => { audioRef.current.currentTime += 15; }}
                            className="text-[#F5F0EA]/60 hover:text-[#F5F0EA] transition-colors"
                        >
                            <SkipForward className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="w-full flex items-center gap-3 text-xs text-[#F5F0EA]/40 font-mono">
                        <span>{formatTime(progress)}</span>
                        <Slider
                            value={[progress]}
                            max={duration || 100}
                            step={1}
                            onValueChange={handleSeek}
                            className="w-full"
                        />
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Advanced Controls */}
                <div className="flex items-center justify-end gap-3">

                    {/* Speed Control */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={cyclePlaybackRate}
                        className="text-[#F5F0EA] hover:bg-white/10 font-mono"
                    >
                        {playbackRate}x
                    </Button>

                    {/* Skip Silence */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSkipSilence(!skipSilence)}
                        className={`${skipSilence ? 'text-[#C2AD90] bg-[#C2AD90]/10' : 'text-[#F5F0EA]/60'} hover:bg-white/10`}
                        title="Skip Silence"
                    >
                        <Scissors className="w-4 h-4" />
                    </Button>

                    {/* Bookmark */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-[#F5F0EA]/60 hover:bg-white/10"
                        title="Bookmark Timestamp"
                    >
                        <Bookmark className="w-4 h-4" />
                    </Button>

                    {/* Cast */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleCast}
                        className={`${isCasting ? 'text-[#C2AD90] animate-pulse' : 'text-[#F5F0EA]/60'} hover:bg-white/10`}
                    >
                        <Cast className="w-4 h-4" />
                    </Button>

                    {/* Volume */}
                    <div className="flex items-center gap-2 w-24 ml-2">
                        <Volume2 className="w-4 h-4 text-[#F5F0EA]/60" />
                        <Slider
                            value={[volume]}
                            max={1}
                            step={0.01}
                            onValueChange={handleVolume}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
