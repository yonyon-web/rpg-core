/**
 * InterruptManager - アクション結果割り込み管理システム
 * 
 * 攻撃などのアクション結果に割り込んで追加処理を実行する仕組みを提供
 * 共通ルール、敵個別、キャラクター/ジョブ個別の割り込みを管理
 * 
 * @example
 * ```typescript
 * const manager = new InterruptManager();
 * 
 * // 共通ルール：睡眠状態がダメージで解除される
 * manager.registerCommon({
 *   id: 'sleep-cancel-on-damage',
 *   name: 'Sleep Cancellation',
 *   priority: 100,
 *   handler: async (context) => {
 *     // 処理...
 *     return { executed: true };
 *   },
 *   enabled: true
 * });
 * 
 * // 割り込みを実行
 * const results = await manager.executeInterrupts(context);
 * ```
 */

import {
  InterruptContext,
  InterruptResult,
  InterruptDefinition,
  InterruptRegistration,
  InterruptType,
  ConditionalInterruptDefinition
} from '../../types/core/interrupt';

/**
 * InterruptManagerクラス
 */
export class InterruptManager {
  /** 登録された割り込みリスト */
  private interrupts: InterruptRegistration[] = [];

  /**
   * 共通ルール割り込みを登録
   * 全キャラクター・全敵に適用される
   * 
   * @param definition - 割り込み定義
   */
  registerCommon(definition: InterruptDefinition): void {
    this.interrupts.push({
      type: 'common',
      definition
    });
  }

  /**
   * 敵個別の割り込みを登録
   * 
   * @param enemyType - 敵タイプID
   * @param definition - 割り込み定義
   */
  registerEnemy(enemyType: string, definition: InterruptDefinition): void {
    this.interrupts.push({
      type: 'enemy',
      targetId: enemyType,
      definition
    });
  }

  /**
   * キャラクター個別の割り込みを登録
   * 
   * @param characterId - キャラクターID
   * @param definition - 割り込み定義
   */
  registerCharacter(characterId: string, definition: InterruptDefinition): void {
    this.interrupts.push({
      type: 'character',
      targetId: characterId,
      definition
    });
  }

  /**
   * ジョブ別の割り込みを登録
   * 
   * @param jobName - ジョブ名
   * @param definition - 割り込み定義
   */
  registerJob(jobName: string, definition: InterruptDefinition): void {
    this.interrupts.push({
      type: 'job',
      targetId: jobName,
      definition
    });
  }

  /**
   * 割り込みを削除
   * 
   * @param interruptId - 割り込みID
   * @returns 削除された場合true
   */
  unregister(interruptId: string): boolean {
    const initialLength = this.interrupts.length;
    this.interrupts = this.interrupts.filter(
      int => int.definition.id !== interruptId
    );
    return this.interrupts.length < initialLength;
  }

  /**
   * 割り込みを有効/無効化
   * 
   * @param interruptId - 割り込みID
   * @param enabled - 有効フラグ
   * @returns 見つかった場合true
   */
  setEnabled(interruptId: string, enabled: boolean): boolean {
    const interrupt = this.interrupts.find(
      int => int.definition.id === interruptId
    );
    if (interrupt) {
      interrupt.definition.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * コンテキストに適用可能な割り込みを取得
   * 優先度順にソート済み
   * 
   * @param context - 割り込みコンテキスト
   * @returns 適用可能な割り込み定義の配列
   */
  private getApplicableInterrupts(context: InterruptContext): InterruptDefinition[] {
    const applicable: InterruptDefinition[] = [];

    for (const registration of this.interrupts) {
      // 無効な割り込みはスキップ
      if (!registration.definition.enabled) {
        continue;
      }

      // 割り込みタイプに応じて適用判定
      let isApplicable = false;

      switch (registration.type) {
        case 'common':
          // 共通ルールは常に適用
          isApplicable = true;
          break;

        case 'enemy':
          // 対象が敵で、敵タイプが一致する場合
          if ('enemyType' in context.target && 
              context.target.enemyType === registration.targetId) {
            isApplicable = true;
          }
          break;

        case 'character':
          // 対象がキャラクターで、IDが一致する場合
          if (context.target.id === registration.targetId) {
            isApplicable = true;
          }
          break;

        case 'job':
          // 対象がキャラクターで、ジョブが一致する場合
          if ('job' in context.target && 
              context.target.job === registration.targetId) {
            isApplicable = true;
          }
          break;
      }

      // 条件付き割り込みの場合、条件をチェック
      if (isApplicable && 'condition' in registration.definition) {
        const conditional = registration.definition as ConditionalInterruptDefinition;
        isApplicable = conditional.condition(context);
      }

      if (isApplicable) {
        applicable.push(registration.definition);
      }
    }

    // 優先度順にソート（降順）
    return applicable.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 割り込みを実行
   * 優先度順に全ての適用可能な割り込みを実行
   * 
   * @param context - 割り込みコンテキスト
   * @returns 実行された割り込み結果の配列
   */
  async executeInterrupts(context: InterruptContext): Promise<InterruptResult[]> {
    const applicableInterrupts = this.getApplicableInterrupts(context);
    const results: InterruptResult[] = [];

    for (const interruptDef of applicableInterrupts) {
      try {
        const result = await Promise.resolve(interruptDef.handler(context));
        if (result.executed) {
          results.push(result);
        }
      } catch (error) {
        // エラーが発生しても他の割り込みは続行
        // エラー情報を結果に含める
        results.push({
          executed: false,
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    return results;
  }

  /**
   * 登録されている全割り込みをクリア
   */
  clear(): void {
    this.interrupts = [];
  }

  /**
   * 登録されている割り込み数を取得
   * 
   * @returns 割り込み数
   */
  getCount(): number {
    return this.interrupts.length;
  }

  /**
   * 特定タイプの割り込み数を取得
   * 
   * @param type - 割り込みタイプ
   * @returns 割り込み数
   */
  getCountByType(type: InterruptType): number {
    return this.interrupts.filter(int => int.type === type).length;
  }
}
