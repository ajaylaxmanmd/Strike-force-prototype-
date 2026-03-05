import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Target, MessageSquare, Heart } from 'lucide-react';
import { GameState, PlayerState, EnemyState, BulletState, ParticleState, PickupState, Weapon, WeaponType, PickupType } from './types';
import { getTacticalAdvice } from './services/aiService';
import { ALL_WEAPONS } from './constants';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [advice, setAdvice] = useState("Stay frosty, soldier.");
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(true);
  const [menuTab, setMenuTab] = useState<'home' | 'controls' | 'armory'>('home');
  const [screenShake, setScreenShake] = useState(0);
  
  // Persisted Meta-Progression
  const [totalSfp, setTotalSfp] = useState(0);
  const [unlockedWeaponIds, setUnlockedWeaponIds] = useState<string[]>(['cor-45']);
  
  // Input state
  const keys = useRef<Set<string>>(new Set());
  const mousePos = useRef({ x: 0, y: 0 });
  const isMouseDown = useRef(false);

  const startGame = () => {
    setShowMenu(false);
    initGame();
  };

  const quitToMenu = () => {
    if (gameState) {
      setTotalSfp(prev => prev + gameState.sfp);
    }
    setShowMenu(true);
    setGameState(null);
  };

  const unlockWeapon = (weaponId: string) => {
    const weapon = ALL_WEAPONS[weaponId];
    if (totalSfp >= weapon.unlockCost && !unlockedWeaponIds.includes(weaponId)) {
      setTotalSfp(prev => prev - weapon.unlockCost);
      setUnlockedWeaponIds(prev => [...prev, weaponId]);
    }
  };

  const initGame = () => {
    const starterWeapon = { ...ALL_WEAPONS['cor-45'], lastShot: 0, isUnlocked: true };
    const initialState: GameState = {
      player: {
        id: 'player',
        pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
        radius: 15,
        health: 100,
        maxHealth: 100,
        armor: 0,
        maxArmor: 100,
        angle: 0,
        weapons: [starterWeapon as Weapon],
        unlockedWeaponIds: [...unlockedWeaponIds],
        currentWeaponIndex: 0,
        isReloading: false,
        reloadTimer: 0
      },
      enemies: [],
      bullets: [],
      particles: [],
      pickups: [],
      score: 0,
      kills: 0,
      sfp: 0, // SFP earned in THIS run
      isGameOver: false,
      wave: 0 // Start at 0 so first update triggers wave 1
    };
    setGameState(initialState);
  };

  const requestAdvice = async () => {
    if (!gameState || isAdviceLoading) return;
    setIsAdviceLoading(true);
    const currentWeapon = gameState.player.weapons[gameState.player.currentWeaponIndex];
    const context = `Wave ${gameState.wave}, ${gameState.enemies.length} enemies left, ${gameState.player.health}% health, ${gameState.player.armor}% armor, using ${currentWeapon.name} with ${currentWeapon.ammo} ammo.`;
    const newAdvice = await getTacticalAdvice(context);
    setAdvice(newAdvice);
    setIsAdviceLoading(false);
  };

  useEffect(() => {
    if (showMenu || !gameState || gameState.isGameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const update = (dt: number) => {
      setScreenShake(prev => Math.max(0, prev - dt * 0.05));

      setGameState(prev => {
        if (!prev || prev.isGameOver) return prev;

        const next = { ...prev };
        const { player, enemies, bullets, particles, pickups } = next;

        // Weapon switching
        for (let i = 1; i <= 9; i++) {
          if (keys.current.has(i.toString()) && player.weapons.length >= i) {
            player.currentWeaponIndex = i - 1;
          }
        }

        const currentWeapon = player.weapons[player.currentWeaponIndex];

        // Player movement
        const speed = 0.2 * dt;
        let dx = 0;
        let dy = 0;
        if (keys.current.has('w')) dy -= 1;
        if (keys.current.has('s')) dy += 1;
        if (keys.current.has('a')) dx -= 1;
        if (keys.current.has('d')) dx += 1;

        if (dx !== 0 || dy !== 0) {
          const mag = Math.sqrt(dx * dx + dy * dy);
          player.pos.x += (dx / mag) * speed;
          player.pos.y += (dy / mag) * speed;
        }

        // Keep player in bounds
        player.pos.x = Math.max(player.radius, Math.min(CANVAS_WIDTH - player.radius, player.pos.x));
        player.pos.y = Math.max(player.radius, Math.min(CANVAS_HEIGHT - player.radius, player.pos.y));

        // Player rotation
        player.angle = Math.atan2(mousePos.current.y - player.pos.y, mousePos.current.x - player.pos.x);

        // Shooting
        if (isMouseDown.current && currentWeapon.ammo > 0 && !player.isReloading) {
          const now = performance.now();
          if (now - currentWeapon.lastShot > currentWeapon.fireRate) {
            for (let i = 0; i < currentWeapon.bulletsPerShot; i++) {
              const spreadAngle = player.angle + (Math.random() - 0.5) * currentWeapon.spread;
              next.bullets.push({
                id: Math.random().toString(),
                pos: { ...player.pos },
                vel: { x: Math.cos(spreadAngle) * 0.8, y: Math.sin(spreadAngle) * 0.8 },
                ownerId: 'player',
                damage: currentWeapon.damage
              });
            }
            currentWeapon.ammo--;
            currentWeapon.lastShot = now;
            setScreenShake(currentWeapon.type === 'shotgun' ? 15 : 5);
            
            // Muzzle flash particles
            for(let i=0; i<3; i++) {
              next.particles.push({
                id: Math.random().toString(),
                pos: { ...player.pos },
                vel: { 
                  x: (Math.random() - 0.5) * 0.2 + Math.cos(player.angle) * 0.2, 
                  y: (Math.random() - 0.5) * 0.2 + Math.sin(player.angle) * 0.2 
                },
                life: 100,
                maxLife: 100,
                color: '#fbbf24',
                size: 2
              });
            }
          }
        }

        // Reloading
        if (keys.current.has('r') && currentWeapon.ammo < currentWeapon.maxAmmo && !player.isReloading) {
          player.isReloading = true;
          player.reloadTimer = 1200;
        }

        if (player.isReloading) {
          player.reloadTimer -= dt;
          if (player.reloadTimer <= 0) {
            player.isReloading = false;
            currentWeapon.ammo = currentWeapon.maxAmmo;
          }
        }

        // Wave management
        if (enemies.length === 0) {
          if (next.wave > 0) {
            next.sfp += next.wave * 100; // Award SFP per wave
          }
          next.wave++;
          for (let i = 0; i < next.wave * 2 + 1; i++) {
            const side = Math.floor(Math.random() * 4);
            let x, y;
            if (side === 0) { x = Math.random() * CANVAS_WIDTH; y = -50; }
            else if (side === 1) { x = CANVAS_WIDTH + 50; y = Math.random() * CANVAS_HEIGHT; }
            else if (side === 2) { x = Math.random() * CANVAS_WIDTH; y = CANVAS_HEIGHT + 50; }
            else { x = -50; y = Math.random() * CANVAS_HEIGHT; }

            enemies.push({
              id: Math.random().toString(),
              pos: { x, y },
              radius: 15,
              health: 50 + (next.wave * 5),
              maxHealth: 50 + (next.wave * 5),
              type: 'grunt',
              lastShot: 0,
              aiState: 'patrol',
              patrolTarget: { x: Math.random() * CANVAS_WIDTH, y: Math.random() * CANVAS_HEIGHT },
              patrolWait: 0
            });
          }
        }

        // Enemy AI
        enemies.forEach(enemy => {
          const dx = player.pos.x - enemy.pos.x;
          const dy = player.pos.y - enemy.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angleToPlayer = Math.atan2(dy, dx);

          // Detection range
          if (dist < 300) {
            enemy.aiState = dist < 200 ? 'attack' : 'chase';
          } else if (enemy.aiState !== 'patrol') {
            enemy.aiState = 'patrol';
            enemy.patrolTarget = { x: Math.random() * CANVAS_WIDTH, y: Math.random() * CANVAS_HEIGHT };
          }

          if (enemy.aiState === 'patrol') {
            const pdx = enemy.patrolTarget.x - enemy.pos.x;
            const pdy = enemy.patrolTarget.y - enemy.pos.y;
            const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
            
            if (pdist < 10) {
              enemy.patrolWait -= dt;
              if (enemy.patrolWait <= 0) {
                enemy.patrolTarget = { x: Math.random() * CANVAS_WIDTH, y: Math.random() * CANVAS_HEIGHT };
                enemy.patrolWait = 1000 + Math.random() * 2000;
              }
            } else {
              const pangle = Math.atan2(pdy, pdx);
              enemy.pos.x += Math.cos(pangle) * 0.04 * dt;
              enemy.pos.y += Math.sin(pangle) * 0.04 * dt;
            }
          } else if (enemy.aiState === 'chase') {
            enemy.pos.x += Math.cos(angleToPlayer) * 0.07 * dt;
            enemy.pos.y += Math.sin(angleToPlayer) * 0.07 * dt;
          } else if (enemy.aiState === 'attack') {
            if (dist > 150) {
              enemy.pos.x += Math.cos(angleToPlayer) * 0.07 * dt;
              enemy.pos.y += Math.sin(angleToPlayer) * 0.07 * dt;
            } else if (dist < 100) {
              enemy.pos.x -= Math.cos(angleToPlayer) * 0.04 * dt;
              enemy.pos.y -= Math.sin(angleToPlayer) * 0.04 * dt;
            }

            // Enemy shooting
            const now = performance.now();
            if (now - enemy.lastShot > (2500 - Math.min(1500, next.wave * 100))) {
              next.bullets.push({
                id: Math.random().toString(),
                pos: { ...enemy.pos },
                vel: { x: Math.cos(angleToPlayer) * 0.4, y: Math.sin(angleToPlayer) * 0.4 },
                ownerId: enemy.id,
                damage: 10
              });
              enemy.lastShot = now;
            }
          }
        });

        // Pickup collection
        next.pickups = pickups.filter(pickup => {
          const dx = player.pos.x - pickup.pos.x;
          const dy = player.pos.y - pickup.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < player.radius + pickup.radius) {
            if (pickup.type === 'health') {
              player.health = Math.min(player.maxHealth, player.health + 25);
            } else if (pickup.type === 'armor') {
              player.armor = Math.min(player.maxArmor, player.armor + 50);
            } else if (pickup.type === 'weapon') {
              // Pick a random unlocked weapon (excluding current if possible)
              const pool = player.unlockedWeaponIds;
              const randomId = pool[Math.floor(Math.random() * pool.length)];
              const weaponData = ALL_WEAPONS[randomId];
              
              if (!player.weapons.some(w => w.id === weaponData.id)) {
                player.weapons.push({ ...weaponData, lastShot: 0, isUnlocked: true } as Weapon);
              } else {
                const weapon = player.weapons.find(w => w.id === weaponData.id)!;
                weapon.ammo = weapon.maxAmmo;
              }
            }
            return false;
          }
          return true;
        });

        // Bullet updates
        next.bullets = bullets.filter(b => {
          b.pos.x += b.vel.x * dt;
          b.pos.y += b.vel.y * dt;

          // Collision detection
          if (b.ownerId === 'player') {
            for (const enemy of enemies) {
              const dx = b.pos.x - enemy.pos.x;
              const dy = b.pos.y - enemy.pos.y;
              if (Math.sqrt(dx * dx + dy * dy) < enemy.radius) {
                enemy.health -= b.damage;
                // Blood particles
                for(let i=0; i<8; i++) {
                  next.particles.push({
                    id: Math.random().toString(),
                    pos: { ...b.pos },
                    vel: { x: (Math.random() - 0.5) * 0.4, y: (Math.random() - 0.5) * 0.4 },
                    life: 300,
                    maxLife: 300,
                    color: '#ef4444',
                    size: Math.random() * 3 + 1
                  });
                }
                return false;
              }
            }
          } else {
            const dx = b.pos.x - player.pos.x;
            const dy = b.pos.y - player.pos.y;
            if (Math.sqrt(dx * dx + dy * dy) < player.radius) {
              // Armor absorption: 70% to armor, 30% to health
              if (player.armor > 0) {
                const armorDamage = b.damage * 0.7;
                const healthDamage = b.damage * 0.3;
                player.armor -= armorDamage;
                player.health -= healthDamage;
                if (player.armor < 0) {
                  player.health += player.armor; // Apply leftover damage to health
                  player.armor = 0;
                }
              } else {
                player.health -= b.damage;
              }
              
              setScreenShake(10);
              if (player.health <= 0) next.isGameOver = true;
              return false;
            }
          }

          return b.pos.x > -100 && b.pos.x < CANVAS_WIDTH + 100 && b.pos.y > -100 && b.pos.y < CANVAS_HEIGHT + 100;
        });

        // Enemy cleanup
        next.enemies = enemies.filter(e => {
          if (e.health <= 0) {
            next.score += 100;
            next.kills += 1;
            
            // Spawn pickup on death (20% chance)
            if (Math.random() < 0.2) {
              const types: PickupType[] = ['health', 'armor', 'weapon'];
              next.pickups.push({
                id: Math.random().toString(),
                pos: { ...e.pos },
                type: types[Math.floor(Math.random() * types.length)],
                radius: 10
              });
            }

            // Explosion particles on death
            for(let i=0; i<15; i++) {
              next.particles.push({
                id: Math.random().toString(),
                pos: { ...e.pos },
                vel: { x: (Math.random() - 0.5) * 0.6, y: (Math.random() - 0.5) * 0.6 },
                life: 500,
                maxLife: 500,
                color: i % 2 === 0 ? '#ef4444' : '#991b1b',
                size: Math.random() * 4 + 2
              });
            }
            return false;
          }
          return true;
        });

        // Particles
        next.particles = particles.filter(p => {
          p.pos.x += p.vel.x * dt;
          p.pos.y += p.vel.y * dt;
          p.life -= dt;
          return p.life > 0;
        });

        return next;
      });
    };

    const draw = () => {
      ctx.save();
      
      // Apply screen shake
      if (screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
      }

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Grid lines for depth
      ctx.strokeStyle = '#171717';
      ctx.lineWidth = 1;
      for (let i = 0; i < CANVAS_WIDTH; i += 50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
      }
      for (let i = 0; i < CANVAS_HEIGHT; i += 50) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke();
      }

      if (!gameState) {
        ctx.restore();
        return;
      }

      // Draw particles
      gameState.particles.forEach(p => {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Draw pickups
      gameState.pickups.forEach(p => {
        ctx.save();
        ctx.translate(p.pos.x, p.pos.y);
        
        // Glow effect
        ctx.shadowBlur = 10;
        if (p.type === 'health') {
          ctx.shadowColor = '#22c55e';
          ctx.fillStyle = '#22c55e';
        } else if (p.type === 'armor') {
          ctx.shadowColor = '#3b82f6';
          ctx.fillStyle = '#3b82f6';
        } else if (p.type === 'weapon') {
          ctx.shadowColor = '#fbbf24';
          ctx.fillStyle = '#fbbf24';
        }
        
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Icon indicator
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = p.type === 'health' ? '+' : p.type === 'armor' ? 'A' : 'W';
        ctx.fillText(label, 0, 0);
        
        ctx.restore();
      });

      // Draw bullets
      gameState.bullets.forEach(b => {
        ctx.shadowBlur = 10;
        ctx.shadowColor = b.ownerId === 'player' ? '#fbbf24' : '#ef4444';
        ctx.fillStyle = b.ownerId === 'player' ? '#fbbf24' : '#ef4444';
        ctx.beginPath();
        ctx.arc(b.pos.x, b.pos.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw enemies
      gameState.enemies.forEach(e => {
        ctx.save();
        ctx.translate(e.pos.x, e.pos.y);
        
        // Health bar
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(-15, -25, 30, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-15, -25, (e.health / e.maxHealth) * 30, 4);

        // Body
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Gun
        ctx.rotate(Math.atan2(gameState.player.pos.y - e.pos.y, gameState.player.pos.x - e.pos.x));
        ctx.fillStyle = '#171717';
        ctx.fillRect(10, -3, 18, 6);
        
        ctx.restore();
      });

      // Draw player
      const p = gameState.player;
      ctx.save();
      ctx.translate(p.pos.x, p.pos.y);
      ctx.rotate(p.angle);
      
      // Body
      ctx.fillStyle = '#1e40af';
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Gun
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(12, -4, 22, 8);
      
      ctx.restore();
      
      ctx.restore();
    };

    const loop = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;
      update(dt);
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, showMenu, screenShake]);

  // Event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keys.current.add(e.key.toLowerCase());
    const handleKeyUp = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };
    const handleMouseDown = () => isMouseDown.current = true;
    const handleMouseUp = () => isMouseDown.current = false;
    const handleWheel = (e: WheelEvent) => {
      setGameState(prev => {
        if (!prev) return prev;
        const next = { ...prev };
        const p = next.player;
        if (e.deltaY > 0) {
          p.currentWeaponIndex = (p.currentWeaponIndex + 1) % p.weapons.length;
        } else {
          p.currentWeaponIndex = (p.currentWeaponIndex - 1 + p.weapons.length) % p.weapons.length;
        }
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e3a8a22_0%,transparent_70%)]" />
      </div>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {showMenu ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8 max-w-2xl w-full"
          >
            <div className="space-y-2">
              <h1 className="text-8xl font-black tracking-tighter italic uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 leading-none">
                STRIKE FORCE
              </h1>
              <p className="text-gray-400 text-lg uppercase tracking-widest font-mono">
                Tactical 2D Combat Simulation
              </p>
            </div>

            <div className="flex flex-col gap-4 items-center">
              {menuTab === 'home' ? (
                <>
                  <button 
                    onClick={startGame}
                    className="w-64 py-4 bg-white text-black font-black text-xl uppercase skew-x-[-12deg] hover:bg-blue-500 hover:text-white transition-all duration-300 group"
                  >
                    <span className="inline-block skew-x-[12deg] group-hover:scale-110 transition-transform">
                      Deploy Now
                    </span>
                  </button>
                  <button 
                    onClick={() => setMenuTab('armory')}
                    className="w-64 py-3 border border-white/20 text-white font-bold text-sm uppercase skew-x-[-12deg] hover:bg-blue-500 hover:text-white transition-all duration-300"
                  >
                    <span className="inline-block skew-x-[12deg]">
                      Armory
                    </span>
                  </button>
                  <button 
                    onClick={() => setMenuTab('controls')}
                    className="w-64 py-3 border border-white/20 text-white font-bold text-sm uppercase skew-x-[-12deg] hover:bg-white hover:text-black transition-all duration-300"
                  >
                    <span className="inline-block skew-x-[12deg]">
                      Controls
                    </span>
                  </button>
                </>
              ) : menuTab === 'controls' ? (
                <div className="w-full bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-sm text-left skew-x-[-4deg]">
                  <div className="skew-x-[4deg]">
                    <h2 className="text-2xl font-black italic uppercase mb-6 text-blue-400">Tactical Controls</h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4 font-mono text-sm">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-500">MOVEMENT</span>
                        <span className="text-white">WASD</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-500">AIM / LOOK</span>
                        <span className="text-white">MOUSE</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-500">FIRE WEAPON</span>
                        <span className="text-white">LMB</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-500">RELOAD</span>
                        <span className="text-white">R KEY</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-500">SWITCH WEAPON</span>
                        <span className="text-white">1, 2, 3 / WHEEL</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-500">ADVISOR INTEL</span>
                        <span className="text-white">HUD BUTTON</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setMenuTab('home')}
                      className="mt-8 px-8 py-2 bg-blue-500 text-white font-black text-xs uppercase hover:bg-white hover:text-black transition-all"
                    >
                      Back to Briefing
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full max-h-[60vh] overflow-y-auto bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-sm text-left skew-x-[-2deg]">
                  <div className="skew-x-[2deg]">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-black italic uppercase text-blue-400">Armory</h2>
                      <div className="text-yellow-500 font-mono font-bold">Total SFP: {totalSfp}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.values(ALL_WEAPONS).map(w => {
                        const isUnlocked = unlockedWeaponIds.includes(w.id);
                        const canAfford = totalSfp >= w.unlockCost;
                        return (
                          <div key={w.id} className={`p-4 border ${isUnlocked ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10'} rounded flex justify-between items-center`}>
                            <div>
                              <div className="text-sm font-bold uppercase">{w.name}</div>
                              <div className="text-[10px] text-gray-500 uppercase">{w.type.replace('_', ' ')}</div>
                            </div>
                            {isUnlocked ? (
                              <div className="text-[10px] font-bold text-blue-400 uppercase">Unlocked</div>
                            ) : (
                              <button 
                                onClick={() => unlockWeapon(w.id)}
                                disabled={!canAfford}
                                className={`px-3 py-1 text-[10px] font-bold uppercase rounded ${canAfford ? 'bg-yellow-500 text-black hover:bg-white transition-colors' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                              >
                                {w.unlockCost} SFP
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button 
                      onClick={() => setMenuTab('home')}
                      className="mt-8 px-8 py-2 bg-blue-500 text-white font-black text-xs uppercase hover:bg-white hover:text-black transition-all"
                    >
                      Back to Briefing
                    </button>
                  </div>
                </div>
              )}

              {menuTab === 'home' && (
                <div className="grid grid-cols-2 gap-8 mt-12 text-left font-mono text-xs text-gray-500 uppercase tracking-tighter">
                  <div>
                    <p className="text-white mb-2">Intel</p>
                    <p>Survive waves</p>
                    <p>Consult advisor</p>
                    <p>Collect pickups</p>
                  </div>
                  <div>
                    <p className="text-white mb-2">Status</p>
                    <p>System Stable</p>
                    <p>Link Active</p>
                    <p>V1.0.5-Alpha</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="relative group">
            {/* Canvas Container */}
            <div className="relative border-4 border-white/10 rounded-sm overflow-hidden shadow-2xl shadow-blue-500/10">
              <canvas 
                ref={canvasRef} 
                width={CANVAS_WIDTH} 
                height={CANVAS_HEIGHT}
                className="cursor-crosshair"
              />
              
              {/* HUD Overlay */}
              {gameState && (
                <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      {/* Health */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-green-400 font-black italic text-2xl">
                          <Heart className="w-6 h-6" />
                          <span>{Math.ceil(gameState.player.health)}%</span>
                        </div>
                        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-green-500"
                            animate={{ width: `${gameState.player.health}%` }}
                          />
                        </div>
                      </div>

                      {/* Armor */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-blue-400 font-black italic text-xl">
                          <Shield className="w-5 h-5" />
                          <span>{Math.ceil(gameState.player.armor)}%</span>
                        </div>
                        <div className="w-40 h-1 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-blue-500"
                            animate={{ width: `${gameState.player.armor}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right font-mono">
                      <div className="flex items-center justify-end gap-4 mb-2">
                        <div className="text-yellow-500 font-bold text-xs uppercase tracking-widest">SFP: {gameState.sfp}</div>
                        <button 
                          onClick={quitToMenu}
                          className="pointer-events-auto px-4 py-1 border border-white/20 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                        >
                          Abort Mission
                        </button>
                      </div>
                      <div className="text-4xl font-black text-white italic">SCORE: {gameState.score}</div>
                      <div className="text-gray-500 text-sm">WAVE {gameState.wave} | KILLS {gameState.kills}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="max-w-xs bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-lg pointer-events-auto">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-blue-400" />
                        <span className="text-[10px] uppercase tracking-widest font-bold text-blue-400">Tactical Advisor</span>
                      </div>
                      <p className="text-sm font-medium italic text-gray-200">
                        "{advice}"
                      </p>
                      <button 
                        onClick={requestAdvice}
                        disabled={isAdviceLoading}
                        className="mt-3 w-full py-1 text-[10px] uppercase font-bold border border-white/20 hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                      >
                        {isAdviceLoading ? 'Analyzing...' : 'Request Intel'}
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="mb-2">
                        <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Current Weapon</span>
                        <div className="text-2xl font-black italic text-white uppercase">
                          {gameState.player.weapons[gameState.player.currentWeaponIndex].name}
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-3 text-white font-black italic text-5xl">
                        <Target className="w-8 h-8 text-yellow-500" />
                        <span>{gameState.player.weapons[gameState.player.currentWeaponIndex].ammo}</span>
                        <span className="text-xl text-gray-600">/ {gameState.player.weapons[gameState.player.currentWeaponIndex].maxAmmo}</span>
                      </div>
                      {gameState.player.isReloading && (
                        <motion.div 
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 0.5 }}
                          className="text-yellow-500 font-bold uppercase tracking-tighter text-xs mt-1"
                        >
                          Reloading...
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Game Over Overlay */}
              <AnimatePresence>
                {gameState?.isGameOver && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50"
                  >
                    <h2 className="text-7xl font-black italic text-red-600 mb-4">MIA</h2>
                    <div className="text-center space-y-2 mb-8">
                      <p className="text-gray-400 uppercase tracking-widest">Final Score: {gameState.score}</p>
                      <p className="text-gray-400 uppercase tracking-widest">Kills: {gameState.kills}</p>
                      <p className="text-yellow-500 uppercase tracking-widest font-bold">SFP Earned: {gameState.sfp}</p>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={initGame}
                        className="px-12 py-4 bg-white text-black font-black text-xl uppercase skew-x-[-12deg] hover:bg-red-600 hover:text-white transition-all"
                      >
                        <span className="inline-block skew-x-[12deg]">Redeploy</span>
                      </button>
                      <button 
                        onClick={quitToMenu}
                        className="px-8 py-4 border border-white/20 text-white font-black text-sm uppercase skew-x-[-12deg] hover:bg-white hover:text-black transition-all"
                      >
                        <span className="inline-block skew-x-[12deg]">Menu</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Corner Accents */}
            <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-blue-500" />
            <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-blue-500" />
            <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-blue-500" />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-blue-500" />
          </div>
        )}
      </main>

      {/* Footer Meta */}
      <footer className="fixed bottom-4 left-4 z-20 pointer-events-none">
        <div className="flex items-center gap-4 text-[10px] font-mono text-gray-600 uppercase tracking-widest">
          <span>Ver 1.0.4-Alpha</span>
          <span className="w-1 h-1 bg-gray-800 rounded-full" />
          <span>System Stable</span>
        </div>
      </footer>
    </div>
  );
}
