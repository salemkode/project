import Gun from 'gun';
import 'gun/sea';

// Initialize Gun with a relay peer
export const gun = Gun({
  peers: ['https://gun-manhattan.herokuapp.com/gun']
});

// Create a user reference
export const user = gun.user();

// Security rules for locations
export const locationSecurityRules = {
  write: (data: any, key: string, msg: any, user: any) => {
    // Only allow writes from authenticated users
    if (!user.is) return false;
    
    // For name updates, verify creator using pub key
    if (msg.put.name && data.createdBy !== user.is.pub) {
      return false;
    }
    
    return true;
  }
};

// Create a shared space for all locations
export const sharedLocations = gun.get('locations').get('data', locationSecurityRules); 