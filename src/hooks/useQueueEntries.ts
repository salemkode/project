/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { QueueEntry, Location } from "../types/gun";
import { sharedLocations, user } from "../services/gun/config";
import { sendPushNotification } from "../services/push";

interface UseQueueEntriesReturn {
    queueEntries: QueueEntry[];
    error: string | null;
    loading: boolean;
    markAsServed: (number: number) => Promise<void>;
}

// Helper function for Gun promises
const gunPromise = <T>(node: any): Promise<T> => {
    return new Promise((resolve) => {
        node.once((data: T) => resolve(data));
    });
};

export function useQueueEntries(locationId: string): UseQueueEntriesReturn {
    const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQueueEntries = async () => {
            try {
                if (!user.is) throw new Error('User not authenticated');

                const data = await gunPromise<Location>(sharedLocations.get(locationId));
                if (!data) throw new Error('Location not found');

                const entries: QueueEntry[] = [];
                await new Promise<void>((resolve) => {
                    sharedLocations.get(locationId).get('queue').map().once((entry: QueueEntry) => {
                        if (entry) entries.push(entry);
                        resolve();
                    });
                });

                setQueueEntries(entries.sort((a, b) => a.number - b.number));
                setError(null);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Failed to fetch queue entries"
                );
            } finally {
                setLoading(false);
            }
        };

        // Initial fetch
        fetchQueueEntries();

        // Subscribe to queue updates
        const queueRef = sharedLocations.get(locationId).get("queue");
        queueRef.map().on((data: QueueEntry, key: string) => {
            if (data) {
                setQueueEntries((prev) => {
                    const filtered = prev.filter((entry) => entry.number !== data.number);
                    return [...filtered, data].sort((a, b) => a.number - b.number);
                });
            } else {
                setQueueEntries((prev) =>
                    prev.filter((entry) => entry.number !== parseInt(key))
                );
            }
        });

        return () => {
            queueRef.map().off();
        };
    }, [locationId]);

    const markAsServed = async (number: number) => {
        try {
            if (!user.is) throw new Error('User not authenticated');

            // Mark the number as served
            await gunPromise(
                sharedLocations
                    .get(locationId)
                    .get('queue')
                    .get(number.toString())
                    .put({
                        served: true,
                        servedAt: Date.now(),
                    })
            );

            // Update lastServedNumber in location
            const location = await gunPromise<Location>(sharedLocations.get(locationId));
            if (location && number > (location.lastServedNumber || 0)) {
                await gunPromise(
                    sharedLocations
                        .get(locationId)
                        .get('lastServedNumber')
                        .put(number)
                );
            }

            // Get the next person's subscription and send them a notification
            const nextNumber = number + 1;
            const nextEntry = queueEntries.find(entry => entry.number === nextNumber && !entry.served);
            if (nextEntry) {
                // Get their push subscription
                const subscriptionString = await gunPromise<string>(
                    user.get('pub').get(nextEntry.userId).get('pushSubscription')
                );

                if (subscriptionString) {
                    const subscription = JSON.parse(subscriptionString);
                    await sendPushNotification(
                        subscription,
                        `It's almost your turn! Number ${number} has been served.`
                    );
                }
            }

            setError(null);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to mark number as served"
            );
        }
    };

    return {
        queueEntries,
        error,
        loading,
        markAsServed
    };
} 