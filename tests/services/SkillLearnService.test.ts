/**
 * SkillLearnService tests
 * スキル習得サービスのテスト
 */

import { SkillLearnService } from '../../src/services/SkillLearnService';
import { Character } from '../../src/types/battle';
import { Skill } from '../../src/types/skill';
import { DefaultStats } from '../../src/types/stats';

describe('SkillLearnService', () => {
  let service: SkillLearnService;

  // テスト用キャラクター作成
  const createTestCharacter = (): Character => ({
    id: 'char-1',
    name: 'Hero',
    level: 5,
    stats: {
      maxHp: 100,
      maxMp: 50,
      attack: 20,
      defense: 15,
      magic: 10,
      magicDefense: 12,
      speed: 18,
      luck: 8,
      accuracy: 95,
      evasion: 10,
      criticalRate: 5,
    } as DefaultStats,
    currentHp: 100,
    currentMp: 50,
    currentExp: 1000,
    skills: [],
    statusEffects: [],
    position: 0,
    job: 'warrior',
  });

  // テスト用スキル作成
  const createTestSkill = (overrides?: Partial<Skill>): Skill => ({
    id: 'skill-1',
    name: 'Fire Slash',
    type: 'physical',
    targetType: 'single-enemy',
    element: 'fire',
    power: 1.5,
    cost: { mp: 10 },
    accuracy: 0.95,
    criticalBonus: 0.1,
    isGuaranteedHit: false,
    description: 'A fiery physical attack',
    ...overrides,
  });

  beforeEach(() => {
    service = new SkillLearnService();
  });

  describe('learnSkill', () => {
    test('should successfully learn a new skill', () => {
      const character = createTestCharacter();
      const skill = createTestSkill();

      const result = service.learnSkill(character, skill);

      expect(result.success).toBe(true);
      expect(character.skills).toHaveLength(1);
      expect(character.skills[0]).toBe(skill);
      expect(result.message).toContain('learned');
    });

    test('should not learn a skill that is already known', () => {
      const character = createTestCharacter();
      const skill = createTestSkill();
      character.skills.push(skill);

      const result = service.learnSkill(character, skill);

      expect(result.success).toBe(false);
      expect(character.skills).toHaveLength(1);
      expect(result.message).toContain('already');
    });

    test('should respect level requirements', () => {
      const character = createTestCharacter();
      const skill = createTestSkill();
      
      const result = service.learnSkill(character, skill, { levelRequirement: 10 });

      expect(result.success).toBe(false);
      expect(character.skills).toHaveLength(0);
      expect(result.message).toContain('level');
    });

    test('should allow learning when level requirement is met', () => {
      const character = createTestCharacter();
      character.level = 10;
      const skill = createTestSkill();
      
      const result = service.learnSkill(character, skill, { levelRequirement: 10 });

      expect(result.success).toBe(true);
      expect(character.skills).toHaveLength(1);
    });

    test('should respect job requirements', () => {
      const character = createTestCharacter();
      character.job = 'mage';
      const skill = createTestSkill();
      
      const result = service.learnSkill(character, skill, { requiredJob: 'warrior' });

      expect(result.success).toBe(false);
      expect(character.skills).toHaveLength(0);
      expect(result.message).toContain('job');
    });

    test('should allow learning when job requirement is met', () => {
      const character = createTestCharacter();
      character.job = 'warrior';
      const skill = createTestSkill();
      
      const result = service.learnSkill(character, skill, { requiredJob: 'warrior' });

      expect(result.success).toBe(true);
      expect(character.skills).toHaveLength(1);
    });

    test('should respect prerequisite skills', () => {
      const character = createTestCharacter();
      const skill = createTestSkill({ id: 'skill-2' });
      
      const result = service.learnSkill(character, skill, { 
        prerequisiteSkills: ['skill-1'] 
      });

      expect(result.success).toBe(false);
      expect(character.skills).toHaveLength(0);
      expect(result.message).toContain('prerequisite');
    });

    test('should allow learning when prerequisite skills are met', () => {
      const character = createTestCharacter();
      const prereqSkill = createTestSkill({ id: 'skill-1' });
      const skill = createTestSkill({ id: 'skill-2' });
      character.skills.push(prereqSkill);
      
      const result = service.learnSkill(character, skill, { 
        prerequisiteSkills: ['skill-1'] 
      });

      expect(result.success).toBe(true);
      expect(character.skills).toHaveLength(2);
    });

    test('should respect multiple requirements', () => {
      const character = createTestCharacter();
      character.level = 8;
      character.job = 'warrior';
      const skill = createTestSkill();
      
      const result = service.learnSkill(character, skill, { 
        levelRequirement: 10,
        requiredJob: 'warrior'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('level');
    });

    test('should respect job level requirements', () => {
      const character = createTestCharacter();
      (character as any).jobLevel = 3;
      const skill = createTestSkill();
      
      const result = service.learnSkill(character, skill, { 
        jobLevelRequirement: 5 
      });

      expect(result.success).toBe(false);
      expect(character.skills).toHaveLength(0);
      expect(result.message).toContain('job level');
    });

    test('should allow learning when job level requirement is met', () => {
      const character = createTestCharacter();
      (character as any).jobLevel = 5;
      const skill = createTestSkill();
      
      const result = service.learnSkill(character, skill, { 
        jobLevelRequirement: 5 
      });

      expect(result.success).toBe(true);
      expect(character.skills).toHaveLength(1);
    });
  });

  describe('forgetSkill', () => {
    test('should successfully forget a known skill', () => {
      const character = createTestCharacter();
      const skill = createTestSkill();
      character.skills.push(skill);

      const result = service.forgetSkill(character, skill.id);

      expect(result.success).toBe(true);
      expect(character.skills).toHaveLength(0);
      expect(result.message).toContain('forgotten');
    });

    test('should fail when trying to forget an unknown skill', () => {
      const character = createTestCharacter();

      const result = service.forgetSkill(character, 'unknown-skill');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('getLearnableSkills', () => {
    test('should return empty array when no skills are available', () => {
      const character = createTestCharacter();
      const availableSkills: Skill[] = [];

      const result = service.getLearnableSkills(character, availableSkills);

      expect(result).toEqual([]);
    });

    test('should filter out already learned skills', () => {
      const character = createTestCharacter();
      const skill1 = createTestSkill({ id: 'skill-1' });
      const skill2 = createTestSkill({ id: 'skill-2' });
      character.skills.push(skill1);

      const result = service.getLearnableSkills(character, [skill1, skill2]);

      expect(result).toHaveLength(1);
      expect(result[0].skill.id).toBe('skill-2');
    });

    test('should include requirement information', () => {
      const character = createTestCharacter();
      character.level = 5;
      const skill = createTestSkill();
      const requirements = new Map([[skill.id, { levelRequirement: 10 }]]);

      const result = service.getLearnableSkills(character, [skill], requirements);

      expect(result).toHaveLength(1);
      expect(result[0].canLearn).toBe(false);
      expect(result[0].reason).toContain('level');
    });

    test('should mark learnable skills correctly', () => {
      const character = createTestCharacter();
      character.level = 10;
      const skill = createTestSkill();
      const requirements = new Map([[skill.id, { levelRequirement: 5 }]]);

      const result = service.getLearnableSkills(character, [skill], requirements);

      expect(result).toHaveLength(1);
      expect(result[0].canLearn).toBe(true);
    });
  });

  describe('hasSkill', () => {
    test('should return true when character has the skill', () => {
      const character = createTestCharacter();
      const skill = createTestSkill();
      character.skills.push(skill);

      const result = service.hasSkill(character, skill.id);

      expect(result).toBe(true);
    });

    test('should return false when character does not have the skill', () => {
      const character = createTestCharacter();

      const result = service.hasSkill(character, 'unknown-skill');

      expect(result).toBe(false);
    });
  });
});
