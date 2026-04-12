/**
 * WisdomGoddessSystem - Manifests and manages the Goddess of Wisdom
 *
 * The Goddess of Wisdom manifests when pending approvals pile up:
 * - 5+ creations pending for 1 in-game hour triggers manifestation
 * - She scrutinizes and auto-approves/rejects based on her style
 * - Emits events so players can observe the judgments
 * - "[Goddess Name] has joined the chat"
 */

import type { World } from '../ecs/World.js';
import type { Entity } from '../ecs/Entity.js';
import { EntityImpl } from '../ecs/Entity.js';
import type { ComponentType, EntityId } from '../types.js';
import { BaseSystem, type SystemContext } from '../ecs/SystemContext.js';
import { TICKS_PER_HOUR } from '../constants/TimeConstants.js';
import { pendingApprovalRegistry, type PendingCreation } from '../crafting/PendingApprovalRegistry.js';
import {
  createGoddessOfWisdom,
  findGoddessOfWisdom,
  moveGoddessOfWisdom,
} from '../divinity/GoddessOfWisdomEntity.js';
import {
  getRandomWisdomGoddess,
  type WisdomGoddessConfig as GoddessConfig,
} from '../divinity/WisdomGoddessSpriteRegistry.js';
import {
  heuristicWisdomScrutiny,
  getDefaultScrutinyStyle,
} from '../divinity/WisdomGoddessScrutiny.js';
import { ChatRoomSystem, DIVINE_CHAT_CONFIG } from '../communication/index.js';
import type { RelationshipComponent } from '../components/RelationshipComponent.js';
import { updateRelationship } from '../components/RelationshipComponent.js';
import type { EpisodicMemoryComponent } from '../components/EpisodicMemoryComponent.js';
import type { IdentityComponent } from '../components/IdentityComponent.js';
import type { PositionComponent } from '../components/PositionComponent.js';

/** Configuration for wisdom goddess manifestation */
interface SystemConfig {
  /** Minimum pending creations to trigger manifestation */
  minPendingCount: number;
  /** Minimum age in ticks for creations to be considered stale */
  minStaleTicks: number;
  /** How often to check the queue (in ticks) */
  checkInterval: number;
  /** How many creations to process per tick when active */
  processPerTick: number;
}

const DEFAULT_CONFIG: SystemConfig = {
  minPendingCount: 5,
  minStaleTicks: TICKS_PER_HOUR, // 1 in-game hour
  checkInterval: 60, // Check every 3 seconds (60 ticks at 20 TPS)
  processPerTick: 1, // Process one creation per tick for drama
};

export class WisdomGoddessSystem extends BaseSystem {
  public readonly id = 'wisdom_goddess_system';
  public readonly priority = 900; // Low priority - runs after most systems
  public readonly requiredComponents: ReadonlyArray<ComponentType> = [];
  // Lazy activation: Skip entire system when no divinity exists
  public readonly activationComponents = ['divinity'] as const;
  protected readonly throttleInterval = 100; // SLOW - 5 seconds // Global system, no entity requirements
  public enabled = true;

  private config: SystemConfig;
  private lastCheckTick = 0;
  private goddessEntityId: string | null = null;
  private activeGoddessConfig: GoddessConfig | null = null;
  private processingQueue: PendingCreation[] = [];
  private isProcessing = false;
  private chatRoomSystem: ChatRoomSystem | null = null;
  private processedCount = 0;
  private approvedCount = 0;
  private rejectedCount = 0;

  // Chat listening state
  private subscribedToEvents = false;
  private lastResponseTick = 0;
  private responseCooldownTicks = 40; // 2 seconds between responses
  private pendingResponses: Array<{
    senderId: string;
    senderName: string;
    content: string;
    tick: number;
  }> = [];

  constructor(config: Partial<SystemConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Set the chat room system for divine chat integration
   */
  setChatRoomSystem(chatSystem: ChatRoomSystem): void {
    this.chatRoomSystem = chatSystem;
  }

  protected onUpdate(ctx: SystemContext): void {
    const world = ctx.world;
    const currentTick = Number(ctx.tick);

    // Subscribe to chat events once
    if (!this.subscribedToEvents) {
      this.subscribeToChat(world);
      this.subscribedToEvents = true;
    }

    // Process any pending chat responses (with cooldown)
    if (this.pendingResponses.length > 0 && currentTick - this.lastResponseTick >= this.responseCooldownTicks) {
      this.processNextChatResponse(world, currentTick);
    }

    // If actively processing approvals, continue
    if (this.isProcessing && this.processingQueue.length > 0) {
      this.processNextCreation(world, currentTick);
      return;
    }

    // Check for finished processing
    if (this.isProcessing && this.processingQueue.length === 0) {
      this.finishProcessing(world);
      return;
    }

    // Periodic check for stale queue
    if (currentTick - this.lastCheckTick < this.config.checkInterval) {
      return;
    }
    this.lastCheckTick = currentTick;

    // Check if manifestation conditions are met
    const staleCreations = this.getStaleCreations(currentTick);
    if (staleCreations.length >= this.config.minPendingCount) {
      this.manifestGoddess(world, staleCreations, currentTick);
    }
  }

  // ============================================================================
  // CHAT LISTENING & RESPONSE
  // ============================================================================

  /**
   * Subscribe to chat message events
   */
  private subscribeToChat(world: World): void {
    world.eventBus.subscribe('chat:message_sent', (event) => {
      const data = event.data;

      // Only care about divine chat messages
      if (data.roomId !== DIVINE_CHAT_CONFIG.id) return;

      // Don't respond to our own messages
      const goddess = this.getGoddessEntity(world);
      if (!goddess || data.senderId === goddess.id) return;

      // Check if message is addressed to the goddess
      const goddessName = this.getGoddessName(goddess);
      const messageContent = data.content || data.message || '';
      const messageSenderName = data.senderName || data.senderId;
      if (this.isAddressedToGoddess(messageContent, goddessName)) {
        this.pendingResponses.push({
          senderId: data.senderId,
          senderName: messageSenderName,
          content: messageContent,
          tick: Number(world.tick),
        });
      }
    });
  }

  /**
   * Check if a message is addressed to the goddess
   */
  private isAddressedToGoddess(content: string, goddessName: string): boolean {
    const lowerContent = content.toLowerCase();
    const lowerName = goddessName.toLowerCase();

    // Direct mention
    if (lowerContent.includes(`@${lowerName}`)) return true;
    if (lowerContent.includes(lowerName)) return true;

    // Generic wisdom goddess references
    if (lowerContent.includes('goddess of wisdom')) return true;
    if (lowerContent.includes('wisdom goddess')) return true;

    // Quetzali Sage-specific
    if (goddessName === 'Quetzali Sage') {
      if (lowerContent.includes('quetzali')) return true;
      if (lowerContent.includes('sage')) return true;
    }

    return false;
  }

  /**
   * Process the next pending chat response
   */
  private processNextChatResponse(world: World, currentTick: number): void {
    const pending = this.pendingResponses.shift();
    if (!pending) return;

    const goddess = this.getGoddessEntity(world);
    if (!goddess || !this.chatRoomSystem) return;

    const goddessName = this.getGoddessName(goddess);

    // Get relationship context
    const relationshipInfo = this.getRelationshipInfo(goddess, pending.senderId);

    // Generate response based on context
    const response = this.generateChatResponse(
      goddessName,
      pending.senderName,
      pending.content,
      relationshipInfo
    );

    // Send response
    this.chatRoomSystem.sendMessage(world, DIVINE_CHAT_CONFIG.id, goddess.id, response);
    this.lastResponseTick = currentTick;

    // Update relationship (conversation increases familiarity, tone affects affinity)
    this.updateGoddessRelationship(world, goddess, pending.senderId, pending.content, currentTick);

    // Form memory of this conversation
    this.formConversationMemory(goddess, pending.senderId, pending.senderName, pending.content, response, currentTick);
  }

  /**
   * Get relationship info between goddess and a mortal
   */
  private getRelationshipInfo(goddess: Entity, targetId: EntityId): {
    familiarity: number;
    affinity: number;
    approvedCount: number;
    rejectedCount: number;
  } {
    const relComp = goddess.getComponent<RelationshipComponent>('relationship');
    const memComp = goddess.getComponent<EpisodicMemoryComponent>('episodic_memory');

    let familiarity = 0;
    let affinity = 0;

    if (relComp) {
      const rel = relComp.relationships.get(targetId);
      if (rel) {
        familiarity = rel.familiarity;
        affinity = rel.affinity;
      }
    }

    // Count past judgments for this creator
    let approvedCount = 0;
    let rejectedCount = 0;

    if (memComp) {
      for (const memory of memComp.episodicMemories) {
        if (memory.eventType === 'wisdom_judgment' && memory.participants?.includes(targetId)) {
          if (memory.summary.includes('APPROVED')) {
            approvedCount++;
          } else if (memory.summary.includes('REJECTED')) {
            rejectedCount++;
          }
        }
      }
    }

    return { familiarity, affinity, approvedCount, rejectedCount };
  }

  /**
   * Generate a chat response based on context
   */
  private generateChatResponse(
    goddessName: string,
    senderName: string,
    message: string,
    relationship: { familiarity: number; affinity: number; approvedCount: number; rejectedCount: number }
  ): string {
    const lowerMessage = message.toLowerCase();
    const { familiarity, affinity, approvedCount, rejectedCount } = relationship;

    // Determine tone based on relationship
    const isWellKnown = familiarity > 50;
    const isLiked = affinity > 20;
    const isDisliked = affinity < -20;

    // Check for specific topics
    const askingAboutRejection = lowerMessage.includes('reject') || lowerMessage.includes('why not');
    const askingAboutApproval = lowerMessage.includes('approv') || lowerMessage.includes('thank');
    const greeting = lowerMessage.includes('hello') || lowerMessage.includes('greet') || lowerMessage.includes('hi ');
    const askingAdvice = lowerMessage.includes('advice') || lowerMessage.includes('help') || lowerMessage.includes('how');

    // Keeper-specific responses
    const responses = this.getGoddessResponseTemplates(goddessName);

    if (greeting) {
      if (isWellKnown && responses.greetingFamiliar) {
        return responses.greetingFamiliar.replace('{name}', senderName);
      }
      return (responses.greetingNew || 'Greetings, {name}.').replace('{name}', senderName);
    }

    if (askingAboutRejection) {
      if (rejectedCount > 0 && responses.rejectionExplanation) {
        return responses.rejectionExplanation
          .replace('{name}', senderName)
          .replace('{count}', String(rejectedCount));
      }
      return (responses.noRejections || 'I have rejected none of your works, {name}.').replace('{name}', senderName);
    }

    if (askingAboutApproval) {
      if (approvedCount > 0 && responses.approvalAcknowledge) {
        return responses.approvalAcknowledge
          .replace('{name}', senderName)
          .replace('{count}', String(approvedCount));
      }
      return (responses.noApprovals || 'You have not yet submitted work, {name}.').replace('{name}', senderName);
    }

    if (askingAdvice) {
      return (responses.advice || 'Seek wisdom in all you create, {name}.').replace('{name}', senderName);
    }

    // Default response based on relationship
    if (isDisliked) {
      return (responses.coldResponse || '{name}.').replace('{name}', senderName);
    }
    if (isLiked) {
      return (responses.warmResponse || 'Good to see you, {name}.').replace('{name}', senderName);
    }
    return (responses.neutralResponse || 'You have my attention, {name}.').replace('{name}', senderName);
  }

  /**
   * Get response templates for each keeper of wisdom
   */
  private getGoddessResponseTemplates(goddessName: string): Record<string, string> {
    const templates: Record<string, Record<string, string>> = {
      'The Archivist': {
        greetingNew: '*the quill pauses mid-sentence* {name}. You have been indexed. State your purpose and it will be recorded.',
        greetingFamiliar: '*does not look up from the catalogue* {name} again. Cross-referenced with your prior submissions. Proceed.',
        rejectionExplanation: '{count} of your works were returned, {name}. The Archivist does not reject — it marks incomplete. Find what is missing.',
        noRejections: 'No incomplete marks against {name}. The record is accurate. Do not mistake that for lenience.',
        approvalAcknowledge: '{count} entries accepted into permanent record, {name}. They will remain there whether or not you do.',
        noApprovals: 'No accepted entries from {name}. The Archivist has been patient. This is not infinite.',
        advice: 'Every detail you omit becomes a gap in the record, {name}. Gaps accumulate. Fill them before you submit.',
        coldResponse: '*marks notation in margin* {name}. Your file has accrued annotations. They are not favorable.',
        warmResponse: '*the quill resumes writing without interruption* {name}. Your submissions have been consistent. This is rare.',
        neutralResponse: '*the quill does not pause* You have my attention, {name}. The record is listening.',
      },
      'Weaver of Loomspire': {
        greetingNew: '*threads rearrange into an open pattern* A new thread approaches. Welcome, {name}. Show me what you are made of.',
        greetingFamiliar: '*knots shift with recognition* {name}. Your strand is known to this web. What have you brought this time?',
        rejectionExplanation: '{count} of your works could not be woven in, {name}. Not failure — the pattern was not ready for them yet. Try again.',
        noRejections: 'Nothing returned from {name}. Every thread you offered found its place. This is beautiful work.',
        approvalAcknowledge: '*weave brightens* {count} of your creations are now woven into the larger pattern, {name}. They will hold.',
        noApprovals: 'You have not yet offered thread, {name}. The loom is patient. Do not make it wait too long.',
        advice: 'Do not force the pattern, {name}. A creation that belongs in the world will find its place. One that does not will unravel.',
        coldResponse: '*threads pull taut* {name}. There is tension in this connection. Let us find the loose end.',
        warmResponse: '*weave hums warmly* {name}. You strengthen the pattern simply by being here.',
        neutralResponse: '*a thread extends toward you* I am listening, {name}. Speak and we will see what it becomes.',
      },
      'Draugrn Scribe': {
        greetingNew: '*stone tablet rasps against stone* {name}. Designation logged. Speak your purpose. I do not ask twice.',
        greetingFamiliar: '*checks compressed-stone index* {name}. Cross-referenced. Your record is retrievable. Continue.',
        rejectionExplanation: '{count} submissions from {name} lacked demonstrable function. The deep stacks have no space for decoration.',
        noRejections: 'No rejected entries for {name}. Your practical approach has been adequate.',
        approvalAcknowledge: '{count} entries inscribed for {name}. Utility verified. The stacks hold them now.',
        noApprovals: 'No submissions from {name} in the archive. Observation without submission is curiosity. Curiosity without output is waste.',
        advice: 'What does it do, {name}? If you cannot answer that in one sentence, the work is not finished.',
        coldResponse: '*stylus pauses* {name}. The record shows a pattern I do not find efficient. Explain.',
        warmResponse: '*minimal acknowledgment* {name}. Your submissions have been consistently functional. This is noted.',
        neutralResponse: '*tablet ready* {name}. The Scribe is recording. Do not waste the inscription.',
      },
      'Quetzali Sage': {
        greetingNew: '*plumage cycles through colors of curiosity* {name}. I already know what you made. My question is whether you do.',
        greetingFamiliar: '*tilts head, plumage warm amber* {name} returns. Good. Tell me what you learned since we last spoke.',
        rejectionExplanation: '{count} of your works were returned, {name}. Not because they failed — because you could not yet say what they were for.',
        noRejections: 'Nothing returned from {name}. Either your understanding is sound, or I have not tested it sufficiently yet.',
        approvalAcknowledge: '{count} of your works passed, {name}. You knew what they were. That is harder than it sounds.',
        noApprovals: 'You have submitted nothing, {name}. The Sage is patient. But patience is also a test.',
        advice: 'What did you assume was obvious, {name}? That assumption is where the real work lives.',
        coldResponse: '*plumage dims to cool grey* {name}. I sense you are presenting without understanding. Let us begin again.',
        warmResponse: '*plumage brightens* {name}. You ask the right questions. That is everything.',
        neutralResponse: '*watching carefully* {name}. I am here. Now — what do you actually want to know?',
      },
      'Anansi-Web Lorekeeper': {
        greetingNew: '*presence arrives from multiple directions at once* {name}. We have been listening. Welcome to the web.',
        greetingFamiliar: '*warmth spreads through the connection* {name}. The web knows your thread. How does your work continue?',
        rejectionExplanation: '{count} of your works could not be shared through the web, {name}. What you offered was not yet ready to travel. Finish it.',
        noRejections: 'Nothing returned from {name}. Everything you offered traveled well. The web carried it.',
        approvalAcknowledge: '{count} of your creations now move through the network, {name}. Others will find them. This is how knowledge spreads.',
        noApprovals: 'You have not yet offered to the web, {name}. The network does not come to you. You must send something first.',
        advice: 'A creation that cannot be shared is a story no one will tell, {name}. Make something worth passing on.',
        coldResponse: '*threads pull back slightly* {name}. There is something withheld here. The web notices what is hidden.',
        warmResponse: '*network hums with recognition* {name}. Your presence strengthens the web. The knowledge flows better when you are in it.',
        neutralResponse: '*attentive presence from all nodes* {name}. We are listening from many directions at once. Speak.',
      },
      'Draugrn Archivist': {
        greetingNew: '*retrieves {name}\'s entry from memory strata* {name}. Your name is now filed under the correct geological layer. Proceed.',
        greetingFamiliar: '*cross-references {name} against multiple strata* {name}. Your complete history is accessible. I have reviewed it.',
        rejectionExplanation: '{count} submissions from {name} marked INCOMPLETE. The deep archive has held incomplete entries for millennia. They do not improve with age.',
        noRejections: 'No incomplete marks for {name}. The record is clean across all strata. This is the expected standard.',
        approvalAcknowledge: '{count} permanent entries inscribed for {name}. They are below the impermanence layer now. They will outlast the surface.',
        noApprovals: 'No entries from {name} in the permanent record. The archive is not a spectator experience.',
        advice: 'Precision is not optional, {name}. Every imprecision I accept becomes an error some future archivist must correct. Do not create that debt.',
        coldResponse: '*notation added to {name}\'s stratum* {name}. The record contains discrepancies. We should address them.',
        warmResponse: '*deep acknowledgment* {name}. Your entries meet archival standard. Consistently. This is not common.',
        neutralResponse: '*stylus poised over stone* {name}. Speak accurately. I do not file approximations.',
      },
    };

    return templates[goddessName] ?? templates['The Archivist']!;
  }

  /**
   * Update goddess's relationship with a mortal after conversation
   */
  private updateGoddessRelationship(
    _world: World,
    goddess: Entity,
    targetId: EntityId,
    message: string,
    currentTick: number
  ): void {
    const relComp = goddess.getComponent<RelationshipComponent>('relationship');
    if (!relComp) return;

    // Analyze message sentiment (simple heuristic)
    const lowerMessage = message.toLowerCase();
    let affinityChange = 0;

    // Positive sentiment
    if (lowerMessage.includes('thank') || lowerMessage.includes('grateful') || lowerMessage.includes('appreciate')) {
      affinityChange += 5;
    }
    if (lowerMessage.includes('love') || lowerMessage.includes('wonderful') || lowerMessage.includes('amazing')) {
      affinityChange += 3;
    }

    // Negative sentiment
    if (lowerMessage.includes('unfair') || lowerMessage.includes('wrong') || lowerMessage.includes('stupid')) {
      affinityChange -= 5;
    }
    if (lowerMessage.includes('hate') || lowerMessage.includes('terrible') || lowerMessage.includes('awful')) {
      affinityChange -= 8;
    }

    // Questions are neutral but show engagement
    if (lowerMessage.includes('?')) {
      affinityChange += 1;
    }

    // Update the relationship using atomic component update
    // Cast to EntityImpl to access updateComponent method
    if ('updateComponent' in goddess) {
      const goddessImpl = goddess as EntityImpl;
      goddessImpl.updateComponent<RelationshipComponent>('relationship', (current) =>
        updateRelationship(current, targetId, currentTick, 3, affinityChange)
      );
    }
  }

  /**
   * Form a memory of the conversation
   */
  private formConversationMemory(
    goddess: Entity,
    speakerId: EntityId,
    speakerName: string,
    theirMessage: string,
    ourResponse: string,
    currentTick: number
  ): void {
    const memComp = goddess.getComponent<EpisodicMemoryComponent>('episodic_memory');
    if (!memComp) return;

    memComp.formMemory({
      eventType: 'divine_conversation',
      summary: `Conversed with ${speakerName} in divine chat. They said: "${theirMessage.slice(0, 100)}..." I responded: "${ourResponse.slice(0, 100)}..."`,
      timestamp: currentTick,
      participants: [speakerId],
      emotionalValence: 0.2, // Slight positive (engagement is good)
      emotionalIntensity: 0.3,
      surprise: 0.1,
      importance: 0.4,
      socialSignificance: 0.6,
      dialogueText: `${speakerName}: ${theirMessage}\n[Goddess]: ${ourResponse}`,
    });
  }

  /**
   * Get the goddess entity if it exists
   */
  private getGoddessEntity(world: World): Entity | null {
    if (this.goddessEntityId) {
      const goddess = world.getEntity(this.goddessEntityId);
      if (goddess) return goddess;
    }
    return findGoddessOfWisdom(world);
  }

  /**
   * Get the goddess's name from the entity
   */
  private getGoddessName(goddess: Entity): string {
    const identity = goddess.getComponent<IdentityComponent>('identity');
    return identity?.name || 'Goddess of Wisdom';
  }

  /**
   * Get creations that have been pending for too long
   */
  private getStaleCreations(currentTick: number): PendingCreation[] {
    const allPending = pendingApprovalRegistry.getAll();
    return allPending.filter(
      (creation) => currentTick - creation.createdAt >= this.config.minStaleTicks
    );
  }

  /**
   * Manifest the Goddess of Wisdom to process the queue
   */
  private manifestGoddess(
    world: World,
    staleCreations: PendingCreation[],
    _currentTick: number
  ): void {
    // Check if goddess already exists
    let goddess = findGoddessOfWisdom(world);
    const goddessConfig = getRandomWisdomGoddess();

    // Pick a location - use the first creator's position or center of map
    const firstCreation = staleCreations[0];
    let location = { x: 50, y: 50 }; // Default center

    if (firstCreation) {
      // Try to find the creator entity for their location
      const creator = world.getEntity(firstCreation.creatorId);
      if (creator) {
        const pos = creator.getComponent<PositionComponent>('position');
        if (pos) {
          location = { x: pos.x, y: pos.y };
        }
      }
    }

    if (!goddess) {
      // First manifestation - create the entity
      goddess = createGoddessOfWisdom(world, location, goddessConfig);
      this.goddessEntityId = goddess.id;

      // Emit manifestation event - "has joined the chat"
      world.eventBus.emit({
        type: 'deity:manifested',
        source: this.id,
        data: {
          deityId: goddess.id,
          deityName: goddessConfig.name,
          deityType: 'wisdom_goddess',
          reason: `${staleCreations.length} creations awaiting judgment`,
          location,
          message: `${goddessConfig.name} has joined the chat`,
        },
      });

      // Post intro message to divine chat
      if (this.chatRoomSystem) {
        const introMessage = this.generateIntroMessage(goddessConfig, staleCreations.length);
        this.chatRoomSystem.sendMessage(world, DIVINE_CHAT_CONFIG.id, goddess.id, introMessage);
      }
    } else {
      // Goddess exists, move to location
      moveGoddessOfWisdom(goddess, location);
      this.goddessEntityId = goddess.id;
    }

    // Store goddess config and start processing
    this.activeGoddessConfig = goddessConfig;
    this.processingQueue = [...staleCreations];
    this.isProcessing = true;
  }

  /**
   * Process the next creation in the queue
   */
  private processNextCreation(world: World, _currentTick: number): void {
    const creation = this.processingQueue.shift();
    if (!creation || !this.activeGoddessConfig || !this.goddessEntityId) {
      return;
    }

    const goddessName = this.activeGoddessConfig?.name || 'Unknown';

    // Emit scrutiny started event
    world.eventBus.emit({
      type: 'wisdom:scrutiny_started',
      source: this.id,
      data: {
        goddessId: this.goddessEntityId,
        goddessName,
        creationId: creation.id,
        creationType: creation.creationType,
        creatorId: creation.creatorId,
        creatorName: creation.creatorName,
      },
    });

    // Perform scrutiny
    const style = getDefaultScrutinyStyle(creation.creationType);
    const result = heuristicWisdomScrutiny(creation, style, goddessName);

    // Emit judgment event
    world.eventBus.emit({
      type: 'wisdom:judgment',
      source: this.id,
      data: {
        goddessId: this.goddessEntityId,
        goddessName,
        creationId: creation.id,
        creationType: creation.creationType,
        creatorId: creation.creatorId,
        creatorName: creation.creatorName,
        approved: result.approved,
        wisdomComment: result.wisdomComment,
        balanceScore: result.balanceScore,
        noveltyScore: result.noveltyScore,
        fitScore: result.fitScore,
      },
    });

    // Apply the judgment and track counts
    this.processedCount++;
    if (result.approved) {
      this.approvedCount++;
      pendingApprovalRegistry.approve(creation.id);
    } else {
      this.rejectedCount++;
      pendingApprovalRegistry.reject(creation.id);
    }

    // Post research paper summary to divine chat
    if (this.chatRoomSystem && this.goddessEntityId) {
      const summary = this.generateResearchSummary(creation, result.approved, result.wisdomComment, goddessName);
      this.chatRoomSystem.sendMessage(world, DIVINE_CHAT_CONFIG.id, this.goddessEntityId, summary);
    }
  }

  /**
   * Finish processing and emit summary
   */
  private finishProcessing(world: World): void {
    if (!this.goddessEntityId || !this.activeGoddessConfig) {
      this.isProcessing = false;
      return;
    }

    const goddessName = this.activeGoddessConfig?.name || 'Unknown';

    // Emit completion event with tracked counts
    world.eventBus.emit({
      type: 'wisdom:queue_processed',
      source: this.id,
      data: {
        goddessId: this.goddessEntityId,
        goddessName,
        totalProcessed: this.processedCount,
        approved: this.approvedCount,
        rejected: this.rejectedCount,
      },
    });

    // Post summary to divine chat
    if (this.chatRoomSystem && this.processedCount > 0) {
      const closingMessage = this.generateClosingMessage(goddessName);
      this.chatRoomSystem.sendMessage(world, DIVINE_CHAT_CONFIG.id, this.goddessEntityId, closingMessage);
    }

    // Reset state
    this.isProcessing = false;
    this.activeGoddessConfig = null;
    this.processedCount = 0;
    this.approvedCount = 0;
    this.rejectedCount = 0;
  }

  /**
   * Generate intro message when keeper joins chat
   */
  private generateIntroMessage(goddessConfig: GoddessConfig, pendingCount: number): string {
    const intros: Record<string, string> = {
      'The Archivist': `*the quill arrives before anything else does* ${pendingCount} submissions have accumulated. The catalogue is behind. This will be corrected now.`,
      'Weaver of Loomspire': `*threads settle into the space* ${pendingCount} creations are waiting to find their place in the pattern. Let us see what fits.`,
      'Draugrn Scribe': `*stone tablets precede the figure by several seconds* ${pendingCount} submissions require assessment. Practical evaluation will begin immediately.`,
      'Quetzali Sage': `*plumage cycling through rapid colors* ${pendingCount} works have arrived. Interesting. I will ask each creator what they actually meant before I judge.`,
      'Anansi-Web Lorekeeper': `*presence distributes across all available nodes* ${pendingCount} creations have entered the web. The network will assess what can travel and what cannot.`,
      'Draugrn Archivist': `*emerges from the deep stacks with a precise accounting already prepared* ${pendingCount} submissions await permanent inscription or return. The archive requires accuracy. Let us begin.`,
    };

    return intros[goddessConfig.name] ?? `*arrives* ${pendingCount} creations await judgment.`;
  }

  /**
   * Generate research paper summary for a creation
   */
  private generateResearchSummary(
    creation: PendingCreation,
    approved: boolean,
    wisdomComment: string,
    _goddessName: string
  ): string {
    let title: string;
    let field: string;

    if (creation.creationType === 'technology' && creation.technology) {
      title = creation.technology.name;
      field = creation.technology.field;
    } else if (creation.creationType === 'recipe' && creation.item) {
      title = creation.item.displayName;
      field = creation.recipeType || 'crafting';
    } else if (creation.creationType === 'effect' && creation.spell) {
      title = creation.spell.name;
      field = creation.paradigmId || 'magic';
    } else {
      title = 'Unknown Creation';
      field = 'unknown';
    }

    const verdict = approved ? '✓ APPROVED' : '✗ REJECTED';
    const author = creation.creatorName;

    return `📜 **${title}** (${field}) by ${author}\n${verdict}: ${wisdomComment}`;
  }

  /**
   * Generate closing message after all reviews
   */
  private generateClosingMessage(goddessName: string): string {
    const total = this.processedCount;
    const approved = this.approvedCount;
    const rejected = this.rejectedCount;

    const closings: Record<string, string> = {
      'The Archivist': `*the quill resumes its sentence* ${total} submissions processed. ${approved} entered into permanent record. ${rejected} returned for completion. The catalogue is current.`,
      'Weaver of Loomspire': `${approved} new threads now hold in the pattern. ${rejected} were returned — the weave was not ready for them. They may find their place later.`,
      'Draugrn Scribe': `Assessment concluded. ${approved} of ${total} submissions demonstrated sufficient function. ${rejected} lacked it. The record reflects this accurately.`,
      'Quetzali Sage': `*plumage settles to a thoughtful color* ${total} reviewed. ${approved} passed — their makers understood what they had built. ${rejected} did not. Yet. I remain available for questions.`,
      'Anansi-Web Lorekeeper': `The network has processed ${total} offerings. ${approved} now travel freely through the web. ${rejected} were not ready to be shared — finish them and send them again.`,
      'Draugrn Archivist': `Inscription complete. ${approved} entries now reside below the impermanence layer. ${rejected} have been returned with notation. The archive is accurate as of this moment.`,
    };

    return closings[goddessName] ?? `Review complete: ${approved} approved, ${rejected} rejected.`;
  }

  /**
   * Force manifestation for testing
   */
  forceManifest(world: World): Entity | null {
    const goddessConfig = getRandomWisdomGoddess();
    const goddess = createGoddessOfWisdom(world, { x: 50, y: 50 }, goddessConfig);

    world.eventBus.emit({
      type: 'deity:manifested',
      source: this.id,
      data: {
        deityId: goddess.id,
        deityName: goddessConfig.name,
        deityType: 'wisdom_goddess',
        reason: 'forced_manifestation',
        location: { x: 50, y: 50 },
        message: `${goddessConfig.name} has joined the chat`,
      },
    });

    return goddess;
  }
}

/**
 * Create a WisdomGoddessSystem with default configuration
 */
export function createWisdomGoddessSystem(
  config?: Partial<SystemConfig>
): WisdomGoddessSystem {
  return new WisdomGoddessSystem(config);
}
