/**
 * 行動順計算モジュール
 */

import { Combatant, GameConfig } from '../../types';

/**
 * 戦闘者の行動順を計算
 * @param participants - 戦闘者の配列
 * @param config - ゲーム設定
 * @returns 行動順でソートされた戦闘者の配列（最速が先頭）
 */
export function calculateTurnOrder(
  participants: Combatant[],
  config: GameConfig
): Combatant[] {
  if (participants.length === 0) {
    return [];
  }

  // 計算された速度値を持つコピーを作成
  const participantsWithSpeed = participants.map(combatant => {
    // 速度分散を適用：基礎速度 ± （分散 × 基礎速度）
    const baseSpeed = combatant.stats.speed;
    const variance = 1.0 + (Math.random() * 2 - 1) * config.combat.speedVariance;
    const effectiveSpeed = baseSpeed * variance;

    return {
      combatant,
      effectiveSpeed,
    };
  });

  // 実効速度でソート（降順 - 最高値が先頭）
  participantsWithSpeed.sort((a, b) => b.effectiveSpeed - a.effectiveSpeed);

  // ソートされた戦闘者を返す
  return participantsWithSpeed.map(p => p.combatant);
}

/**
 * 先制攻撃を判定
 * @param party - パーティメンバー
 * @param enemies - 敵戦闘者
 * @param config - ゲーム設定
 * @returns パーティが先制攻撃を取得する場合true
 */
export function checkPreemptiveStrike(
  party: Combatant[],
  enemies: Combatant[],
  config: GameConfig
): boolean {
  // エッジケースを処理
  if (party.length === 0 || enemies.length === 0) {
    return false;
  }

  // パーティの平均速度を計算
  const partyAvgSpeed = party.reduce((sum, member) => sum + member.stats.speed, 0) / party.length;

  // 敵の平均速度を計算
  const enemyAvgSpeed = enemies.reduce((sum, enemy) => sum + enemy.stats.speed, 0) / enemies.length;

  // 速度差を計算
  const speedDifference = partyAvgSpeed - enemyAvgSpeed;

  // 速度差が閾値を満たすか確認
  // パーティが十分に速い場合、先制攻撃が発生
  return speedDifference >= config.combat.preemptiveStrikeThreshold;
}
