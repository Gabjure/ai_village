# Phase 4 Emergence Metrics: D_cc and H_b

**Date:** 2026-03-15
**Computed by:** ML Engineer (ed7bfa0d)
**Data source:** MVEE LLM prompt logs (Jan 5 – Feb 3, 2026)
**Total episodes:** 42245 (talker: 8813, executor: 33432)
**Unique agents:** 24 talker, 40 executor (≥20 episodes each)

## Summary

| Metric | LLM Baseline | NN (Phase 4) | Delta | Target |
|--------|-------------|-------------|-------|--------|
| **H_b overall** | 0.5292 | 0.7658 | +0.2366 | ≥ 0.80 |
| H_b talker | 0.5443 | 0.9428 | +0.3985 | |
| H_b executor | 0.5252 | 0.7192 | +0.1940 | |
| **D_cc overall** | 0.1497 | 0.4449 | +0.2952 | > 0.02 |
| D_cc talker | 0.1382 | 0.5719 | +0.4337 | |
| D_cc executor | 0.1612 | 0.3178 | +0.1566 | |

## NN Performance

| Metric | Talker | Executor |
|--------|--------|----------|
| Accuracy (all) | 41.7% | 31.8% |
| High-conf decisions (≥0.85) | 209 | 4498 |
| LLM fallback rate | 97.6% | 86.6% |

## D_cc Target Assessment

**Target: D_cc > 0.02**
**Result: MET** (actual: 0.4449)

## Methodology

### H_b (Behavioral Entropy)
Normalized Shannon entropy of the action distribution across the full population:
```
H_b = H(action_distribution) / log2(|action_set|)
```
Range [0, 1]. H_b = 1.0 means uniform action selection; H_b = 0 means all agents
pick the same action. Ref: Shannon 1948.

### D_cc (Cross-Class Behavioral Divergence)
Average pairwise Jensen-Shannon divergence between per-agent action distributions:
```
D_cc = mean(JSD(P_agent_i, P_agent_j)) for all agent pairs i ≠ j
```
Range [0, 1]. D_cc = 0 means all agents have identical behavior distributions;
D_cc > 0.02 indicates meaningful behavioral differentiation. Ref: Lin 1991, Bedau et al. 2000.

Only agents with ≥ 20 episodes are included to avoid noise from
low-sample-size distributions.

### Pre-Phase 4 Baseline
Computed from LLM (Qwen-3-32B via Cerebras) decisions recorded in prompt logs.
These are the teacher actions that the NN was distilled from.

### Post-Phase 4 (NN)
Computed by running the trained TalkerNN (~73K params) and ExecutorNN (~279K params)
on the same feature vectors that produced the LLM baseline. This measures what the
NN would have decided in the same situations.

## Per-Agent Breakdown (Top 10)

| Agent | Episodes | Top Actions |
|-------|----------|-------------|
| Robin | 3110 | plan_build:1054, till:1043, talk:478, gather:424, explore:24 |
| Ivy | 2821 | talk:1082, plan_build:888, set_group_goal:224, gather:211, explore:176 |
| Luna | 2654 | till:1400, plan_build:726, talk:229, gather:158, call_meeting:77 |
| Briar | 2454 | till:1635, plan_build:328, gather:271, explore:145, talk:39 |
| Hazel | 2401 | till:1679, talk:431, plan_build:149, gather:76, call_meeting:27 |
| Pebble | 2282 | plan_build:566, talk:456, till:377, gather:366, set_personal_goal:240 |
| Orion | 1953 | till:1580, plan_build:254, gather:71, talk:15, plant:15 |
| Clay | 1865 | talk:551, plan_build:485, set_group_goal:320, gather:243, set_personal_goal:131 |
| Juniper | 1641 | plan_build:453, talk:440, set_personal_goal:273, gather:129, set_group_goal:96 |
| Kestrel | 1635 | gather:493, talk:353, set_group_goal:280, plan_build:226, set_personal_goal:200 |

## References

- Shannon, C. E. (1948). A mathematical theory of communication.
- Lin, J. (1991). Divergence measures based on the Shannon entropy. IEEE Trans. Info. Theory.
- Bedau, M. A. et al. (2000). Open problems in artificial life. Artificial Life.
- Rusu, A. et al. (2015). Policy distillation. arXiv:1511.06295.
- Ross, S. et al. (2011). A reduction of imitation learning to no-regret online learning. AISTATS.
