/**
 * 共通割り込みハンドラー
 * よく使われる割り込みパターンの実装
 */

import { InterruptHandler, InterruptResult, InterruptContext } from '../../types/core/interrupt';
import { hasStatusEffect, findEffectByType } from '../status/effects';

/**
 * 睡眠状態ダメージ解除ハンドラー
 * 一定割合以上のダメージを受けると睡眠状態が解除される
 * 
 * @param damageThresholdPercent - ダメージ閾値（最大HPの割合、デフォルト: 20%）
 * @returns 割り込みハンドラー
 * 
 * @example
 * ```typescript
 * manager.registerCommon({
 *   id: 'sleep-cancel-on-damage',
 *   name: 'Sleep Cancellation on Damage',
 *   priority: 100,
 *   handler: createSleepCancelOnDamageHandler(20),
 *   enabled: true
 * });
 * ```
 */
export function createSleepCancelOnDamageHandler(
  damageThresholdPercent: number = 20
): InterruptHandler {
  return (context: InterruptContext): InterruptResult => {
    const { target, result } = context;

    // ダメージが発生していない場合は何もしない
    if (!result.damage || result.damage <= 0) {
      return { executed: false };
    }

    // 睡眠状態でない場合は何もしない
    if (!hasStatusEffect(target, 'sleep')) {
      return { executed: false };
    }

    // ダメージ閾値をチェック
    const damagePercent = (result.damage / target.stats.maxHp) * 100;
    if (damagePercent < damageThresholdPercent) {
      return { executed: false };
    }

    // 睡眠状態を解除
    const sleepEffect = findEffectByType(target, 'sleep');
    if (sleepEffect) {
      target.statusEffects = target.statusEffects.filter(
        effect => effect.id !== sleepEffect.id
      );

      return {
        executed: true,
        stateChanged: true,
        message: `${target.name} woke up from the damage!`,
        customData: {
          removedEffect: 'sleep',
          damagePercent
        }
      };
    }

    return { executed: false };
  };
}

/**
 * 混乱状態ダメージ解除ハンドラー
 * 一定割合以上のダメージを受けると混乱状態が解除される
 * 
 * @param damageThresholdPercent - ダメージ閾値（最大HPの割合、デフォルト: 25%）
 * @returns 割り込みハンドラー
 */
export function createConfusionCancelOnDamageHandler(
  damageThresholdPercent: number = 25
): InterruptHandler {
  return (context: InterruptContext): InterruptResult => {
    const { target, result } = context;

    if (!result.damage || result.damage <= 0) {
      return { executed: false };
    }

    if (!hasStatusEffect(target, 'confusion')) {
      return { executed: false };
    }

    const damagePercent = (result.damage / target.stats.maxHp) * 100;
    if (damagePercent < damageThresholdPercent) {
      return { executed: false };
    }

    const confusionEffect = findEffectByType(target, 'confusion');
    if (confusionEffect) {
      target.statusEffects = target.statusEffects.filter(
        effect => effect.id !== confusionEffect.id
      );

      return {
        executed: true,
        stateChanged: true,
        message: `${target.name} snapped out of confusion!`,
        customData: {
          removedEffect: 'confusion',
          damagePercent
        }
      };
    }

    return { executed: false };
  };
}

/**
 * カウンター攻撃ハンドラー
 * 物理攻撃を受けた時に一定確率で反撃する
 * 
 * @param counterRate - カウンター発動率（0.0～1.0）
 * @param damageMultiplier - カウンターダメージ倍率
 * @returns 割り込みハンドラー
 * 
 * @example
 * ```typescript
 * // キャラクター専用のカウンター攻撃
 * manager.registerCharacter('warrior1', {
 *   id: 'warrior-counter',
 *   name: 'Warrior Counter',
 *   priority: 50,
 *   handler: createCounterAttackHandler(0.3, 0.5),
 *   enabled: true
 * });
 * ```
 */
export function createCounterAttackHandler(
  counterRate: number = 0.2,
  damageMultiplier: number = 0.5
): InterruptHandler {
  return (context: InterruptContext): InterruptResult => {
    const { actor, target, result, skill } = context;

    // ダメージが発生していない、またはミスした場合は何もしない
    if (!result.damage || result.damage <= 0 || result.missed) {
      return { executed: false };
    }

    // 物理攻撃のみカウンター対象
    if (skill && skill.type !== 'physical') {
      return { executed: false };
    }

    // カウンター発動判定
    if (Math.random() >= counterRate) {
      return { executed: false };
    }

    // 対象が戦闘不能の場合はカウンターしない
    if (target.currentHp <= 0) {
      return { executed: false };
    }

    // カウンターダメージを計算
    const counterDamage = Math.floor(target.stats.attack * damageMultiplier);
    actor.currentHp = Math.max(0, actor.currentHp - counterDamage);

    return {
      executed: true,
      stateChanged: true,
      message: `${target.name} countered for ${counterDamage} damage!`,
      customData: {
        counterDamage,
        counterRate
      }
    };
  };
}

/**
 * HP吸収ハンドラー
 * ダメージを与えた時に一定割合のHPを吸収する
 * 
 * @param drainRate - 吸収率（0.0～1.0）
 * @returns 割り込みハンドラー
 * 
 * @example
 * ```typescript
 * // 吸血鬼の特殊能力
 * manager.registerEnemy('vampire', {
 *   id: 'vampire-drain',
 *   name: 'Vampire Drain',
 *   priority: 80,
 *   handler: createHPDrainHandler(0.5),
 *   enabled: true
 * });
 * ```
 */
export function createHPDrainHandler(drainRate: number = 0.3): InterruptHandler {
  return (context: InterruptContext): InterruptResult => {
    const { actor, result } = context;

    // ダメージが発生していない、またはミスした場合は何もしない
    if (!result.damage || result.damage <= 0 || result.missed) {
      return { executed: false };
    }

    // 吸収量を計算
    const drainAmount = Math.floor(result.damage * drainRate);
    
    // 最大HPを超えないように回復
    const previousHp = actor.currentHp;
    actor.currentHp = Math.min(actor.stats.maxHp, actor.currentHp + drainAmount);
    const actualDrain = actor.currentHp - previousHp;

    if (actualDrain > 0) {
      return {
        executed: true,
        stateChanged: true,
        message: `${actor.name} drained ${actualDrain} HP!`,
        customData: {
          drainAmount: actualDrain,
          drainRate
        }
      };
    }

    return { executed: false };
  };
}

/**
 * 瀕死時パワーアップハンドラー
 * HPが一定割合以下の時に攻撃力がアップする状態異常を付与
 * 
 * @param hpThresholdPercent - HP閾値（%）
 * @param powerMultiplier - 攻撃力倍率
 * @param duration - 効果の持続ターン数（デフォルト: 99、実質永続）
 * @returns 割り込みハンドラー
 */
export function createCriticalHealthPowerUpHandler(
  hpThresholdPercent: number = 25,
  powerMultiplier: number = 1.5,
  duration: number = 99
): InterruptHandler {
  return (context: InterruptContext): InterruptResult => {
    const { target } = context;

    // HP割合をチェック
    const hpPercent = (target.currentHp / target.stats.maxHp) * 100;
    
    // 閾値以上の場合は何もしない
    if (hpPercent >= hpThresholdPercent) {
      return { executed: false };
    }

    // 既に攻撃力アップ状態の場合は何もしない
    const hasAttackUp = target.statusEffects.some(
      effect => effect.type === 'attack-up' && effect.source === 'critical-health'
    );
    if (hasAttackUp) {
      return { executed: false };
    }

    // 攻撃力アップの状態異常を付与
    target.statusEffects.push({
      id: `critical-health-power-${target.id}-${Date.now()}`,
      type: 'attack-up',
      category: 'buff',
      name: 'Critical Power',
      description: 'Increased power when HP is low',
      power: powerMultiplier,
      duration,
      maxDuration: duration,
      stackCount: 1,
      maxStack: 1,
      canBeDispelled: false,
      appliedAt: Date.now(),
      source: 'critical-health'
    });

    return {
      executed: true,
      stateChanged: true,
      message: `${target.name}'s power increased due to critical health!`,
      customData: {
        hpPercent,
        powerMultiplier
      }
    };
  };
}

/**
 * 棘の鎧ハンドラー（Thorns/反射ダメージ）
 * 攻撃を受けた時に攻撃者にダメージを返す（装備効果）
 * 
 * @param reflectRate - 反射するダメージの割合（0.0～1.0）
 * @returns 割り込みハンドラー
 * 
 * @example
 * ```typescript
 * // 鎧「棘の鎧」装備時
 * manager.registerCharacter('warrior1', {
 *   id: 'thorns-armor',
 *   name: 'Thorns Armor',
 *   priority: 60,
 *   handler: createThornsArmorHandler(0.3), // 30%のダメージを反射
 *   enabled: true
 * });
 * ```
 */
export function createThornsArmorHandler(reflectRate: number = 0.2): InterruptHandler {
  return (context: InterruptContext): InterruptResult => {
    const { actor, target, result } = context;

    // ダメージが発生していない、またはミスした場合は何もしない
    if (!result.damage || result.damage <= 0 || result.missed) {
      return { executed: false };
    }

    // 反射ダメージを計算
    const reflectDamage = Math.floor(result.damage * reflectRate);
    
    if (reflectDamage > 0) {
      actor.currentHp = Math.max(0, actor.currentHp - reflectDamage);

      return {
        executed: true,
        stateChanged: true,
        message: `${target.name}'s armor reflected ${reflectDamage} damage!`,
        customData: {
          reflectDamage,
          reflectRate
        }
      };
    }

    return { executed: false };
  };
}

/**
 * 状態異常付与武器ハンドラー
 * 攻撃が命中した時に一定確率で状態異常を付与する（武器効果）
 * 
 * @param statusEffectType - 付与する状態異常タイプ
 * @param inflictRate - 付与確率（0.0～1.0）
 * @param duration - 状態異常の持続ターン数
 * @param power - 状態異常の強さ
 * @returns 割り込みハンドラー
 * 
 * @example
 * ```typescript
 * // 武器「毒の短剣」装備時
 * manager.registerCharacter('rogue1', {
 *   id: 'poison-dagger',
 *   name: 'Poison Dagger',
 *   priority: 70,
 *   handler: createStatusInflictWeaponHandler('poison', 0.3, 3, 5),
 *   enabled: true
 * });
 * ```
 */
export function createStatusInflictWeaponHandler(
  statusEffectType: string,
  inflictRate: number = 0.25,
  duration: number = 3,
  power: number = 5
): InterruptHandler {
  return (context: InterruptContext): InterruptResult => {
    const { actor, target, result } = context;

    // ダメージが発生していない、またはミスした場合は何もしない
    if (!result.damage || result.damage <= 0 || result.missed) {
      return { executed: false };
    }

    // 既に同じ状態異常を持っている場合はスキップ
    if (target.statusEffects.some(e => e.type === statusEffectType)) {
      return { executed: false };
    }

    // 状態異常付与判定
    if (Math.random() >= inflictRate) {
      return { executed: false };
    }

    // 状態異常を付与
    const categoryMap: Record<string, string> = {
      poison: 'dot',
      burn: 'dot',
      paralysis: 'disable',
      sleep: 'disable',
      confusion: 'disable',
      blind: 'debuff',
      silence: 'disable'
    };

    target.statusEffects.push({
      id: `${statusEffectType}-${target.id}-${Date.now()}`,
      type: statusEffectType as any,
      category: (categoryMap[statusEffectType] || 'debuff') as any,
      name: statusEffectType,
      description: `Inflicted by weapon`,
      power,
      duration,
      maxDuration: duration,
      stackCount: 1,
      maxStack: 3,
      canBeDispelled: true,
      appliedAt: Date.now(),
      source: actor.id
    });

    return {
      executed: true,
      stateChanged: true,
      message: `${actor.name}'s weapon inflicted ${statusEffectType}!`,
      customData: {
        statusEffectType,
        inflictRate
      }
    };
  };
}

/**
 * 自動蘇生アクセサリーハンドラー
 * HPが0になった時に自動的に一度だけ復活する（アクセサリー効果）
 * 
 * @param reviveHpPercent - 復活時のHP割合（0.0～1.0）
 * @returns 割り込みハンドラー
 * 
 * @example
 * ```typescript
 * // アクセサリー「不死鳥の羽」装備時
 * manager.registerCharacter('mage1', {
 *   id: 'phoenix-feather',
 *   name: 'Phoenix Feather',
 *   priority: 200, // 高優先度で他の処理より先に実行
 *   handler: createAutoReviveHandler(0.3), // 最大HPの30%で復活
 *   enabled: true
 * });
 * ```
 */
export function createAutoReviveHandler(reviveHpPercent: number = 0.25): InterruptHandler {
  return (context: InterruptContext): InterruptResult => {
    const { target, result } = context;

    // ダメージが発生していない場合は何もしない
    if (!result.damage || result.damage <= 0) {
      return { executed: false };
    }

    // HPが0になっていない場合は何もしない
    if (target.currentHp > 0) {
      return { executed: false };
    }

    // 既に自動蘇生フラグがある場合は何もしない（1回のみ発動）
    const alreadyRevived = target.statusEffects.some(
      e => e.source === 'auto-revive-used'
    );
    if (alreadyRevived) {
      return { executed: false };
    }

    // 復活処理
    const reviveHp = Math.floor(target.stats.maxHp * reviveHpPercent);
    target.currentHp = reviveHp;

    // 使用済みフラグを立てる（状態異常として記録）
    target.statusEffects.push({
      id: `auto-revive-used-${target.id}`,
      type: 'attack-down' as any, // ダミーの状態異常タイプ
      category: 'buff' as any,
      name: 'Auto-Revive Used',
      description: 'Auto-revive has been used',
      power: 1,
      duration: 999,
      maxDuration: 999,
      stackCount: 1,
      maxStack: 1,
      canBeDispelled: false,
      appliedAt: Date.now(),
      source: 'auto-revive-used'
    });

    return {
      executed: true,
      stateChanged: true,
      message: `${target.name} was revived by Phoenix Feather!`,
      customData: {
        revivedHp: reviveHp,
        reviveHpPercent
      }
    };
  };
}

/**
 * ライフスティール武器ハンドラー
 * 攻撃時にダメージの一定割合のHPを吸収する（武器効果）
 * createHPDrainHandlerの武器特化版
 * 
 * @param drainRate - 吸収率（0.0～1.0）
 * @param onlyPhysical - 物理攻撃のみ有効にするか
 * @returns 割り込みハンドラー
 * 
 * @example
 * ```typescript
 * // 武器「吸血剣」装備時
 * manager.registerCharacter('knight1', {
 *   id: 'vampire-sword',
 *   name: 'Vampire Sword',
 *   priority: 85,
 *   handler: createLifestealWeaponHandler(0.2, true), // 物理攻撃の20%を吸収
 *   enabled: true
 * });
 * ```
 */
export function createLifestealWeaponHandler(
  drainRate: number = 0.15,
  onlyPhysical: boolean = false
): InterruptHandler {
  return (context: InterruptContext): InterruptResult => {
    const { actor, result, skill } = context;

    // ダメージが発生していない、またはミスした場合は何もしない
    if (!result.damage || result.damage <= 0 || result.missed) {
      return { executed: false };
    }

    // 物理攻撃のみ有効な場合のチェック
    if (onlyPhysical && skill && skill.type !== 'physical') {
      return { executed: false };
    }

    // 吸収量を計算
    const drainAmount = Math.floor(result.damage * drainRate);
    
    // 最大HPを超えないように回復
    const previousHp = actor.currentHp;
    actor.currentHp = Math.min(actor.stats.maxHp, actor.currentHp + drainAmount);
    const actualDrain = actor.currentHp - previousHp;

    if (actualDrain > 0) {
      return {
        executed: true,
        stateChanged: true,
        message: `${actor.name}'s weapon drained ${actualDrain} HP!`,
        customData: {
          drainAmount: actualDrain,
          drainRate
        }
      };
    }

    return { executed: false };
  };
}

/**
 * クリティカルダメージ増加武器ハンドラー
 * クリティカルヒット時に追加ダメージを与える（武器効果）
 * 
 * @param bonusDamageMultiplier - 追加ダメージ倍率
 * @returns 割り込みハンドラー
 * 
 * @example
 * ```typescript
 * // 武器「会心の剣」装備時
 * manager.registerCharacter('warrior1', {
 *   id: 'critical-sword',
 *   name: 'Critical Sword',
 *   priority: 90,
 *   handler: createCriticalBonusWeaponHandler(0.5), // クリティカル時に50%追加ダメージ
 *   enabled: true
 * });
 * ```
 */
export function createCriticalBonusWeaponHandler(
  bonusDamageMultiplier: number = 0.5
): InterruptHandler {
  return (context: InterruptContext): InterruptResult => {
    const { target, result } = context;

    // クリティカルでない場合は何もしない
    if (!result.critical) {
      return { executed: false };
    }

    // ダメージがない場合は何もしない
    if (!result.damage || result.damage <= 0) {
      return { executed: false };
    }

    // 追加ダメージを計算
    const bonusDamage = Math.floor(result.damage * bonusDamageMultiplier);
    
    if (bonusDamage > 0) {
      target.currentHp = Math.max(0, target.currentHp - bonusDamage);

      return {
        executed: true,
        stateChanged: true,
        message: `Critical bonus damage: ${bonusDamage}!`,
        customData: {
          bonusDamage,
          bonusDamageMultiplier
        }
      };
    }

    return { executed: false };
  };
}
