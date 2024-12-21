import { user } from './config';
import { GunAuthCallback, UserKeys, GunAck } from '../../types/gun';
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

    user.get('profile').get('name').put(name, (ack: GunAck) => {
      if (ack.err) {
        reject(new Error(ack.err));
      } else {
        resolve();
      }
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

export const isError = (ack: GunAuthCallback): ack is { err: string } => {
  return 'err' in ack;
}; 