/**
 * SkillLearnController
 * スキル習得UIコントローラー
 */

import { ObservableState } from '../core/ObservableState';
import { EventEmitter } from '../core/EventEmitter';
import type { SkillLearnUIState, SkillLearnEvents, SkillLearnUIStage, SkillFilterType, SkillSortBy } from '../types/skillLearn';
import type { SkillLearnService, LearnableSkillInfo, SkillLearnCost } from '../../services/character/SkillLearnService';
import type { Character } from '../../types/battle';
import type { Skill } from '../../types/skill';
import type { UniqueId } from '../../types/common';
import type { UISortOrder } from '../types/common';

/**
 * SkillLearnController
 * スキル習得UIを管理するコントローラー
 * 
 * @example
 * const controller = new SkillLearnController(skillLearnService);
 * 
 * controller.subscribe((state) => {
 *   console.log('Stage:', state.stage);
 *   console.log('Available skills:', state.availableSkills);
 * });
 * 
 * controller.on('skill-learned', (data) => {
 *   console.log(`${data.character.name} learned ${data.skill.name}!`);
 * });
 * 
 * controller.startSkillSelection(character, allSkills, requirementsMap);
 * controller.selectSkill(skill);
 * await controller.confirmLearn(cost);
 */
export class SkillLearnController {
  private state: ObservableState<SkillLearnUIState>;
  private events: EventEmitter<SkillLearnEvents>;
  private service: SkillLearnService;

  constructor(service: SkillLearnService) {
    this.service = service;
    
    this.state = new ObservableState<SkillLearnUIState>({
      stage: 'browsing',
      character: null,
      availableSkills: [],
      selectedSkill: null,
      cursorIndex: 0,
      filterType: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
      error: null,
      isLearning: false,
    });
    
    this.events = new EventEmitter<SkillLearnEvents>();
  }

  /**
   * 状態を購読
   */
  subscribe(listener: (state: SkillLearnUIState) => void): () => void {
    return this.state.subscribe(listener);
  }

  /**
   * イベントを購読
   */
  on<K extends keyof SkillLearnEvents>(
    event: K,
    listener: (data: SkillLearnEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }

  /**
   * スキル選択を開始
   * 
   * @param character - キャラクター
   * @param availableSkills - 利用可能なスキル一覧
   * @param requirementsMap - スキルIDごとの習得要件
   */
  startSkillSelection(
    character: Character,
    availableSkills: Skill[],
    requirementsMap?: Map<UniqueId, any>
  ): void {
    const learnableSkills = this.service.getLearnableSkills(character, availableSkills, requirementsMap);
    
    this.state.setState({
      stage: 'browsing',
      character,
      availableSkills: learnableSkills,
      selectedSkill: null,
      cursorIndex: 0,
      error: null,
    });
    
    this.events.emit('skill-selection-started', { character, skills: learnableSkills });
  }

  /**
   * スキルを選択
   * 
   * @param skill - 選択するスキル
   */
  selectSkill(skill: Skill): void {
    const currentState = this.state.getState();
    
    // 選択したスキルがリストに存在するか確認
    const skillInfo = currentState.availableSkills.find(s => s.skill.id === skill.id);
    if (!skillInfo) {
      this.state.setState({ error: 'Skill not found in available skills' });
      return;
    }
    
    this.state.setState({
      selectedSkill: skill,
      stage: 'confirming',
      error: null,
    });
    
    this.events.emit('skill-selected', { skill });
  }

  /**
   * スキル習得を確定
   * 
   * @param cost - 習得コスト（オプション）
   */
  async confirmLearn(cost?: SkillLearnCost): Promise<void> {
    const currentState = this.state.getState();
    
    if (!currentState.character || !currentState.selectedSkill) {
      this.state.setState({ error: 'No character or skill selected' });
      return;
    }
    
    this.state.setState({ isLearning: true, stage: 'learning' });
    
    // スキル習得要件を取得
    const skillInfo = currentState.availableSkills.find(s => s.skill.id === currentState.selectedSkill!.id);
    const requirements = skillInfo?.requirements;
    
    // スキルを習得
    const result = this.service.learnSkill(
      currentState.character,
      currentState.selectedSkill,
      requirements,
      cost
    );
    
    if (result.success) {
      this.state.setState({
        stage: 'completed',
        isLearning: false,
        error: null,
      });
      
      this.events.emit('skill-learned', {
        character: currentState.character,
        skill: currentState.selectedSkill,
        level: result.level || 1,
      });
      
      // スキルリストを更新
      this.refreshSkills();
    } else {
      this.state.setState({
        stage: 'confirming',
        isLearning: false,
        error: result.message,
      });
      
      this.events.emit('learn-failed', { reason: result.message });
    }
  }

  /**
   * スキルをレベルアップ
   * 
   * @param skillId - スキルID
   * @param cost - レベルアップコスト（オプション）
   */
  async levelUpSkill(skillId: UniqueId, cost?: SkillLearnCost): Promise<void> {
    const currentState = this.state.getState();
    
    if (!currentState.character) {
      this.state.setState({ error: 'No character selected' });
      return;
    }
    
    this.state.setState({ isLearning: true });
    
    const result = this.service.levelUpSkill(currentState.character, skillId, cost);
    
    if (result.success) {
      this.state.setState({
        isLearning: false,
        error: null,
      });
      
      if (result.skill && result.level) {
        this.events.emit('skill-leveled-up', {
          character: currentState.character,
          skill: result.skill,
          newLevel: result.level,
        });
      }
    } else {
      this.state.setState({
        isLearning: false,
        error: result.message,
      });
      
      this.events.emit('learn-failed', { reason: result.message });
    }
  }

  /**
   * スキルを忘れる
   * 
   * @param skillId - スキルID
   */
  forgetSkill(skillId: UniqueId): void {
    const currentState = this.state.getState();
    
    if (!currentState.character) {
      this.state.setState({ error: 'No character selected' });
      return;
    }
    
    const result = this.service.forgetSkill(currentState.character, skillId);
    
    if (result.success) {
      this.state.setState({ error: null });
      
      if (result.skill) {
        this.events.emit('skill-forgotten', {
          character: currentState.character,
          skill: result.skill,
        });
      }
      
      // スキルリストを更新
      this.refreshSkills();
    } else {
      this.state.setState({ error: result.message });
    }
  }

  /**
   * フィルタを設定
   * 
   * @param filterType - フィルタタイプ
   */
  setFilter(filterType: SkillFilterType): void {
    this.state.setState({ filterType });
    this.events.emit('filter-changed', { filterType });
    this.applyFilterAndSort();
  }

  /**
   * ソートを設定
   * 
   * @param sortBy - ソート基準
   * @param order - ソート順
   */
  setSortBy(sortBy: SkillSortBy, order: UISortOrder = 'asc'): void {
    this.state.setState({ sortBy, sortOrder: order });
    this.events.emit('sort-changed', { sortBy, order });
    this.applyFilterAndSort();
  }

  /**
   * カーソル移動
   * 
   * @param delta - 移動量（+1 = 次、-1 = 前）
   */
  moveCursor(delta: number): void {
    const currentState = this.state.getState();
    const newIndex = currentState.cursorIndex + delta;
    const maxIndex = currentState.availableSkills.length - 1;
    
    if (newIndex >= 0 && newIndex <= maxIndex) {
      this.state.setState({ cursorIndex: newIndex });
    }
  }

  /**
   * 選択をキャンセル
   */
  cancel(): void {
    this.state.setState({
      stage: 'browsing',
      selectedSkill: null,
      error: null,
    });
    
    this.events.emit('selection-cancelled', {});
  }

  /**
   * スキルリストを更新
   */
  private refreshSkills(): void {
    const currentState = this.state.getState();
    if (currentState.character) {
      // 既存のスキル一覧を再取得
      const learnableSkills = this.service.getLearnableSkills(
        currentState.character,
        currentState.availableSkills.map(s => s.skill)
      );
      
      this.state.setState({ availableSkills: learnableSkills });
      this.applyFilterAndSort();
    }
  }

  /**
   * フィルタとソートを適用
   */
  private applyFilterAndSort(): void {
    const currentState = this.state.getState();
    let filtered = [...currentState.availableSkills];
    
    // フィルタ適用
    if (currentState.filterType === 'learnable') {
      filtered = filtered.filter(s => s.canLearn);
    } else if (currentState.filterType === 'unlearnable') {
      filtered = filtered.filter(s => !s.canLearn);
    }
    
    // ソート適用
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (currentState.sortBy) {
        case 'name':
          comparison = a.skill.name.localeCompare(b.skill.name);
          break;
        case 'level':
          comparison = (a.requirements?.levelRequirement || 0) - (b.requirements?.levelRequirement || 0);
          break;
        case 'cost':
          comparison = (a.cost?.amount || 0) - (b.cost?.amount || 0);
          break;
      }
      
      return currentState.sortOrder === 'asc' ? comparison : -comparison;
    });
    
    this.state.setState({ availableSkills: filtered });
  }

  /**
   * 現在の状態を取得
   */
  getState(): SkillLearnUIState {
    return this.state.getState();
  }
}
