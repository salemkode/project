import Gun from 'gun';
import 'gun/sea';

// Initialize Gun with a relay peer
export const gun = Gun({
  peers: ['https://gun-manhattan.herokuapp.com/gun']
});

// Create a user reference
export const user = gun.user();

// Create a reference to the authenticated queue data
export const queueRef = gun.get('ticketQueue');