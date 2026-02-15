import { useState, useEffect, useCallback } from 'react';

const VAULT_CACHE_NAME = 'podvault-audio-v1';

export function useOfflineVault(episodeId, audioUrl) {
    const [status, setStatus] = useState('idle'); // idle, downloading, saved, error
    const [progress, setProgress] = useState(0);

    const checkVaultStatus = useCallback(async () => {
        if (!episodeId || !audioUrl) return;
        try {
            const cache = await caches.open(VAULT_CACHE_NAME);
            const response = await cache.match(audioUrl); // Match by URL
            if (response) {
                setStatus('saved');
            } else {
                setStatus('idle');
            }
        } catch (e) {
            console.error('Error checking vault:', e);
        }
    }, [episodeId, audioUrl]);

    useEffect(() => {
        checkVaultStatus();
    }, [checkVaultStatus]);

    const saveToVault = async () => {
        if (!audioUrl) return;
        setStatus('downloading');
        setProgress(0);

        try {
            const cache = await caches.open(VAULT_CACHE_NAME);

            // Fetch with progress is tricky with standard fetch/cache API. 
            // We'll do a basic fetch for now. For progress, we'd need XHR or ReadableStream reader.
            // Simulating progress for UX or implementing Reader if needed.

            const response = await fetch(audioUrl);
            if (!response.ok) throw new Error('Network response was not ok');

            await cache.put(audioUrl, response);

            setStatus('saved');
            console.log(`[Vault] Saved ${episodeId}`);
        } catch (error) {
            console.error('[Vault] Save failed', error);
            setStatus('error');
        } finally {
            setProgress(0);
        }
    };

    const removeFromVault = async () => {
        if (!audioUrl) return;
        try {
            const cache = await caches.open(VAULT_CACHE_NAME);
            await cache.delete(audioUrl);
            setStatus('idle');
            console.log(`[Vault] Removed ${episodeId}`);
        } catch (error) {
            console.error('[Vault] Remove failed', error);
        }
    };

    const getAudioSrc = async () => {
        // Returns Blob URL if offline, else original
        try {
            const cache = await caches.open(VAULT_CACHE_NAME);
            const response = await cache.match(audioUrl);
            if (response) {
                const blob = await response.blob();
                return URL.createObjectURL(blob);
            }
        } catch (e) {
            console.warn('Vault retrieval failed, falling back to network', e);
        }
        return audioUrl;
    };

    return {
        vaultStatus: status,
        saveToVault,
        removeFromVault,
        getAudioSrc,
        progress // currently binary 0 or 100 effectively, but ready for stream impl
    };
}
