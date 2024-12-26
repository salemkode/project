export interface GunAck {
  err?: string;
  ok?: { '': number };
}

export interface GunAuthCallback {
  err?: string;
  pub?: string;
}

export interface UserProfile {
  name?: string;
}

export interface QueueEntry {
  number: number;
  userId: string;
  timestamp: number;
  served: boolean;
  servedAt?: number;
}

export interface Location {
  id?: string;
  name: string;
  currentNumber: number;
  createdAt: number;
  createdBy: string;
  creatorName: string;
  queue: { [key: string]: QueueEntry };
  lastServedNumber: number;
  autoExpireTime?: number;
}

export interface UserKeys {
  pub: string;
  priv: string;
  epub: string;
  epriv: string;
} 