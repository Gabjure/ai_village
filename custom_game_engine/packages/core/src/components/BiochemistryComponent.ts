/**
 * BiochemistryComponent - Tracks neurotransmitter levels and nurture/trauma scores
 *
 * Core chemicals (0-1 scale):
 * - oxytocin: bonding, trust, social warmth (boosted by Hand interaction)
 * - serotonin: mood stability, contentment (boosted by Hand interaction)
 * - dopamine: reward, motivation, learning (boosted by Hand interaction)
 * - cortisol: stress, fear, trauma (boosted by harm/neglect)
 *
 * Derived scores:
 * - handInteractionScore: cumulative player engagement (0-1, decays over time)
 * - nurtureScore: sustained periods of high oxytocin + low cortisol
 *
 * All behavioral effects emerge from the biochemistry naturally —
 * no hardcoded milestone checks.
 */

export interface BiochemistryData {
  /** Bonding/trust chemical (0-1) */
  oxytocin: number;
  /** Mood stability chemical (0-1) */
  serotonin: number;
  /** Reward/motivation chemical (0-1) */
  dopamine: number;
  /** Stress/fear chemical (0-1) */
  cortisol: number;
  /** Cumulative Hand engagement (0-1, normalized) */
  handInteractionScore: number;
  /** Sustained nurture accumulator (0-1) */
  nurtureScore: number;
  /** Epigenetic oxytocin baseline inherited from parents (0-1) */
  epigeneticOxytocinBaseline: number;
  /** Epigenetic cortisol baseline inherited from parents (0-1) */
  epigeneticCortisolBaseline: number;
}

export class BiochemistryComponent implements BiochemistryData {
  public readonly type = 'biochemistry';
  public readonly version = 1;

  public oxytocin: number;
  public serotonin: number;
  public dopamine: number;
  public cortisol: number;
  public handInteractionScore: number;
  public nurtureScore: number;
  public epigeneticOxytocinBaseline: number;
  public epigeneticCortisolBaseline: number;

  constructor(data?: Partial<BiochemistryData>) {
    this.oxytocin = data?.oxytocin ?? data?.epigeneticOxytocinBaseline ?? 0.1;
    this.serotonin = data?.serotonin ?? 0.3;
    this.dopamine = data?.dopamine ?? 0.2;
    this.cortisol = data?.cortisol ?? data?.epigeneticCortisolBaseline ?? 0.1;
    this.handInteractionScore = data?.handInteractionScore ?? 0;
    this.nurtureScore = data?.nurtureScore ?? 0;
    this.epigeneticOxytocinBaseline = data?.epigeneticOxytocinBaseline ?? 0;
    this.epigeneticCortisolBaseline = data?.epigeneticCortisolBaseline ?? 0;
  }
}

/**
 * Create a default biochemistry component for a new agent
 */
export function createBiochemistryComponent(
  data?: Partial<BiochemistryData>
): BiochemistryComponent {
  return new BiochemistryComponent(data);
}
