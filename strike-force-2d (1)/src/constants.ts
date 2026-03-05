import { Weapon, WeaponType } from './types';

export const ALL_WEAPONS: Record<string, Omit<Weapon, 'lastShot' | 'isUnlocked'>> = {
  // AR
  'dg-58': { id: 'dg-58', type: 'rifle', name: 'DG-58', ammo: 30, maxAmmo: 30, fireRate: 120, damage: 28, spread: 0.08, bulletsPerShot: 1, unlockCost: 500 },
  'holger-556': { id: 'holger-556', type: 'rifle', name: 'Holger 556', ammo: 30, maxAmmo: 30, fireRate: 110, damage: 26, spread: 0.07, bulletsPerShot: 1, unlockCost: 600 },
  'fr-5.56': { id: 'fr-5.56', type: 'rifle', name: 'FR 5.56', ammo: 30, maxAmmo: 30, fireRate: 100, damage: 30, spread: 0.09, bulletsPerShot: 1, unlockCost: 700 },
  'sva-545': { id: 'sva-545', type: 'rifle', name: 'SVA 545', ammo: 30, maxAmmo: 30, fireRate: 90, damage: 24, spread: 0.06, bulletsPerShot: 1, unlockCost: 800 },
  'mtz-556': { id: 'mtz-556', type: 'rifle', name: 'MTZ-556', ammo: 30, maxAmmo: 30, fireRate: 105, damage: 27, spread: 0.08, bulletsPerShot: 1, unlockCost: 900 },
  'mcw': { id: 'mcw', type: 'rifle', name: 'MCW', ammo: 30, maxAmmo: 30, fireRate: 115, damage: 25, spread: 0.07, bulletsPerShot: 1, unlockCost: 1000 },
  
  // Battle Rifle
  'sidewinder': { id: 'sidewinder', type: 'battle_rifle', name: 'Sidewinder', ammo: 20, maxAmmo: 20, fireRate: 200, damage: 45, spread: 0.12, bulletsPerShot: 1, unlockCost: 1200 },
  'bas-b': { id: 'bas-b', type: 'battle_rifle', name: 'BAS-B', ammo: 20, maxAmmo: 20, fireRate: 180, damage: 42, spread: 0.1, bulletsPerShot: 1, unlockCost: 1300 },
  'mtz-762': { id: 'mtz-762', type: 'battle_rifle', name: 'MTZ-762', ammo: 20, maxAmmo: 20, fireRate: 190, damage: 40, spread: 0.11, bulletsPerShot: 1, unlockCost: 1400 },
  
  // SMG
  'rival-9': { id: 'rival-9', type: 'smg', name: 'Rival-9', ammo: 30, maxAmmo: 30, fireRate: 70, damage: 18, spread: 0.15, bulletsPerShot: 1, unlockCost: 400 },
  'striker': { id: 'striker', type: 'smg', name: 'Striker', ammo: 25, maxAmmo: 25, fireRate: 80, damage: 22, spread: 0.12, bulletsPerShot: 1, unlockCost: 450 },
  'striker-9': { id: 'striker-9', type: 'smg', name: 'Striker 9', ammo: 30, maxAmmo: 30, fireRate: 75, damage: 20, spread: 0.14, bulletsPerShot: 1, unlockCost: 500 },
  'wsp-swarm': { id: 'wsp-swarm', type: 'smg', name: 'WSP Swarm', ammo: 40, maxAmmo: 40, fireRate: 50, damage: 15, spread: 0.2, bulletsPerShot: 1, unlockCost: 600 },
  'wsp-9': { id: 'wsp-9', type: 'smg', name: 'WSP-9', ammo: 30, maxAmmo: 30, fireRate: 85, damage: 24, spread: 0.1, bulletsPerShot: 1, unlockCost: 700 },
  'arm9': { id: 'arm9', type: 'smg', name: 'ARM9', ammo: 30, maxAmmo: 30, fireRate: 80, damage: 21, spread: 0.13, bulletsPerShot: 1, unlockCost: 800 },
  
  // LMG
  'taq-eradicator': { id: 'taq-eradicator', type: 'lmg', name: 'TAQ Eradicator', ammo: 75, maxAmmo: 75, fireRate: 150, damage: 32, spread: 0.15, bulletsPerShot: 1, unlockCost: 1500 },
  'bruen-mk9': { id: 'bruen-mk9', type: 'lmg', name: 'Bruen Mk9', ammo: 100, maxAmmo: 100, fireRate: 140, damage: 30, spread: 0.18, bulletsPerShot: 1, unlockCost: 1600 },
  'dg-58-lsw': { id: 'dg-58-lsw', type: 'lmg', name: 'DG-58 LSW', ammo: 60, maxAmmo: 60, fireRate: 130, damage: 35, spread: 0.14, bulletsPerShot: 1, unlockCost: 1700 },
  'holger-26': { id: 'holger-26', type: 'lmg', name: 'Holger 26', ammo: 60, maxAmmo: 60, fireRate: 125, damage: 33, spread: 0.12, bulletsPerShot: 1, unlockCost: 1800 },
  'pulemyot-762': { id: 'pulemyot-762', type: 'lmg', name: 'Pulemyot 762', ammo: 100, maxAmmo: 100, fireRate: 160, damage: 38, spread: 0.2, bulletsPerShot: 1, unlockCost: 2000 },
  
  // Shotgun
  'lockwood-680': { id: 'lockwood-680', type: 'shotgun', name: 'Lockwood 680', ammo: 6, maxAmmo: 6, fireRate: 900, damage: 18, spread: 0.35, bulletsPerShot: 8, unlockCost: 900 },
  'riveter': { id: 'riveter', type: 'shotgun', name: 'Riveter', ammo: 10, maxAmmo: 10, fireRate: 400, damage: 12, spread: 0.4, bulletsPerShot: 6, unlockCost: 1100 },
  'haymaker': { id: 'haymaker', type: 'shotgun', name: 'Haymaker', ammo: 12, maxAmmo: 12, fireRate: 350, damage: 10, spread: 0.45, bulletsPerShot: 10, unlockCost: 1300 },
  
  // Marksman Rifle
  'mcw-6.8': { id: 'mcw-6.8', type: 'marksman', name: 'MCW 6.8', ammo: 10, maxAmmo: 10, fireRate: 300, damage: 60, spread: 0.04, bulletsPerShot: 1, unlockCost: 1400 },
  'dm56': { id: 'dm56', type: 'marksman', name: 'DM56', ammo: 15, maxAmmo: 15, fireRate: 250, damage: 55, spread: 0.05, bulletsPerShot: 1, unlockCost: 1500 },
  'mtz-interceptor': { id: 'mtz-interceptor', type: 'marksman', name: 'MTZ Interceptor', ammo: 10, maxAmmo: 10, fireRate: 350, damage: 65, spread: 0.03, bulletsPerShot: 1, unlockCost: 1600 },
  'kvd-enforcer': { id: 'kvd-enforcer', type: 'marksman', name: 'KVD Enforcer', ammo: 12, maxAmmo: 12, fireRate: 320, damage: 58, spread: 0.04, bulletsPerShot: 1, unlockCost: 1700 },
  
  // Sniper Rifle
  'kv-inhibitor': { id: 'kv-inhibitor', type: 'sniper', name: 'KV Inhibitor', ammo: 5, maxAmmo: 5, fireRate: 800, damage: 120, spread: 0.01, bulletsPerShot: 1, unlockCost: 2500 },
  'longbow': { id: 'longbow', type: 'sniper', name: 'Longbow', ammo: 10, maxAmmo: 10, fireRate: 600, damage: 100, spread: 0.02, bulletsPerShot: 1, unlockCost: 2200 },
  'katt-amr': { id: 'katt-amr', type: 'sniper', name: 'KATT-AMR', ammo: 5, maxAmmo: 5, fireRate: 1200, damage: 150, spread: 0.005, bulletsPerShot: 1, unlockCost: 3000 },
  
  // Pistol
  'renetti': { id: 'renetti', type: 'pistol', name: 'Renetti', ammo: 15, maxAmmo: 15, fireRate: 200, damage: 22, spread: 0.08, bulletsPerShot: 1, unlockCost: 300 },
  'cor-45': { id: 'cor-45', type: 'pistol', name: 'COR-45', ammo: 12, maxAmmo: 12, fireRate: 250, damage: 20, spread: 0.05, bulletsPerShot: 1, unlockCost: 0 }, // Starter
  'wsp-stinger': { id: 'wsp-stinger', type: 'pistol', name: 'WSP Stinger', ammo: 20, maxAmmo: 20, fireRate: 60, damage: 15, spread: 0.15, bulletsPerShot: 1, unlockCost: 500 },
  'tyr': { id: 'tyr', type: 'pistol', name: 'TYR', ammo: 5, maxAmmo: 5, fireRate: 500, damage: 80, spread: 0.02, bulletsPerShot: 1, unlockCost: 800 },
  
  // Launcher
  'rgl-80': { id: 'rgl-80', type: 'launcher', name: 'RGL-80', ammo: 6, maxAmmo: 6, fireRate: 1000, damage: 100, spread: 0.1, bulletsPerShot: 1, unlockCost: 3500 },
  
  // Melee
  'karambit': { id: 'karambit', type: 'melee', name: 'Karambit', ammo: 1, maxAmmo: 1, fireRate: 400, damage: 100, spread: 0.5, bulletsPerShot: 1, unlockCost: 1000 },
};
