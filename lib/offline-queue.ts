import { openDB, DBSchema } from 'idb';

interface RequestItem {
    id?: number;
    url: string;
    method: string;
    body: any;
    timestamp: number;
}

interface RevloDB extends DBSchema {
    'offline-queue': {
        key: number;
        value: RequestItem;
    };
}

const DB_NAME = 'revlo-offline-db';
const STORE_NAME = 'offline-queue';

async function getDB() {
    return openDB<RevloDB>(DB_NAME, 1, {
        upgrade(db) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        },
    });
}

export const OfflineQueue = {
    async enqueue(url: string, method: string, body: any) {
        const db = await getDB();
        await db.add(STORE_NAME, {
            url,
            method,
            body,
            timestamp: Date.now(),
        });
        console.log('Request queued for offline sync:', url);
    },

    async sync() {
        const db = await getDB();
        const queue = await db.getAll(STORE_NAME);

        if (queue.length === 0) return;

        console.log(`Syncing ${queue.length} offline requests...`);

        for (const item of queue) {
            try {
                const response = await fetch(item.url, {
                    method: item.method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(item.body),
                });

                if (response.ok) {
                    if (item.id) await db.delete(STORE_NAME, item.id);
                    console.log('Synced:', item.url);
                } else {
                    console.error('Failed to sync item:', item.url, response.statusText);
                    // Optionally leave in queue or move to a "failed" store
                }
            } catch (error) {
                console.error('Sync error (network likely down again):', error);
                return; // Stop syncing if network fails again
            }
        }
    },

    async getCount() {
        const db = await getDB();
        return db.count(STORE_NAME);
    }
};
