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
 * @returns 割り込みハンドラー
 */
export function createCriticalHealthPowerUpHandler(
  hpThresholdPercent: number = 25,
  powerMultiplier: number = 1.5
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
      duration: 99, // 長期間有効
      maxDuration: 99,
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
