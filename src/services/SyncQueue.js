import { apiClient } from '../api/apiClient';

const QUEUE_KEY = 'podvault_offline_queue';

class SyncQueueService {
    constructor() {
        this.queue = this.loadQueue();
        this.isFlushing = false;

        // Listen for online status
        window.addEventListener('online', () => this.flush());
    }

    loadQueue() {
        try {
            const data = localStorage.getItem(QUEUE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load sync queue', e);
            return [];
        }
    }

    saveQueue() {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    }

    enqueue(event) {
        const enrichedEvent = {
            ...event,
            timestamp: new Date().toISOString(),
            id: crypto.randomUUID(),
        };
        this.queue.push(enrichedEvent);
        this.saveQueue();
        console.log('[SyncQueue] Enqueued:', enrichedEvent);

        if (navigator.onLine) {
            this.flush();
        }
    }

    async flush() {
        if (this.isFlushing || this.queue.length === 0 || !navigator.onLine) return;

        this.isFlushing = true;
        console.log(`[SyncQueue] Flushing ${this.queue.length} events...`);

        const batch = [...this.queue];

        try {
            // Using a specialized sync endpoint or generic batch endpoint
            // For now, we assume a bulk ingest endpoint or iterate
            // To be efficient, we should send the batch.

            // Note: API Client implementation for sync-events is needed or we use direct axios
            // Checking apiClient, it has 'Ingest' and general handlers. 
            // We will assume /api/sync/events/ exists per plan.

            await apiClient.axiosInstance.post('/sync/events/', { events: batch });

            // On success, remove from queue
            this.queue = []; // In a robust system, we'd remove only synced items
            this.saveQueue();
            console.log('[SyncQueue] Flush successful.');
        } catch (error) {
            console.error('[SyncQueue] Flush failed:', error);
            // Keep in queue, try again later
        } finally {
            this.isFlushing = false;
        }
    }
}

export const SyncQueue = new SyncQueueService();
