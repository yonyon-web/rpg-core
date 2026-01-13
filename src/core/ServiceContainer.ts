/**
 * ServiceContainer - Dependency Injection Container
 * 
 * サービス間の依存関係を自動解決するDIコンテナ
 * 
 * @example
 * ```typescript
 * const container = new ServiceContainer();
 * 
 * // サービスを登録
 * container.register('itemService', () => new ItemService());
 * container.register('battleService', (c) => new BattleService(
 *   c.resolve('itemService')
 * ));
 * 
 * // サービスを解決
 * const battleService = container.resolve('battleService');
 * ```
 */

export type ServiceFactory<T = any> = (container: ServiceContainer) => T;
export type ServiceLifetime = 'singleton' | 'transient';

interface ServiceRegistration {
  factory: ServiceFactory;
  lifetime: ServiceLifetime;
  instance?: any;
}

/**
 * ServiceContainer クラス
 * 
 * サービスの登録、解決、ライフタイム管理を行う
 */
export class ServiceContainer {
  private services: Map<string, ServiceRegistration> = new Map();
  private resolving: Set<string> = new Set();

  /**
   * サービスを登録
   * 
   * @param name - サービス名
   * @param factory - サービスを生成するファクトリ関数
   * @param lifetime - ライフタイム（singleton or transient）
   * 
   * @example
   * ```typescript
   * // シングルトン（デフォルト）
   * container.register('config', () => defaultGameConfig);
   * 
   * // トランジェント（毎回新しいインスタンス）
   * container.register('enemy', () => createEnemy(), 'transient');
   * ```
   */
  register<T>(
    name: string,
    factory: ServiceFactory<T>,
    lifetime: ServiceLifetime = 'singleton'
  ): void {
    this.services.set(name, { factory, lifetime });
  }

  /**
   * サービスを解決（取得）
   * 
   * @param name - サービス名
   * @returns 解決されたサービスインスタンス
   * @throws {Error} サービスが登録されていない場合や循環依存がある場合
   * 
   * @example
   * ```typescript
   * const itemService = container.resolve<ItemService>('itemService');
   * ```
   */
  resolve<T>(name: string): T {
    const registration = this.services.get(name);
    
    if (!registration) {
      throw new Error(`Service '${name}' is not registered`);
    }

    // 循環依存チェック
    if (this.resolving.has(name)) {
      throw new Error(`Circular dependency detected: ${name}`);
    }

    // シングルトンの場合、既存のインスタンスを返す
    if (registration.lifetime === 'singleton' && registration.instance) {
      return registration.instance;
    }

    // サービスを生成
    this.resolving.add(name);
    try {
      const instance = registration.factory(this);
      
      // シングルトンの場合、インスタンスを保存
      if (registration.lifetime === 'singleton') {
        registration.instance = instance;
      }
      
      return instance;
    } finally {
      this.resolving.delete(name);
    }
  }

  /**
   * サービスが登録されているかチェック
   * 
   * @param name - サービス名
   * @returns 登録されている場合true
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * サービスを登録解除
   * 
   * @param name - サービス名
   * @returns 解除に成功した場合true
   */
  unregister(name: string): boolean {
    return this.services.delete(name);
  }

  /**
   * 全てのサービスをクリア
   */
  clear(): void {
    this.services.clear();
    this.resolving.clear();
  }

  /**
   * 登録されているサービス名の一覧を取得
   * 
   * @returns サービス名の配列
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }
}
