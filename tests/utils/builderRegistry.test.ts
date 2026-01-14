/**
 * Tests for BuilderRegistry
 * These tests verify the name-based lookup functionality
 */

import { BuilderRegistry, JobBuilder, SkillBuilder, ItemBuilder, EnemyBuilder } from '../../src/utils/builders';

describe('BuilderRegistry', () => {
  let registry: BuilderRegistry;

  beforeEach(() => {
    registry = new BuilderRegistry();
  });

  describe('Basic registration and lookup', () => {
    it('should register and look up skills by name', () => {
      const fireball = new SkillBuilder('fireball-id', 'Fireball')
        .type('magic')
        .power(80)
        .build();

      registry.registerSkill(fireball);

      expect(registry.getSkillId('Fireball')).toBe('fireball-id');
      expect(registry.getSkill('Fireball')).toEqual(fireball);
    });

    it('should register and look up items by name', () => {
      const potion = new ItemBuilder('potion-id', 'Health Potion')
        .type('consumable')
        .build();

      registry.registerItem(potion);

      expect(registry.getItemId('Health Potion')).toBe('potion-id');
      expect(registry.getItem('Health Potion')).toEqual(potion);
    });

    it('should register and look up jobs by name', () => {
      const warrior = new JobBuilder('warrior-id', 'Warrior')
        .description('A mighty warrior')
        .build();

      registry.registerJob(warrior);

      expect(registry.getJobId('Warrior')).toBe('warrior-id');
      expect(registry.getJob('Warrior')).toEqual(warrior);
    });

    it('should return undefined for non-existent entities', () => {
      expect(registry.getSkillId('NonExistent')).toBeUndefined();
      expect(registry.getItemId('NonExistent')).toBeUndefined();
      expect(registry.getJobId('NonExistent')).toBeUndefined();
    });
  });

  describe('Name-based builder methods', () => {
    it('should allow JobBuilder to reference skills by name', () => {
      // Register skills
      const fireball = new SkillBuilder('fireball-id', 'Fireball').build();
      const iceBlast = new SkillBuilder('ice-blast-id', 'Ice Blast').build();
      registry.registerSkill(fireball);
      registry.registerSkill(iceBlast);

      // Create job with skills referenced by name
      const mage = new JobBuilder('mage-id', 'Mage')
        .description('A master of magic')
        .availableSkillsByName(['Fireball', 'Ice Blast'], registry)
        .build();

      expect(mage.availableSkills).toEqual(['fireball-id', 'ice-blast-id']);
    });

    it('should allow JobBuilder to add skills one by one using names', () => {
      const skill1 = new SkillBuilder('skill1-id', 'Skill 1').build();
      const skill2 = new SkillBuilder('skill2-id', 'Skill 2').build();
      registry.registerSkill(skill1);
      registry.registerSkill(skill2);

      const job = new JobBuilder('job-id', 'Test Job')
        .addAvailableSkillByName('Skill 1', registry)
        .addAvailableSkillByName('Skill 2', registry)
        .build();

      expect(job.availableSkills).toEqual(['skill1-id', 'skill2-id']);
    });

    it('should allow JobBuilder to reference required jobs by name', () => {
      // Register prerequisite jobs
      const warrior = new JobBuilder('warrior-id', 'Warrior').build();
      const priest = new JobBuilder('priest-id', 'Priest').build();
      registry.registerJob(warrior);
      registry.registerJob(priest);

      // Create advanced job with prerequisites by name
      const paladin = new JobBuilder('paladin-id', 'Paladin')
        .description('A holy warrior')
        .requiredJobsByName(['Warrior', 'Priest'], registry)
        .build();

      expect(paladin.requiredJobs).toEqual(['warrior-id', 'priest-id']);
    });

    it('should allow JobBuilder to add required jobs one by one using names', () => {
      const job1 = new JobBuilder('job1-id', 'Job 1').build();
      const job2 = new JobBuilder('job2-id', 'Job 2').build();
      registry.registerJob(job1);
      registry.registerJob(job2);

      const advancedJob = new JobBuilder('advanced-id', 'Advanced Job')
        .addRequiredJobByName('Job 1', registry)
        .addRequiredJobByName('Job 2', registry)
        .build();

      expect(advancedJob.requiredJobs).toEqual(['job1-id', 'job2-id']);
    });

    it('should allow EnemyBuilder to reference drop items by name', () => {
      // Register items
      const scale = new ItemBuilder('scale-id', 'Dragon Scale').build();
      const gem = new ItemBuilder('gem-id', 'Rare Gem').build();
      registry.registerItem(scale);
      registry.registerItem(gem);

      // Create enemy with drops referenced by name
      const dragon = new EnemyBuilder('dragon-id', 'Dragon', 'dragon')
        .addDropItemByName('Dragon Scale', 0.8, 3, registry)
        .addDropItemByName('Rare Gem', 0.3, 1, registry)
        .build();

      expect(dragon.dropItems).toHaveLength(2);
      expect(dragon.dropItems?.[0]).toEqual({
        itemId: 'scale-id',
        probability: 0.8,
        quantity: 3
      });
      expect(dragon.dropItems?.[1]).toEqual({
        itemId: 'gem-id',
        probability: 0.3,
        quantity: 1
      });
    });

    it('should skip non-existent skills when using names', () => {
      const job = new JobBuilder('job-id', 'Test Job')
        .availableSkillsByName(['NonExistent'], registry)
        .build();

      expect(job.availableSkills).toEqual([]);
    });

    it('should skip non-existent items when using names', () => {
      const enemy = new EnemyBuilder('enemy-id', 'Test Enemy', 'test')
        .addDropItemByName('NonExistent', 0.5, 1, registry)
        .build();

      expect(enemy.dropItems).toEqual([]);
    });
  });

  describe('Registry management', () => {
    it('should list all registered entity names', () => {
      const skill1 = new SkillBuilder('s1', 'Skill One').build();
      const skill2 = new SkillBuilder('s2', 'Skill Two').build();
      const item1 = new ItemBuilder('i1', 'Item One').build();

      registry.registerSkill(skill1);
      registry.registerSkill(skill2);
      registry.registerItem(item1);

      expect(registry.getSkillNames()).toEqual(['Skill One', 'Skill Two']);
      expect(registry.getItemNames()).toEqual(['Item One']);
    });

    it('should clear all registered entities', () => {
      const skill = new SkillBuilder('s1', 'Test Skill').build();
      const item = new ItemBuilder('i1', 'Test Item').build();

      registry.registerSkill(skill);
      registry.registerItem(item);

      expect(registry.getSkillNames()).toHaveLength(1);
      expect(registry.getItemNames()).toHaveLength(1);

      registry.clear();

      expect(registry.getSkillNames()).toHaveLength(0);
      expect(registry.getItemNames()).toHaveLength(0);
    });
  });

  describe('Integration: Complete game setup with registry', () => {
    it('should create a complete game setup using name-based references', () => {
      // Step 1: Create and register skills
      const fireball = new SkillBuilder('fireball', 'Fireball')
        .type('magic')
        .power(80)
        .build();
      const heal = new SkillBuilder('heal', 'Heal')
        .type('heal')
        .power(100)
        .build();

      registry.registerSkill(fireball);
      registry.registerSkill(heal);

      // Step 2: Create and register items
      const potion = new ItemBuilder('potion', 'Health Potion')
        .type('consumable')
        .build();
      const scale = new ItemBuilder('scale', 'Dragon Scale')
        .type('material')
        .build();

      registry.registerItem(potion);
      registry.registerItem(scale);

      // Step 3: Create and register basic jobs
      const apprentice = new JobBuilder('apprentice', 'Apprentice')
        .description('A novice mage')
        .availableSkillsByName(['Fireball'], registry)
        .build();

      registry.registerJob(apprentice);

      // Step 4: Create advanced job with prerequisites
      const archmage = new JobBuilder('archmage', 'Archmage')
        .description('A master of magic')
        .availableSkillsByName(['Fireball', 'Heal'], registry)
        .requiredJobsByName(['Apprentice'], registry)
        .levelRequirement(20)
        .build();

      // Step 5: Create enemy with drops
      const dragon = new EnemyBuilder('dragon', 'Ancient Dragon', 'dragon')
        .level(30)
        .hp(1000)
        .addDropItemByName('Dragon Scale', 0.9, 3, registry)
        .addDropItemByName('Health Potion', 0.5, 2, registry)
        .build();

      // Verify everything is set up correctly
      expect(archmage.availableSkills).toEqual(['fireball', 'heal']);
      expect(archmage.requiredJobs).toEqual(['apprentice']);
      expect(dragon.dropItems).toHaveLength(2);
      expect(dragon.dropItems?.[0].itemId).toBe('scale');
      expect(dragon.dropItems?.[1].itemId).toBe('potion');
    });
  });
});
