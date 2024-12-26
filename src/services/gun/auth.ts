import { user, sharedLocations } from './config';
import { UserKeys, GunAck } from '../../types/gun';
import Gun from 'gun';

export const generateNewUser = () => {
  return new Promise<UserKeys>((resolve, reject) => {
    const pair = Gun.SEA.pair();
    pair.then((keyPair: UserKeys) => {
      user.auth(keyPair, (ack) => {
        if ('err' in ack) {
          reject(new Error(ack.err));
          return;
        }
        resolve(keyPair);
      });
    });
  });
};

export const importUserFromKeys = (keyPair: UserKeys) => {
  return new Promise<void>((resolve, reject) => {
    user.auth(keyPair, (ack) => {
      if ('err' in ack) {
        reject(new Error(ack.err));
        return;
      }
      resolve();
    });
  });
};

export const logout = () => {
  user.leave();
};

export const updateDisplayName = (name: string) => {
  return new Promise<void>((resolve, reject) => {
    if (!user.is) {
      reject(new Error('User not authenticated'));
      return;
    }

    // Update profile name first and wait for completion
    user.get('profile').get('name').put(name, (ack: GunAck) => {
      if (ack.err) {
        reject(new Error(ack.err));
        return;
      }

      // After profile is updated, update locations
      let pendingUpdates = 0;
      let hasError = false;
      let locationCount = 0;

      // Create a set to track processed location IDs
      const processedLocations = new Set<string>();

      // Create a subscription to locations
      const locationSub = sharedLocations.map().on((locationData: any, locationId: string) => {
        // Skip if we've already processed this location
        if (processedLocations.has(locationId)) return;
        processedLocations.add(locationId);

        if (locationData && locationData.createdBy === user.is!.pub) {
          locationCount++;
          pendingUpdates++;
          
          sharedLocations.get(locationId).get('creatorName').put(name, (ack: GunAck) => {
            if (ack.err) {
              hasError = true;
              console.error(`Failed to update location ${locationId}:`, ack.err);
            }
            pendingUpdates--;
            
            // Check if we're done with all updates
            if (pendingUpdates === 0) {
              // Cleanup subscription
              locationSub.off();
              
              if (hasError) {
                reject(new Error('Failed to update some location names'));
              } else {
                resolve();
              }
            }
          });
        }
      });

      // Set a timeout to prevent hanging
      setTimeout(() => {
        locationSub.off();
        if (pendingUpdates > 0) {
          console.warn(`Timeout: ${pendingUpdates} location updates still pending`);
          if (hasError) {
            reject(new Error('Failed to update some location names'));
          } else {
            resolve();
          }
        } else if (locationCount === 0) {
          // If no locations were found, resolve immediately
          resolve();
        }
      }, 5000);
    });
  });
};

export const getDisplayName = () => {
  return new Promise<string>((resolve) => {
    if (!user.is) {
      resolve('');
      return;
    }

    user.get('profile').get('name').once((name) => {
      resolve(name as string || '');
    });
  });
};

export const isError = (error: unknown): error is Error => {
  return error instanceof Error;
}; 