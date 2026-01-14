/**
 * SimulationService - 戦闘シミュレーションサービス
 * 大量の戦闘シミュレーションを実行し、統計データを収集
 */

import type { 
  SimulationConfig, 
  SimulationResult,
  BattleSimulationResult 
} from '../../types/system/simulation';
import type { Combatant } from '../../types/battle/combatant';
import { filterAlive } from '../../core/combat/combatantState';
import { MAX_SIMULATION_TURNS } from '../../core/combat/constants';

/**
 * SimulationService
 * 戦闘のシミュレーションを実行し、統計データを収集するサービス
 * 主にバランス調整やテスト用途で使用
 * 
 * @example
 * const service = new SimulationService();
 * const result = service.simulate({
 *   iterations: 1000,
 *   party1: [hero1, hero2],
 *   party2: [enemy1, enemy2]
 * });
 * console.log(`Party 1 win rate: ${result.party1Wins / result.totalBattles * 100}%`);
 */
export class SimulationService {
  /**
   * シミュレーションを実行する
   * 
   * @param config - シミュレーション設定
   * @returns シミュレーション結果
   */
  simulate(config: SimulationConfig): SimulationResult {
    const results: BattleSimulationResult[] = [];

    // 指定回数だけ戦闘をシミュレート
    for (let i = 0; i < config.iterations; i++) {
      const battleResult = this.simulateSingleBattle(
        config.party1,
        config.party2
      );
      results.push(battleResult);
    }

    // 統計データを集計
    return this.aggregateResults(results);
  }

  /**
   * 単一の戦闘をシミュレートする
   * 
   * @param party1 - パーティ1
   * @param party2 - パーティ2
   * @returns 戦闘結果
   */
  private simulateSingleBattle(
    party1: Combatant[],
    party2: Combatant[]
  ): BattleSimulationResult {
    // パーティのディープコピーを作成（元のデータを変更しないため）
    const party1Copy = this.deepCopyParty(party1);
    const party2Copy = this.deepCopyParty(party2);

    let turns = 0;
    let party1Damage = 0;
    let party2Damage = 0;

    // 戦闘が終了するまでターンを進める
    while (turns < MAX_SIMULATION_TURNS) {
      // 両パーティの生存確認
      const party1Alive = filterAlive(party1Copy);
      const party2Alive = filterAlive(party2Copy);
      
      if (party1Alive.length === 0 || party2Alive.length === 0) {
        break;
      }

      // 簡易的な戦闘シミュレーション（ランダムに攻撃）
      // Party1のターン
      for (const attacker of party1Alive) {
        if (party2Alive.length === 0) break;
        const target = party2Alive[Math.floor(Math.random() * party2Alive.length)];
        const damage = Math.max(0, attacker.stats.attack - target.stats.defense);
        target.currentHp = Math.max(0, target.currentHp - damage);
        party1Damage += damage;
      }

      // Party2のターン
      const party2StillAlive = filterAlive(party2Copy);
      for (const attacker of party2StillAlive) {
        const party1StillAlive = filterAlive(party1Copy);
        if (party1StillAlive.length === 0) break;
        const target = party1StillAlive[Math.floor(Math.random() * party1StillAlive.length)];
        const damage = Math.max(0, attacker.stats.attack - target.stats.defense);
        target.currentHp = Math.max(0, target.currentHp - damage);
        party2Damage += damage;
      }
      
      turns++;
    }

    // 勝者を判定
    const party1Alive = party1Copy.some((c: Combatant) => c.currentHp > 0);
    const party2Alive = party2Copy.some((c: Combatant) => c.currentHp > 0);
    
    let winner: 'party1' | 'party2' | 'draw';
    if (party1Alive && !party2Alive) {
      winner = 'party1';
    } else if (!party1Alive && party2Alive) {
      winner = 'party2';
    } else {
      winner = 'draw';
    }

    return {
      winner,
      turns,
      damageDealt: {
        party1: party1Damage,
        party2: party2Damage
      }
    };
  }

  /**
   * パーティのディープコピーを作成
   */
  private deepCopyParty(party: Combatant[]): Combatant[] {
    return party.map((combatant: Combatant) => ({
      ...combatant,
      stats: { ...combatant.stats },
      statusEffects: [...combatant.statusEffects]
    }));
  }

  /**
   * シミュレーション結果を集計する
   * 
   * @param results - 各戦闘の結果
   * @returns 集計されたシミュレーション結果
   */
  private aggregateResults(results: BattleSimulationResult[]): SimulationResult {
    const party1Wins = results.filter(r => r.winner === 'party1').length;
    const party2Wins = results.filter(r => r.winner === 'party2').length;
    const draws = results.filter(r => r.winner === 'draw').length;

    const totalTurns = results.reduce((sum, r) => sum + r.turns, 0);
    const averageTurns = totalTurns / results.length;

    const totalParty1Damage = results.reduce((sum, r) => sum + r.damageDealt.party1, 0);
    const totalParty2Damage = results.reduce((sum, r) => sum + r.damageDealt.party2, 0);

    // ターン数の分布を計算
    const turnDistribution = new Map<number, number>();
    for (const result of results) {
      const count = turnDistribution.get(result.turns) || 0;
      turnDistribution.set(result.turns, count + 1);
    }

    // ターン別勝利数を計算
    const winsByTurn = new Map<number, { party1: number; party2: number }>();
    for (const result of results) {
      const wins = winsByTurn.get(result.turns) || { party1: 0, party2: 0 };
      if (result.winner === 'party1') {
        wins.party1++;
      } else if (result.winner === 'party2') {
        wins.party2++;
      }
      winsByTurn.set(result.turns, wins);
    }

    return {
      totalBattles: results.length,
      party1Wins,
      party2Wins,
      draws,
      averageTurns,
      averageDamage: {
        party1: totalParty1Damage / results.length,
        party2: totalParty2Damage / results.length
      },
      turnDistribution,
      winsByTurn
    };
  }

  /**
   * シミュレーション結果をレポート形式で出力
   * 
   * @param result - シミュレーション結果
   * @returns フォーマットされたレポート文字列
   */
  generateReport(result: SimulationResult): string {
    const party1WinRate = (result.party1Wins / result.totalBattles * 100).toFixed(2);
    const party2WinRate = (result.party2Wins / result.totalBattles * 100).toFixed(2);
    const drawRate = (result.draws / result.totalBattles * 100).toFixed(2);

    let report = '=== Simulation Report ===\n';
    report += `Total Battles: ${result.totalBattles}\n\n`;
    report += `Party 1 Wins: ${result.party1Wins} (${party1WinRate}%)\n`;
    report += `Party 2 Wins: ${result.party2Wins} (${party2WinRate}%)\n`;
    report += `Draws: ${result.draws} (${drawRate}%)\n\n`;
    report += `Average Turns: ${result.averageTurns.toFixed(2)}\n`;
    report += `Average Damage (Party 1): ${result.averageDamage.party1.toFixed(2)}\n`;
    report += `Average Damage (Party 2): ${result.averageDamage.party2.toFixed(2)}\n`;

    return report;
  }
}
