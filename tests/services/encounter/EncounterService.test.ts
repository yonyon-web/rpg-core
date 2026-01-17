/**
 * EncounterService のテスト
 */

import {
  EncounterService,
  RandomEncounterStrategy,
  StepCounterStrategy,
  CustomEncounterStrategy
} from '../../../src/services/encounter/EncounterService';

describe('RandomEncounterStrategy', () => {
  test('エンカウント率0.0では常にエンカウントしない', () => {
    const strategy = new RandomEncounterStrategy(0.0);
    
    for (let i = 0; i < 100; i++) {
      expect(strategy.checkEncounter()).toBe(false);
    }
  });

  test('エンカウント率1.0では常にエンカウントする', () => {
    const strategy = new RandomEncounterStrategy(1.0);
    
    for (let i = 0; i < 100; i++) {
      expect(strategy.checkEncounter()).toBe(true);
    }
  });

  test('エンカウント率0.5では約半分の確率でエンカウントする', () => {
    const strategy = new RandomEncounterStrategy(0.5);
    let encounterCount = 0;
    const trials = 1000;
    
    for (let i = 0; i < trials; i++) {
      if (strategy.checkEncounter()) {
        encounterCount++;
      }
    }
    
    // 統計的に40%～60%の範囲内であることを確認
    expect(encounterCount).toBeGreaterThan(trials * 0.4);
    expect(encounterCount).toBeLessThan(trials * 0.6);
  });

  test('エンカウント率を範囲外に設定するとエラー', () => {
    expect(() => new RandomEncounterStrategy(-0.1)).toThrow('Encounter rate must be between 0 and 1');
    expect(() => new RandomEncounterStrategy(1.1)).toThrow('Encounter rate must be between 0 and 1');
  });

  test('エンカウント率を更新できる', () => {
    const strategy = new RandomEncounterStrategy(0.0);
    strategy.setEncounterRate(1.0);
    
    expect(strategy.checkEncounter()).toBe(true);
  });

  test('リセットしても状態は変わらない（ランダム戦略）', () => {
    const strategy = new RandomEncounterStrategy(1.0);
    strategy.reset();
    
    expect(strategy.checkEncounter()).toBe(true);
  });
});

describe('StepCounterStrategy', () => {
  test('指定されたステップ数でエンカウントする', () => {
    const strategy = new StepCounterStrategy(5, 0);
    
    // 4回目まではエンカウントしない
    for (let i = 0; i < 4; i++) {
      expect(strategy.checkEncounter()).toBe(false);
    }
    
    // 5回目でエンカウント
    expect(strategy.checkEncounter()).toBe(true);
  });

  test('エンカウント後はカウンターがリセットされる', () => {
    const strategy = new StepCounterStrategy(3, 0);
    
    // 3回でエンカウント
    strategy.checkEncounter();
    strategy.checkEncounter();
    expect(strategy.checkEncounter()).toBe(true);
    
    // 再度3回でエンカウント
    strategy.checkEncounter();
    strategy.checkEncounter();
    expect(strategy.checkEncounter()).toBe(true);
  });

  test('ランダム範囲が機能する', () => {
    const strategy = new StepCounterStrategy(5, 2);
    const encounterSteps: number[] = [];
    
    // 複数回エンカウントを試行し、ステップ数を記録
    for (let trial = 0; trial < 50; trial++) {
      let steps = 0;
      while (!strategy.checkEncounter()) {
        steps++;
        if (steps > 10) break; // 安全弁
      }
      encounterSteps.push(steps + 1); // チェック回数
    }
    
    // 3～7ステップの範囲でエンカウントすることを確認
    const min = Math.min(...encounterSteps);
    const max = Math.max(...encounterSteps);
    
    expect(min).toBeGreaterThanOrEqual(3);
    expect(max).toBeLessThanOrEqual(7);
  });

  test('現在のステップ数を取得できる', () => {
    const strategy = new StepCounterStrategy(5, 0);
    
    expect(strategy.getCurrentSteps()).toBe(0);
    strategy.checkEncounter();
    expect(strategy.getCurrentSteps()).toBe(1);
    strategy.checkEncounter();
    expect(strategy.getCurrentSteps()).toBe(2);
  });

  test('リセットでカウンターが0に戻る', () => {
    const strategy = new StepCounterStrategy(5, 0);
    
    strategy.checkEncounter();
    strategy.checkEncounter();
    expect(strategy.getCurrentSteps()).toBe(2);
    
    strategy.reset();
    expect(strategy.getCurrentSteps()).toBe(0);
  });

  test('エンカウントステップ数を更新できる', () => {
    const strategy = new StepCounterStrategy(5, 0);
    strategy.setEncounterSteps(3);
    
    strategy.checkEncounter();
    strategy.checkEncounter();
    expect(strategy.checkEncounter()).toBe(true);
  });

  test('不正なパラメータでエラー', () => {
    expect(() => new StepCounterStrategy(0, 0)).toThrow('Encounter steps must be greater than 0');
    expect(() => new StepCounterStrategy(-1, 0)).toThrow('Encounter steps must be greater than 0');
    expect(() => new StepCounterStrategy(5, -1)).toThrow('Random range must be non-negative');
  });
});

describe('CustomEncounterStrategy', () => {
  test('カスタム関数が呼ばれる', () => {
    let callCount = 0;
    const checkFunction = () => {
      callCount++;
      return true;
    };
    
    const strategy = new CustomEncounterStrategy(checkFunction);
    
    expect(strategy.checkEncounter()).toBe(true);
    expect(callCount).toBe(1);
    
    expect(strategy.checkEncounter()).toBe(true);
    expect(callCount).toBe(2);
  });

  test('カスタムリセット関数が呼ばれる', () => {
    let resetCount = 0;
    const checkFunction = () => true;
    const resetFunction = () => {
      resetCount++;
    };
    
    const strategy = new CustomEncounterStrategy(checkFunction, resetFunction);
    
    strategy.reset();
    expect(resetCount).toBe(1);
    
    strategy.reset();
    expect(resetCount).toBe(2);
  });

  test('リセット関数がない場合はエラーにならない', () => {
    const strategy = new CustomEncounterStrategy(() => true);
    
    expect(() => strategy.reset()).not.toThrow();
  });

  test('複雑なカスタムロジックが機能する', () => {
    let counter = 0;
    const checkFunction = () => {
      counter++;
      return counter % 3 === 0; // 3回に1回エンカウント
    };
    
    const strategy = new CustomEncounterStrategy(checkFunction);
    
    expect(strategy.checkEncounter()).toBe(false);
    expect(strategy.checkEncounter()).toBe(false);
    expect(strategy.checkEncounter()).toBe(true);
    expect(strategy.checkEncounter()).toBe(false);
  });
});

describe('EncounterService', () => {
  test('エンカウント判定が機能する', () => {
    const strategy = new RandomEncounterStrategy(1.0);
    const service = new EncounterService(strategy);
    
    expect(service.checkEncounter()).toBe(true);
  });

  test('エンカウント無効時は常にfalse', () => {
    const strategy = new RandomEncounterStrategy(1.0);
    const service = new EncounterService(strategy, false);
    
    expect(service.checkEncounter()).toBe(false);
  });

  test('エンカウント有効/無効を切り替えられる', () => {
    const strategy = new RandomEncounterStrategy(1.0);
    const service = new EncounterService(strategy, true);
    
    expect(service.isEnabled()).toBe(true);
    expect(service.checkEncounter()).toBe(true);
    
    service.setEnabled(false);
    expect(service.isEnabled()).toBe(false);
    expect(service.checkEncounter()).toBe(false);
    
    service.setEnabled(true);
    expect(service.isEnabled()).toBe(true);
    expect(service.checkEncounter()).toBe(true);
  });

  test('戦略を変更できる', () => {
    const strategy1 = new RandomEncounterStrategy(0.0);
    const service = new EncounterService(strategy1);
    
    expect(service.checkEncounter()).toBe(false);
    
    const strategy2 = new RandomEncounterStrategy(1.0);
    service.setStrategy(strategy2);
    
    expect(service.checkEncounter()).toBe(true);
  });

  test('現在の戦略を取得できる', () => {
    const strategy = new RandomEncounterStrategy(1.0);
    const service = new EncounterService(strategy);
    
    expect(service.getStrategy()).toBe(strategy);
  });

  test('リセットが戦略に伝わる', () => {
    const strategy = new StepCounterStrategy(5, 0);
    const service = new EncounterService(strategy);
    
    service.checkEncounter();
    service.checkEncounter();
    expect(strategy.getCurrentSteps()).toBe(2);
    
    service.reset();
    expect(strategy.getCurrentSteps()).toBe(0);
  });

  test('実際のゲームシナリオ: ダンジョン探索', () => {
    // ダンジョンでは5～7歩でエンカウント
    const strategy = new StepCounterStrategy(6, 1);
    const service = new EncounterService(strategy);
    
    let encounterCount = 0;
    let totalSteps = 0;
    const maxSteps = 100;
    
    while (totalSteps < maxSteps) {
      totalSteps++;
      if (service.checkEncounter()) {
        encounterCount++;
      }
    }
    
    // 100歩で約14～20回エンカウント（5～7歩ごと）
    expect(encounterCount).toBeGreaterThanOrEqual(10);
    expect(encounterCount).toBeLessThanOrEqual(25);
  });

  test('実際のゲームシナリオ: ボス部屋ではエンカウント無効', () => {
    const strategy = new RandomEncounterStrategy(1.0);
    const service = new EncounterService(strategy);
    
    // 通常エリア
    expect(service.checkEncounter()).toBe(true);
    
    // ボス部屋に入る
    service.setEnabled(false);
    for (let i = 0; i < 10; i++) {
      expect(service.checkEncounter()).toBe(false);
    }
    
    // ボス撃破後、通常エリアに戻る
    service.setEnabled(true);
    expect(service.checkEncounter()).toBe(true);
  });
});
