/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { user, sharedLocations, gun } from '../services/gun/config';
import { GunAck, Location, QueueEntry } from '../types/gun';
import { getDisplayName } from '../services/gun/auth';
import { GunSchema, GunValueSimple, IGunChain, IGunInstance, IGunInstanceRoot, IGunSchema } from 'gun/types';
import { useState, useCallback, useEffect } from 'react';


// Query keys
const QUERY_KEYS = {
    location: (id: string) => ['location', id],
    allLocations: ['locations'],
    queueEntries: (id: string) => ['queue', id],
    myNumber: (id: string) => ['myNumber', id],
} as const;

// Gun.js helper to convert callbacks to promises
const gunPromise = <T>(gunQuery: IGunChain<IGunSchema, any, any, string>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
        gunQuery.once((data, err) => {
            if (err) reject(new Error(err));
            else resolve(data as T);
        });
    });
};

export const useCreateLocation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ name, autoServeTime }: { name: string; autoServeTime?: number }) => {
            if (!user.is) throw new Error('User not authenticated');

            const locationId = Math.random().toString(36).substring(2);
            const displayName = await getDisplayName();

            const locationData: Omit<Location, 'id'> = {
                name,
                currentNumber: 1,
                createdAt: Date.now(),
                createdBy: user.is.pub,
                creatorName: displayName || 'Anonymous',
                queue: {},
                lastServedNumber: 0,
                autoServeTime: autoServeTime || 0,
            };

            await gunPromise(user.get('locations').get(locationId).put(locationId));
            await gunPromise(sharedLocations.get(locationId).put(locationData));

            return locationId;
        },
        onSuccess: (locationId) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allLocations });
        },
    });
};

export const useLocation = (locationId: string) => {
    return useQuery({
        queryKey: QUERY_KEYS.location(locationId),
        queryFn: () => gunPromise<Location>(sharedLocations.get(locationId)),
        enabled: !!locationId,
    });
};

export const useAllLocations = () => {
    return useQuery({
        queryKey: QUERY_KEYS.allLocations,
        queryFn: async () => {
            const locations: Record<string, Location> = {};
            await new Promise<void>((resolve) => {
                sharedLocations.map().once((data: Location, id: string) => {
                    if (data) locations[id] = data;
                    resolve();
                });
            });
            return locations;
        },
    });
};

export const useTakeNumber = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (locationId: string) => {
            if (!user.is) throw new Error('User not authenticated');

            const locationRef = sharedLocations.get(locationId);
            const data = await gunPromise<Location>(locationRef);
            if (!data) throw new Error('Location not found');

            const existingNumber = await gunPromise<number>(user.get('myNumbers').get(locationId));
            if (existingNumber) throw new Error('You already have a number for this queue');

            const currentNumber = data.currentNumber || 1;
            const queueEntry: QueueEntry = {
                number: currentNumber,
                userId: user.is.pub,
                timestamp: Date.now(),
                served: false,
            };

            await gunPromise(user.get('myNumbers').get(locationId).put(currentNumber));
            await gunPromise(locationRef.get('queue').get(currentNumber.toString()).put(queueEntry));
            await gunPromise(locationRef.get('currentNumber').put(currentNumber + 1));

            return currentNumber;
        },
        onSuccess: (_, locationId) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.location(locationId) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.queueEntries(locationId) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myNumber(locationId) });
        },
    });
};

export const useRelinquishNumber = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (locationId: string) => {
            if (!user.is) throw new Error('User not authenticated');

            const number = await gunPromise<number>(user.get('myNumbers').get(locationId));
            if (!number) return true;

            await gunPromise(sharedLocations.get(locationId).get('queue').get(number.toString()).put(null));
            await gunPromise(user.get('myNumbers').get(locationId).put(null));

            return true;
        },
        onSuccess: (_, locationId) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.location(locationId) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.queueEntries(locationId) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myNumber(locationId) });
        },
    });
};

export const useUpdateLocationName = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ locationId, newName }: { locationId: string; newName: string }) => {
            if (!user.is) throw new Error('User not authenticated');
            await gunPromise(sharedLocations.get(locationId).get('name').put(newName));
            return true;
        },
        onSuccess: (_, { locationId }) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.location(locationId) });
        },
    });
};

export const useMarkNumberAsServed = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ locationId, number }: { locationId: string; number: number }) => {
            if (!user.is) throw new Error('User not authenticated');

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

            return true;
        },
        onSuccess: (_, { locationId }) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.queueEntries(locationId) });
        },
    });
};

export const useQueueEntries = (locationId: string) => {
    return useQuery({
        queryKey: QUERY_KEYS.queueEntries(locationId),
        queryFn: async () => {
            if (!user.is) throw new Error('User not authenticated');

            const data = await gunPromise<Location>(sharedLocations.get(locationId));
            if (!data) throw new Error('Location not found');
            if (data.createdBy !== user.is.pub) {
                throw new Error('Only the location manager can view queue entries');
            }

            const entries: QueueEntry[] = [];
            await new Promise<void>((resolve) => {
                sharedLocations.get(locationId).get('queue').map().once((entry: QueueEntry) => {
                    if (entry) entries.push(entry);
                    resolve();
                });
            });

            return entries.sort((a, b) => a.number - b.number);
        },
        enabled: !!locationId && !!user.is,
    });
};

// Auto-serve functionality
const autoServeTimers: { [locationId: string]: ReturnType<typeof setInterval> } = {};

export const useAutoServe = (locationId: string) => {
    const queryClient = useQueryClient();
    const [isRunning, setIsRunning] = useState(false);

    const checkAutoServe = useCallback(async () => {
        try {
            const data = await gunPromise<Location>(sharedLocations.get(locationId));
            if (!data?.autoServeTime) return;

            const currentTime = Date.now();
            const autoServeMinutes = data.autoServeTime;

            Object.entries(data.queue).forEach(([number, entry]) => {
                if (!entry.served && entry.timestamp) {
                    const timeDiffMinutes = (currentTime - entry.timestamp) / (1000 * 60);
                    if (timeDiffMinutes >= autoServeMinutes) {
                        sharedLocations
                            .get(locationId)
                            .get('queue')
                            .get(number)
                            .put({
                                served: true,
                                servedAt: Date.now(),
                            });
                    }
                }
            });

            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.queueEntries(locationId) });
        } catch (err) {
            console.error('Auto-serve check failed:', err);
        }
    }, [locationId, queryClient]);

    const startAutoServe = useCallback(async () => {
        const data = await gunPromise<Location>(sharedLocations.get(locationId));
        if (!data?.autoServeTime) {
            throw new Error('Auto-serve is not enabled for this location');
        }

        if (autoServeTimers[locationId]) {
            clearInterval(autoServeTimers[locationId]);
        }

        const timer = setInterval(checkAutoServe, 60000);
        autoServeTimers[locationId] = timer;
        setIsRunning(true);
    }, [locationId, checkAutoServe]);

    const stopAutoServe = useCallback(() => {
        if (autoServeTimers[locationId]) {
            clearInterval(autoServeTimers[locationId]);
            delete autoServeTimers[locationId];
            setIsRunning(false);
        }
    }, [locationId]);

    useEffect(() => {
        return () => {
            if (autoServeTimers[locationId]) {
                clearInterval(autoServeTimers[locationId]);
                delete autoServeTimers[locationId];
            }
        };
    }, [locationId]);

    return { startAutoServe, stopAutoServe, isRunning };
};