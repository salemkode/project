import Gun from 'gun';
import 'gun/sea';

// Initialize Gun with a relay peer
export const gun = Gun({
  peers: ['https://gun-manhattan.herokuapp.com/gun']
});

// Create a user reference
export const user = gun.user();

// Create a shared space for all locations
export const sharedLocations = gun.get('locations').get('data');
