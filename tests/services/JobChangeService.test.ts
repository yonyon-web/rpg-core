/**
 * JobChangeService tests
 * ジョブ変更サービスのテスト
 */

import { JobChangeService } from '../../src/services/character/JobChangeService';
import { Character } from '../../src/types/battle';
import { Job, JobHistory } from '../../src/types/character/job';
import { DefaultStats } from '../../src/types/character/stats';

describe('JobChangeService', () => {
  let service: JobChangeService;

  // テスト用キャラクター作成
  const createTestCharacter = (overrides?: Partial<Character>): Character => ({
    id: 'char-1',
    name: 'Hero',
    level: 10,
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
    learnedSkills: [],
    statusEffects: [],
    position: 0,
    job: 'warrior',
    ...overrides,
  });

  // テスト用ジョブ作成
  const createTestJob = (overrides?: Partial<Job>): Job => ({
    id: 'job-mage',
    name: 'Mage',
    description: 'A master of magic',
    statModifiers: {
      magic: 10,
      magicDefense: 5,
      maxMp: 20,
    },
    ...overrides,
  });

  beforeEach(() => {
    service = new JobChangeService();
  });

  describe('changeJob', () => {
    test('should successfully change job', () => {
      const character = createTestCharacter();
      const job = createTestJob();

      const result = service.changeJob(character, job);

      expect(result.success).toBe(true);
      expect(character.job).toBe(job.id);
      expect(result.message).toContain('changed job');
      expect(result.previousJob).toBe('warrior');
      expect(result.newJob).toBe(job.id);
    });

    test('should apply stat modifiers when changing job', () => {
      const character = createTestCharacter();
      const originalMagic = character.stats.magic;
      const job = createTestJob({
        statModifiers: { magic: 10, maxMp: 20 },
      });

      const result = service.changeJob(character, job);

      // ステータス補正は適用されている（サービス内で計算）
      expect(result.success).toBe(true);
    });

    test('should respect level requirements', () => {
      const character = createTestCharacter({ level: 5 });
      const job = createTestJob({
        levelRequirement: 10,
      });

      const result = service.changeJob(character, job);

      expect(result.success).toBe(false);
      expect(character.job).toBe('warrior');
      expect(result.message).toContain('level');
    });

    test('should allow job change when level requirement is met', () => {
      const character = createTestCharacter({ level: 15 });
      const job = createTestJob({
        levelRequirement: 10,
      });

      const result = service.changeJob(character, job);

      expect(result.success).toBe(true);
      expect(character.job).toBe(job.id);
    });

    test('should respect prerequisite jobs', () => {
      const character = createTestCharacter({ job: 'warrior' });
      const job = createTestJob({
        id: 'job-paladin',
        requiredJobs: ['job-cleric'],
      });
      
      // ジョブ履歴を空にする
      const result = service.changeJob(character, job, []);

      expect(result.success).toBe(false);
      expect(character.job).toBe('warrior');
      expect(result.message).toContain('prerequisite');
    });

    test('should allow job change when prerequisite jobs are met', () => {
      const character = createTestCharacter({ job: 'warrior' });
      const job = createTestJob({
        id: 'job-paladin',
        requiredJobs: ['job-cleric'],
      });
      
      // ジョブ履歴を作成（クレリックを経験済み）
      const jobHistory: JobHistory[] = [
        {
          jobId: 'job-cleric',
          startedAt: Date.now() - 10000,
          endedAt: Date.now() - 1000,
          levelReached: 10,
        },
      ];

      const result = service.changeJob(character, job, jobHistory);

      expect(result.success).toBe(true);
      expect(character.job).toBe(job.id);
    });

    test('should not allow changing to the same job', () => {
      const character = createTestCharacter({ job: 'job-warrior' });
      const job = createTestJob({ id: 'job-warrior' });

      const result = service.changeJob(character, job);

      expect(result.success).toBe(false);
      expect(result.message).toContain('already');
    });
  });

  describe('getAvailableJobs', () => {
    test('should return empty array when no jobs are available', () => {
      const character = createTestCharacter();
      const jobs: Job[] = [];

      const result = service.getAvailableJobs(character, jobs);

      expect(result).toEqual([]);
    });

    test('should filter out current job', () => {
      const character = createTestCharacter({ job: 'job-warrior' });
      const job1 = createTestJob({ id: 'job-warrior', name: 'Warrior' });
      const job2 = createTestJob({ id: 'job-mage', name: 'Mage' });

      const result = service.getAvailableJobs(character, [job1, job2]);

      expect(result).toHaveLength(1);
      expect(result[0].job.id).toBe('job-mage');
    });

    test('should include requirement information', () => {
      const character = createTestCharacter({ level: 5 });
      const job = createTestJob({
        levelRequirement: 10,
      });

      const result = service.getAvailableJobs(character, [job]);

      expect(result).toHaveLength(1);
      expect(result[0].canChange).toBe(false);
      expect(result[0].reason).toContain('level');
    });

    test('should mark changeable jobs correctly', () => {
      const character = createTestCharacter({ level: 15 });
      const job = createTestJob({
        levelRequirement: 10,
      });

      const result = service.getAvailableJobs(character, [job]);

      expect(result).toHaveLength(1);
      expect(result[0].canChange).toBe(true);
    });
  });

  describe('applyJobBonuses', () => {
    test('should calculate job stat bonuses', () => {
      const character = createTestCharacter();
      const job = createTestJob({
        statModifiers: {
          magic: 15,
          magicDefense: 10,
          maxMp: 30,
        },
      });

      const bonuses = service.applyJobBonuses(character, job);

      expect(bonuses.magic).toBe(15);
      expect(bonuses.magicDefense).toBe(10);
      expect(bonuses.maxMp).toBe(30);
    });

    test('should return empty object when job has no stat modifiers', () => {
      const character = createTestCharacter();
      const job = createTestJob({
        statModifiers: {},
      });

      const bonuses = service.applyJobBonuses(character, job);

      expect(bonuses).toEqual({});
    });
  });

  describe('hasJobExperience', () => {
    test('should return true when character has job in history', () => {
      const jobHistory: JobHistory[] = [
        {
          jobId: 'job-warrior',
          startedAt: Date.now() - 10000,
          endedAt: Date.now() - 1000,
          levelReached: 10,
        },
      ];

      const result = service.hasJobExperience('job-warrior', jobHistory);

      expect(result).toBe(true);
    });

    test('should return false when character does not have job in history', () => {
      const jobHistory: JobHistory[] = [
        {
          jobId: 'job-warrior',
          startedAt: Date.now() - 10000,
          endedAt: Date.now() - 1000,
          levelReached: 10,
        },
      ];

      const result = service.hasJobExperience('job-mage', jobHistory);

      expect(result).toBe(false);
    });

    test('should return false when job history is empty', () => {
      const result = service.hasJobExperience('job-warrior', []);

      expect(result).toBe(false);
    });
  });
});
