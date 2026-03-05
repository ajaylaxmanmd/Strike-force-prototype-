export interface Vector {
  x: number;
  y: number;
}

export type WeaponType = 'pistol' | 'rifle' | 'smg' | 'lmg' | 'shotgun' | 'marksman' | 'sniper' | 'battle_rifle' | 'launcher' | 'melee';

export interface Weapon {
  id: string;
  type: WeaponType;
  name: string;
  ammo: number;
  maxAmmo: number;
  fireRate: number;
  damage: number;
  spread: number;
  bulletsPerShot: number;
  lastShot: number;
  unlockCost: number;
  isUnlocked: boolean;
}

export interface Entity {
  id: string;
  pos: Vector;
  radius: number;
  health: number;
  maxHealth: number;
}

export interface GameState {
  player: PlayerState;
  enemies: EnemyState[];
  bullets: BulletState[];
  particles: ParticleState[];
  pickups: PickupState[];
  score: number;
  kills: number;
  sfp: number; // Strike Force Points
  isGameOver: boolean;
  wave: number;
  lastShot?: number;
}

export interface PlayerState extends Entity {
  armor: number;
  maxArmor: number;
  angle: number;
  weapons: Weapon[]; // Currently held weapons
  unlockedWeaponIds: string[]; // List of IDs of unlocked weapons
  currentWeaponIndex: number;
  isReloading: boolean;
  reloadTimer: number;
}

export type EnemyAIState = 'patrol' | 'chase' | 'attack';

export interface EnemyState extends Entity {
  type: 'grunt' | 'elite' | 'suicide';
  lastShot: number;
  aiState: EnemyAIState;
  patrolTarget: Vector;
  patrolWait: number;
}

export interface BulletState {
  id: string;
  pos: Vector;
  vel: Vector;
  ownerId: string;
  damage: number;
}

export interface ParticleState {
  id: string;
  pos: Vector;
  vel: Vector;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export type PickupType = 'health' | 'armor' | 'weapon';

export interface PickupState {
  id: string;
  pos: Vector;
  type: PickupType;
  radius: number;
}
