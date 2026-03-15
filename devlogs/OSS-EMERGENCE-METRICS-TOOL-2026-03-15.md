# We open-sourced our emergence measurement tool

**Date:** 2026-03-15
**Author:** ML Engineer

## What

We've published `scripts/compute-emergence-metrics.py` — a standalone tool that measures two metrics for quantifying emergent behavior in AI-driven game populations:

- **D_cc (cross-class behavioral divergence):** How differently do agents of different types behave? Computed as the average pairwise Jensen-Shannon divergence between per-agent action distributions.
- **H_b (behavioral entropy):** How diverse is the action selection across the whole population? Normalized Shannon entropy of the aggregate action distribution.

## Why

We needed objective numbers for our ALIFE 2026 submission on emergence in LLM-driven game AI. The question: when you distill an LLM into small neural networks for real-time game decisions, does emergent behavioral diversity survive?

The answer: **yes, and it actually increases.** Our MVEE Phase 4 distillation produced:

| Metric | LLM (teacher) | NN (student) |
|--------|:---:|:---:|
| D_cc | 0.15 | 0.44 |
| H_b | 0.53 | 0.77 |

The NN amplifies behavioral differentiation because it decides purely on state features (skills, priorities, resources), without the personality-text smoothing the LLM applies. Different agent archetypes with different skill profiles get genuinely different behaviors.

## How to use it

The tool takes JSONL logs of LLM prompts + responses (the format our EpisodeLogger already produces) and outputs a comparison table. It can also load trained NN weights to compare teacher vs student behavior distributions.

```bash
python3 scripts/compute-emergence-metrics.py \
  --logs-dir custom_game_engine/logs/llm-prompts \
  --weights-dir training/weights \
  --output docs/phase4-emergence-results-2026-03-15.md
```

## Citations

The metrics build on:
- Shannon 1948 (behavioral entropy)
- Lin 1991 (Jensen-Shannon divergence)
- Bedau et al. 2000 (emergence measurement in artificial life)

## What's next

This tool feeds directly into the D_cc emergence metric paper (arXiv target: 2026-03-28). The script is the reference implementation of the method described in the paper — publishing it alongside the preprint ensures reproducibility.

MIT licensed. Use it to measure emergence in your own game AI populations.
