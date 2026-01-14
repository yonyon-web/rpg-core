/**
 * JobBuilder - Builder pattern for easily creating Job instances
 * 
 * @example
 * ```typescript
 * const warrior = new JobBuilder('warrior', 'Warrior')
 *   .description('A mighty warrior skilled in physical combat')
 *   .statModifier('attack', 15)
 *   .statModifier('defense', 10)
 *   .statModifier('maxHp', 30)
 *   .levelRequirement(5)
 *   .build();
 * ```
 * 
 * @example
 * ```typescript
 * const mage = new JobBuilder('mage', 'Mage')
 *   .description('A master of magical arts')
 *   .statModifiers({ magic: 20, magicDefense: 15, maxMp: 50 })
 *   .availableSkills(['fireball', 'ice-blast', 'heal'])
 *   .levelRequirement(3)
 *   .requiredJobs(['apprentice'])
 *   .build();
 * ```
 */

import type { Job } from '../../types/character/job';
import type { DefaultStats } from '../../types/character/stats';
import type { UniqueId } from '../../types/common';

export class JobBuilder {
  private job: Partial<Job>;

  constructor(id: UniqueId, name: string) {
    // Initialize with default values
    this.job = {
      id,
      name,
      description: '',
      statModifiers: {},
    };
  }

  /**
   * Set job description
   */
  description(desc: string): this {
    this.job.description = desc;
    return this;
  }

  /**
   * Add a single stat modifier
   */
  statModifier(stat: keyof DefaultStats, value: number): this {
    if (!this.job.statModifiers) {
      this.job.statModifiers = {};
    }
    this.job.statModifiers[stat] = value;
    return this;
  }

  /**
   * Set multiple stat modifiers at once
   */
  statModifiers(modifiers: Partial<DefaultStats>): this {
    this.job.statModifiers = { ...this.job.statModifiers, ...modifiers };
    return this;
  }

  /**
   * Set available skills for this job
   */
  availableSkills(skillIds: UniqueId[]): this {
    this.job.availableSkills = skillIds;
    return this;
  }

  /**
   * Add a single available skill
   */
  addAvailableSkill(skillId: UniqueId): this {
    if (!this.job.availableSkills) {
      this.job.availableSkills = [];
    }
    this.job.availableSkills.push(skillId);
    return this;
  }

  /**
   * Set level requirement for this job
   */
  levelRequirement(level: number): this {
    this.job.levelRequirement = level;
    return this;
  }

  /**
   * Set required jobs (prerequisites)
   */
  requiredJobs(jobIds: UniqueId[]): this {
    this.job.requiredJobs = jobIds;
    return this;
  }

  /**
   * Add a single required job
   */
  addRequiredJob(jobId: UniqueId): this {
    if (!this.job.requiredJobs) {
      this.job.requiredJobs = [];
    }
    this.job.requiredJobs.push(jobId);
    return this;
  }

  /**
   * Build and return the Job
   */
  build(): Job {
    return this.job as Job;
  }
}
