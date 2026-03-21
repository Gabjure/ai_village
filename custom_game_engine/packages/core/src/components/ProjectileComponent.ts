import type { Component } from '../ecs/Component.js';

export interface ProjectileComponent extends Component {
  readonly type: 'projectile';
  sourceId: string;
  expired: boolean;
  hit: boolean;
  velocity: { x: number; y: number };
  damage: number;
  /** Kind of projectile: 'spell', 'arrow', 'thrown', etc. */
  projectileType?: string;
}
