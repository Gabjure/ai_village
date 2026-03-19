import type { Component } from '../ecs/Component.js';

/**
 * Tracks per-agent greeting cooldowns to prevent repeated greetings.
 * Each agent maintains a map of entity IDs they've recently greeted
 * along with the tick when the greeting occurred.
 */
export interface GreetingStateComponent extends Component {
  type: 'greeting_state';
  /** Map of entity ID -> last greeted tick */
  greetedAt: Map<string, number>;
}

export function createGreetingStateComponent(): GreetingStateComponent {
  return {
    type: 'greeting_state',
    version: 1,
    greetedAt: new Map(),
  };
}
