# Phase 1 Core Engine - Usage Examples

This document demonstrates how to use the Phase 1 Core Engine modules.

## Basic Setup

```typescript
import {
  // Types
  Combatant,
  Skill,
  Stats,
  
  // Configuration
  defaultGameConfig,
  
  // Combat modules
  calculatePhysicalDamage,
  calculateMagicDamage,
  calculateHealAmount,
  calculateTurnOrder,
  calculateHitRate,
  calculateCriticalRate,
  checkPreemptiveStrike,
  
  // Character modules
  calculateFinalStats,
} from 'rpg-core';
```

## Example 1: Basic Physical Combat

```typescript
// Create a hero character
const hero: Combatant = {
  id: 'hero-1',
  name: 'Brave Hero',
  level: 10,
  stats: {
    maxHp: 150,
    maxMp: 60,
    attack: 50,
    defense: 30,
    magic: 35,
    magicDefense: 25,
    speed: 55,
    luck: 15,
    accuracy: 10,
    evasion: 8,
    criticalRate: 0.05,
  },
  currentHp: 150,
  currentMp: 60,
  statusEffects: [],
  position: 0,
};

// Create an enemy
const slime: Combatant = {
  id: 'slime-1',
  name: 'Slime',
  level: 5,
  stats: {
    maxHp: 80,
    maxMp: 0,
    attack: 25,
    defense: 15,
    magic: 10,
    magicDefense: 10,
    speed: 30,
    luck: 5,
    accuracy: 5,
    evasion: 10,
    criticalRate: 0,
  },
  currentHp: 80,
  currentMp: 0,
  statusEffects: [],
  position: 0,
};

// Define a basic attack skill
const basicAttack: Skill = {
  id: 'attack',
  name: 'Attack',
  type: 'physical',
  targetType: 'single-enemy',
  element: 'none',
  power: 1.0,
  mpCost: 0,
  accuracy: 0.95,
  criticalBonus: 0,
  isGuaranteedHit: false,
  description: 'A basic physical attack',
};

// Calculate damage
const damageResult = calculatePhysicalDamage(
  hero,
  slime,
  basicAttack,
  defaultGameConfig
);

console.log(`Attack ${damageResult.isHit ? 'hit' : 'missed'}!`);
if (damageResult.isHit) {
  console.log(`Dealt ${damageResult.finalDamage} damage${damageResult.isCritical ? ' (CRITICAL!)' : ''}`);
  console.log(`Base damage: ${damageResult.baseDamage}`);
  console.log(`Modifiers applied:`, damageResult.appliedModifiers);
}
```

## Example 2: Magic Combat

```typescript
// Create a mage character
const mage: Combatant = {
  id: 'mage-1',
  name: 'Wise Mage',
  level: 10,
  stats: {
    maxHp: 100,
    maxMp: 120,
    attack: 20,
    defense: 20,
    magic: 70,
    magicDefense: 40,
    speed: 45,
    luck: 12,
    accuracy: 15,
    evasion: 5,
    criticalRate: 0.08,
  },
  currentHp: 100,
  currentMp: 120,
  statusEffects: [],
  position: 1,
};

// Define a fire spell
const fireball: Skill = {
  id: 'fireball',
  name: 'Fireball',
  type: 'magic',
  targetType: 'single-enemy',
  element: 'fire',
  power: 1.5,
  mpCost: 15,
  accuracy: 1.0,
  criticalBonus: 0.05,
  isGuaranteedHit: false,
  description: 'A powerful fire spell',
};

// Calculate magic damage
const magicDamageResult = calculateMagicDamage(
  mage,
  slime,
  fireball,
  defaultGameConfig
);

console.log(`Fireball dealt ${magicDamageResult.finalDamage} damage!`);
```

## Example 3: Healing

```typescript
// Define a heal spell
const heal: Skill = {
  id: 'heal',
  name: 'Heal',
  type: 'heal',
  targetType: 'single-ally',
  element: 'none',
  power: 1.0,
  mpCost: 10,
  accuracy: 1.0,
  criticalBonus: 0,
  isGuaranteedHit: true,
  description: 'Restore HP to an ally',
};

// Calculate heal amount
const healAmount = calculateHealAmount(
  mage,
  hero,
  heal,
  defaultGameConfig
);

console.log(`Healed for ${healAmount} HP!`);
```

## Example 4: Turn Order Calculation

```typescript
// Create a party and enemies
const party = [hero, mage];
const enemies = [slime, 
  {
    ...slime,
    id: 'slime-2',
    name: 'Slime 2',
  }
];

// Combine all combatants
const allCombatants = [...party, ...enemies];

// Calculate turn order
const turnOrder = calculateTurnOrder(allCombatants, defaultGameConfig);

console.log('Turn order:');
turnOrder.forEach((combatant, index) => {
  console.log(`${index + 1}. ${combatant.name} (Speed: ${combatant.stats.speed})`);
});

// Check for preemptive strike
const hasPreemptiveStrike = checkPreemptiveStrike(
  party,
  enemies,
  defaultGameConfig
);

if (hasPreemptiveStrike) {
  console.log('Party gets a preemptive strike!');
}
```

## Example 5: Stat Calculation with Modifiers

```typescript
// Base stats
const baseStats: Stats = {
  maxHp: 100,
  maxMp: 50,
  attack: 40,
  defense: 25,
  magic: 30,
  magicDefense: 20,
  speed: 50,
  luck: 10,
  accuracy: 8,
  evasion: 5,
  criticalRate: 0.05,
};

// Equipment modifiers
const swordBonus: Partial<Stats> = {
  attack: 15,
  accuracy: 3,
};

const armorBonus: Partial<Stats> = {
  defense: 10,
  maxHp: 20,
};

// Job/class modifiers
const warriorBonus: Partial<Stats> = {
  attack: 5,
  defense: 5,
  maxHp: 30,
};

// Calculate final stats with all modifiers
const finalStats = calculateFinalStats(
  baseStats,
  [swordBonus, armorBonus, warriorBonus]
);

console.log('Final Stats:');
console.log(`HP: ${finalStats.maxHp} (base: ${baseStats.maxHp})`);
console.log(`Attack: ${finalStats.attack} (base: ${baseStats.attack})`);
console.log(`Defense: ${finalStats.defense} (base: ${baseStats.defense})`);
```

## Example 6: Combat Probabilities

```typescript
// Calculate hit rate
const hitRate = calculateHitRate(hero, slime, basicAttack);
console.log(`Hit chance: ${(hitRate * 100).toFixed(1)}%`);

// Calculate critical rate
const critRate = calculateCriticalRate(hero, basicAttack, defaultGameConfig);
console.log(`Critical chance: ${(critRate * 100).toFixed(1)}%`);
```

## Example 7: Custom Game Configuration

```typescript
import { GameConfig } from 'rpg-core';

// Create a custom configuration
const hardcoreConfig: GameConfig = {
  combat: {
    baseCriticalRate: 0.02,      // Lower crit rate (2% instead of 5%)
    criticalMultiplier: 3.0,     // Higher crit damage (3x instead of 2x)
    damageVariance: 0.15,        // More variance (±15%)
    escapeBaseRate: 0.3,         // Harder to escape (30% instead of 50%)
    escapeRateIncrement: 0.05,   // Slower escape rate increase
    preemptiveStrikeThreshold: 75, // Harder to get preemptive strike
    speedVariance: 0.15,         // More turn order variance
  },
  growth: {
    expCurve: 'exponential',
    baseExpRequired: 150,        // More exp needed
    expGrowthRate: 1.3,          // Steeper curve
    statGrowthRates: {
      maxHp: 8,                  // Slower HP growth
      maxMp: 4,
      attack: 2,
      defense: 2,
      magic: 2,
      magicDefense: 2,
      speed: 2,
      luck: 1,
    },
    maxLevel: 99,
  },
  balance: {
    maxPartySize: 3,             // Smaller party size
    dropRateModifier: 0.75,      // Lower drop rates
  },
};

// Use custom configuration
const hardcoreDamage = calculatePhysicalDamage(
  hero,
  slime,
  basicAttack,
  hardcoreConfig
);
```

## Running the Examples

To run these examples:

1. Install the package:
```bash
npm install rpg-core
```

2. Create a TypeScript file with the examples above

3. Run with ts-node:
```bash
npx ts-node examples.ts
```

## Next Steps

Phase 1 provides the foundation for combat calculations. Future phases will add:
- Experience and leveling system
- Item and equipment management
- Status effects and buffs/debuffs
- Enemy AI decision making
- And more!
