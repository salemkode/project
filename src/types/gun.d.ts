import { IGunChainReference } from 'gun/types/chain';
import { ISEAPair } from 'gun/sea';

type GunAuthCallback = {
  ack: 2;
  soul: string;
  get: string;
  put: IGunChainReference;
  sea: ISEAPair;
  err?: string;
} | {
  ok: 0;
  pub: string;
  err?: string;
} | {
  err: string;
};

type GunPutAck = {
  ok: { '': number };
  err?: string;
};

declare module 'gun/sea' {
  interface User extends IGunChainReference {
    auth(username: string, password: string, callback: (ack: GunAuthCallback) => void): void;
    create(username: string, password: string, callback: (ack: GunAuthCallback) => void): void;
  }
} 