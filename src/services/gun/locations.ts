import { user, sharedLocations } from './config';
import { GunAck, Location, QueueEntry } from '../../types/gun';
import { getDisplayName } from './auth';

// Store active auto-serve timers
const autoServeTimers: { [locationId: string]: ReturnType<typeof setInterval> } = {};

export const locations = {
  create: async (name: string, autoServeTime?: number) => {
    const locationId = Math.random().toString(36).substring(2);
    const displayName = await getDisplayName();

    return await new Promise<string>((resolve, reject) => {
      if (!user.is) {
        reject(new Error('User not authenticated'));
        return resolve(locationId);
      }


      const locationData: Omit<Location, 'id'> = {
        name,
        currentNumber: 1,
        createdAt: Date.now(),
        createdBy: user.is!.pub,
        creatorName: displayName || 'Anonymous',
        queue: {},
        lastServedNumber: 0,
        autoServeTime: autoServeTime || 0,
      };

      // Also store reference in user's space
      user.get('locations').get(locationId).put(locationId, console.log);

      // Store directly in shared space
      sharedLocations.get(locationId).put(locationData, (ack: GunAck) => {
        if (ack.err) {
          console.error('Failed to create location:', ack.err);
          reject(new Error(ack.err));
          return resolve(locationId);
        }

        resolve(locationId);
      });

      resolve(locationId);
    });
  },

  get: (locationId: string) => {
    return sharedLocations.get(locationId);
  },

  getAll: () => {
    return sharedLocations;
  },

  takeNumber: (locationId: string) => {
    return new Promise<number>((resolve, reject) => {
      if (!user.is) {
        reject(new Error('User not authenticated'));
        return;
      }

      const locationRef = sharedLocations.get(locationId);
      locationRef.once((data: Location) => {
        if (!data) {
          reject('Location not found');
          return;
        }

        // Check if user already has a number
        user.get('myNumbers').get(locationId).once((existingNumber) => {
          if (existingNumber) {
            reject('You already have a number for this queue');
            return;
          }

          const currentNumber = data.currentNumber || 1;

          // Create queue entry
          const queueEntry: QueueEntry = {
            number: currentNumber,
            userId: user.is!.pub,
            timestamp: Date.now(),
            served: false
          };

          // First save user's number
          user.get('myNumbers').get(locationId).put(currentNumber, (ack: GunAck) => {
            if (ack.err) {
              reject(ack.err);
              return;
            }

            // Add to queue
            locationRef.get('queue').get(currentNumber.toString()).put(queueEntry, (ack: GunAck) => {
              if (ack.err) {
                // Rollback if queue update fails
                user.get('myNumbers').get(locationId).put(null);
                reject(ack.err);
                return;
              }

              // Increment the current number
              locationRef.get('currentNumber').put(currentNumber + 1, (ack: GunAck) => {
                if (ack.err) {
                  // Rollback if increment fails
                  user.get('myNumbers').get(locationId).put(null);
                  locationRef.get('queue').get(currentNumber.toString()).put(null);
                  reject(ack.err);
                } else {
                  resolve(currentNumber);
                }
              });
            });
          });
        });
      });
    });
  },

  relinquishNumber: (locationId: string) => {
    return new Promise<boolean>((resolve, reject) => {
      if (!user.is) {
        reject(new Error('User not authenticated'));
        return;
      }

      user.get('myNumbers').get(locationId).once((number) => {
        if (number) {
          // Remove from queue
          sharedLocations.get(locationId).get('queue').get(number.toString()).put(null, (ack: GunAck) => {
            if (ack.err) {
              reject(ack.err);
              return;
            }

            // Remove user's number
            user.get('myNumbers').get(locationId).put(null, (ack: GunAck) => {
              if (ack.err) reject(ack.err);
              else resolve(true);
            });
          });
        } else {
          resolve(true);
        }
      });
    });
  },

  updateName: (locationId: string, newName: string) => {
    return new Promise<boolean>((resolve, reject) => {
      if (!user.is) {
        reject(new Error('User not authenticated'));
        return;
      }

      sharedLocations.get(locationId).get('name').put(newName, (ack: GunAck) => {
        if (ack.err) reject(new Error(ack.err));
        else resolve(true);
      });
    });
  },

  markNumberAsServed: (locationId: string, number: number) => {
    return new Promise<boolean>((resolve, reject) => {
      if (!user.is) {
        reject(new Error('User not authenticated'));
        return;
      }

      const queueRef = sharedLocations
        .get(locationId)
        .get('queue')
        .get(number.toString());

      queueRef.put({
        served: true,
        servedAt: Date.now()
      }, (ack: GunAck) => {
        if (ack.err) {
          console.error('Error marking number as served:', ack.err);
          reject(new Error(ack.err));
        } else {
          resolve(true);
        }
      });
    });
  },

  getQueueEntries: (locationId: string) => {
    return new Promise<QueueEntry[]>((resolve, reject) => {
      if (!user.is) {
        reject(new Error('User not authenticated'));
        return;
      }

      // Verify the user is the location manager
      sharedLocations.get(locationId).once((data: Location) => {
        if (!data) {
          reject('Location not found');
          return;
        }

        if (data.createdBy !== user.is!.pub) {
          reject('Only the location manager can view queue entries');
          return;
        }

        const entries: QueueEntry[] = [];
        sharedLocations.get(locationId).get('queue').map().once((entry: QueueEntry) => {
          if (entry) {
            entries.push(entry);
          }
        });

        resolve(entries.sort((a, b) => a.number - b.number));
      });
    });
  },

  // Check and auto-serve numbers based on timer
  checkAutoServe: (locationId: string) => {
    return new Promise<void>((resolve) => {
      sharedLocations.get(locationId).once((data: Location) => {
        if (!data || !data.autoServeTime) {
          resolve();
          return;
        }

        const currentTime = Date.now();
        const autoServeMinutes = data.autoServeTime;

        // Check each number in the queue
        Object.entries(data.queue).forEach(([number, entry]) => {
          if (!entry.served && entry.timestamp) {
            const timeDiffMinutes = (currentTime - entry.timestamp) / (1000 * 60);

            if (timeDiffMinutes >= autoServeMinutes) {
              // Auto-serve the number
              locations.markNumberAsServed(locationId, parseInt(number))
                .catch(error => console.error('Error auto-serving number:', error));
            }
          }
        });

        resolve();
      });
    });
  },

  startAutoServe: (locationId: string) => {
    return new Promise<void>((resolve, reject) => {
      // Clear existing timer if any
      if (autoServeTimers[locationId]) {
        clearInterval(autoServeTimers[locationId]);
      }

      // Get location data to check if auto-serve is enabled
      sharedLocations.get(locationId).once((data: Location) => {
        if (!data) {
          reject(new Error('Location not found'));
          return;
        }

        if (!data.autoServeTime) {
          reject(new Error('Auto-serve is not enabled for this location'));
          return;
        }

        // Start periodic check (every minute)
        const timer = setInterval(() => {
          locations.checkAutoServe(locationId)
            .catch(error => console.error('Auto-serve check failed:', error));
        }, 60000); // Check every minute

        autoServeTimers[locationId] = timer;
        resolve();
      });
    });
  },

  stopAutoServe: (locationId: string) => {
    if (autoServeTimers[locationId]) {
      clearInterval(autoServeTimers[locationId]);
      delete autoServeTimers[locationId];
    }
  },

  setLastServedNumber: async (locationId: string, number: number) => {
    if (!user.is) {
      throw new Error('User not authenticated');
    }

    return new Promise<number>((resolve, reject) => {
      sharedLocations.get(locationId).get('lastServedNumber').put(number, (ack: GunAck) => {
        if (ack.err) {
          reject(new Error(ack.err));
        } else {
          resolve(number);
        }
      });
    });
  }
}; 