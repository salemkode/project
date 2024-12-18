import Gun from 'gun';

// Initialize Gun with a relay peer
export const gun = Gun({
  peers: ['https://gun-manhattan.herokuapp.com/gun']
});

// Create a reference to the queue data
export const queueRef = gun.get('ticketQueue');