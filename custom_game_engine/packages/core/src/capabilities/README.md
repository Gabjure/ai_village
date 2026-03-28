# Alien Capability Registry

`AlienCapabilityRegistry` defines emergent capability unlocks from runtime state, not species IDs.

## Design Rules

- Capability predicates must derive from genetics + biochemistry inputs.
- Do not hardcode species name checks for unlock logic.
- Keep each capability evaluation deterministic and pure.
- Return both `geneticScore` and `biochemicalScore` for observability.

## Current Capabilities

- `collaborative_composition`
- `trance_states`
- `predatory_pack_coordination`
- `symbolic_ritualization`

## Adding a Capability

1. Add a new ID to `ALIEN_CAPABILITY_IDS` in `CapabilityProfileComponent`.
2. Add a matching definition in `AlienCapabilityRegistry`.
3. Set an explicit `unlockThreshold` and score decomposition.
4. Ensure `AlienCapabilityProfileSystem` emits `capability:unlocked` on first unlock only.
5. Add/adjust tests for unlock behavior and metrics aggregation.

## Telemetry Contract

On first unlock, systems emit `capability:unlocked` with:

- `agentId`
- `capabilityId`
- `speciesId` (optional)
- `score`
- `geneticScore`
- `biochemicalScore`
- `tick`

`MetricsCollectionSystem` forwards this event to `MetricsCollector` where cross-species unlock frequency is aggregated.
