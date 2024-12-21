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

export interface Location {
  id: string;
  name: string;
  currentNumber: number;
  createdAt: number;
  createdBy: string;
}

export interface UserKeys {
  pub: string;
  priv: string;
} 