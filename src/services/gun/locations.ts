import { user, sharedLocations } from './config';
import { GunAck, Location } from '../../types/gun';

export const locations = {
  create: (name: string) => {
    const locationId = Math.random().toString(36).substring(2);
    return new Promise<string>((resolve, reject) => {
      if (!user.is) {
        reject(new Error('User not authenticated'));
        return;
      }

      const locationData: Omit<Location, 'id'> = {
        name,
        currentNumber: 1,
        createdAt: Date.now(),
        createdBy: user.is.pub
      };

      // First authenticate the write operation
      user.get('locations').get(locationId).put(locationData, (ack: GunAck) => {
        if (ack.err) {
          reject(new Error(ack.err));
          return;
        }

        // Then store in shared space
        sharedLocations.get(locationId).put(locationData, (ack: GunAck) => {
          if (ack.err) reject(new Error(ack.err));
          else resolve(locationId);
        });
      });
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
      locationRef.once((data) => {
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
          
          // First save user's number
          user.get('myNumbers').get(locationId).put(currentNumber, (ack: GunAck) => {
            if (ack.err) {
              reject(ack.err);
              return;
            }
            
            // Only after successful number assignment, increment the queue
            locationRef.get('currentNumber').put(currentNumber + 1, (ack: GunAck) => {
              if (ack.err) {
                // Rollback if increment fails
                user.get('myNumbers').get(locationId).put(null);
                reject(ack.err);
              } else {
                resolve(currentNumber);
              }
            });
          });
        });
      });
    });
  },

  relinquishNumber: (locationId: string) => {
    return new Promise<boolean>((resolve, reject) => {
      user.get('myNumbers').get(locationId).put(null, (ack: GunAck) => {
        if (ack.err) reject(ack.err);
        else resolve(true);
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
  }
}; 