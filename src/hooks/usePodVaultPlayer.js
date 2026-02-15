import { useState, useEffect } from 'react';
import { PodcastService } from '../services/api';

export function usePodVaultPlayer(podcastId) {
    const [source, setSource] = useState(null);

    useEffect(() => {
        // Check if the podcast exists in local storage (IndexedDB or FileSystem)
        const checkLocalStorage = async () => {
            try {
                const localFile = await localStorage.getItem(`offline_pod_${podcastId}`);

                if (localFile) {
                    console.log("🚀 Prioritizing Downloaded Data");
                    setSource(localFile); // e.g., 'file:///data/...'
                } else {
                    console.log("🌐 Streaming from Server");
                    // Fetch the secure stream token/url
                    const response = await PodcastService.getStreamData(podcastId);
                    // Assuming the backend returns { stream_url: '...' } or similar
                    // Adjust based on actual API response structure (step 124 says stream_url is returned)
                    if (response.data && response.data.stream_url) {
                        setSource(response.data.stream_url);
                    } else if (response.stream_url) {
                        setSource(response.stream_url);
                    }
                }
            } catch (error) {
                console.error("Error determining play source:", error);
            }
        };

        if (podcastId) {
            checkLocalStorage();
        }
    }, [podcastId]);

    return { source };
}
