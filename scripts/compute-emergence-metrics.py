#!/usr/bin/env python3
"""
Compute emergence metrics D_cc and H_b from MVEE episode data.

D_cc (cross-class behavioral divergence):
  Average Jensen-Shannon divergence between per-agent action distributions.
  Measures whether different agents (species analogs) behave differently.
  Range: [0, 1]. Higher = more behavioral differentiation.

H_b (behavioral entropy):
  Normalized Shannon entropy of the overall action distribution.
  Measures action diversity across the population.
  Range: [0, 1]. Higher = more diverse behavior.

Usage:
  python3 scripts/compute-emergence-metrics.py \
    --logs-dir custom_game_engine/logs/llm-prompts \
    --weights-dir training/weights \
    --output docs/phase4-emergence-results-2026-03-15.md

References:
  Shannon 1948 (H_b entropy definition)
  Bedau et al. 2000 (emergence framing for artificial life)
  Lin 1991 (Jensen-Shannon divergence)

Cite: D_cc metric introduced in this work for measuring cross-species
behavioral divergence in LLM-driven game AI populations.

Input format (JSONL, one entry per line):
  {
    "prompt": "You are Oak, a villager...",    # LLM prompt with agent identity
    "responseText": "{\"action\": {\"type\": \"gather\", ...}}", # LLM JSON response
    "timestamp": 1767598849179
  }

Output:
  - Markdown results file with comparison table
  - JSON metrics file with all computed values

License: MIT
Copyright (c) 2026 Multiverse Studios
"""

import argparse
import json
import math
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

# Add training dir to path for imports
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(REPO_ROOT / 'training'))

from feature_extractor import (
    extract_features, identify_layer, FEATURE_DIM,
    TALKER_ACTIONS, EXECUTOR_ACTIONS,
    TALKER_ACTION_INDEX, EXECUTOR_ACTION_INDEX,
)
from model import TalkerNN, ExecutorNN

# Minimum episodes per agent to include in D_cc calculation
MIN_AGENT_EPISODES = 20

# Agent names to exclude (false positives from prompt parsing)
AGENT_NAME_BLOCKLIST = {'The', 'cold', 'hungry', 'Builder', 'Pat', 'Sam'}


# ---------------------------------------------------------------------------
# Entropy and divergence functions
# ---------------------------------------------------------------------------

def shannon_entropy(distribution: dict[str, float]) -> float:
    """H = -sum(p * log2(p)) for non-zero probabilities."""
    h = 0.0
    for p in distribution.values():
        if p > 0:
            h -= p * math.log2(p)
    return h


def normalize_distribution(counts: dict[str, int], action_set: list[str]) -> dict[str, float]:
    """Convert counts to probability distribution over full action set."""
    total = sum(counts.values())
    if total == 0:
        return {a: 0.0 for a in action_set}
    return {a: counts.get(a, 0) / total for a in action_set}


def kl_divergence(p: dict[str, float], q: dict[str, float]) -> float:
    """KL(P || Q) with smoothing to avoid log(0)."""
    eps = 1e-10
    kl = 0.0
    for k in p:
        pk = max(p[k], eps)
        qk = max(q.get(k, 0), eps)
        kl += pk * math.log2(pk / qk)
    return kl


def jensen_shannon_divergence(p: dict[str, float], q: dict[str, float]) -> float:
    """JSD(P || Q) = 0.5 * KL(P||M) + 0.5 * KL(Q||M), M = (P+Q)/2."""
    m = {k: (p.get(k, 0) + q.get(k, 0)) / 2.0 for k in set(p) | set(q)}
    return 0.5 * kl_divergence(p, m) + 0.5 * kl_divergence(q, m)


def compute_h_b(action_counts: dict[str, int], action_set: list[str]) -> float:
    """Normalized behavioral entropy H_b in [0, 1]."""
    dist = normalize_distribution(action_counts, action_set)
    h = shannon_entropy(dist)
    h_max = math.log2(len(action_set)) if len(action_set) > 1 else 1.0
    return h / h_max


def compute_d_cc(
    per_agent_counts: dict[str, dict[str, int]],
    action_set: list[str],
) -> float:
    """
    Cross-class divergence: average pairwise JSD across agents.
    Only includes agents with >= MIN_AGENT_EPISODES episodes.
    """
    # Filter agents with enough data
    agents = [
        a for a, counts in per_agent_counts.items()
        if sum(counts.values()) >= MIN_AGENT_EPISODES
    ]
    if len(agents) < 2:
        return 0.0

    distributions = {
        a: normalize_distribution(per_agent_counts[a], action_set)
        for a in agents
    }

    total_jsd = 0.0
    n_pairs = 0
    for i, a1 in enumerate(agents):
        for a2 in agents[i + 1:]:
            jsd = jensen_shannon_divergence(distributions[a1], distributions[a2])
            total_jsd += jsd
            n_pairs += 1

    return total_jsd / n_pairs if n_pairs > 0 else 0.0


# ---------------------------------------------------------------------------
# LLM prompt log parsing
# ---------------------------------------------------------------------------

def extract_agent_name(prompt: str) -> str | None:
    """Extract agent name from MVEE LLM prompt."""
    m = re.search(r'You are (\w+),', prompt)
    if m:
        name = m.group(1)
        if name not in AGENT_NAME_BLOCKLIST:
            return name
    return None


def parse_action_from_response(response_text: str) -> dict | None:
    """Extract action from LLM JSON response."""
    try:
        parsed = json.loads(response_text)
        action = parsed.get('action', {})
        if isinstance(action, dict) and action.get('type'):
            return action
        if isinstance(action, str):
            return {'type': action}
    except (json.JSONDecodeError, AttributeError):
        pass
    return None


def parse_llm_logs(logs_dir: Path) -> tuple[list[dict], int]:
    """
    Parse raw LLM prompt logs.
    Returns (episodes, total_entries) where each episode has:
      agent_name, layer, action_type, feature_vector
    """
    log_files = sorted(logs_dir.glob('llm-prompts-*.jsonl'))
    if not log_files:
        print(f'ERROR: No log files in {logs_dir}', file=sys.stderr)
        return [], 0

    episodes = []
    total = 0

    for filepath in log_files:
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                total += 1
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue

                prompt = entry.get('prompt', '')
                response_text = entry.get('responseText', '')
                if not prompt or not response_text:
                    continue

                agent_name = extract_agent_name(prompt)
                if not agent_name:
                    continue

                action = parse_action_from_response(response_text)
                if not action:
                    continue

                action_type = action.get('type', '')
                layer = identify_layer(prompt)

                if layer == 'talker' and action_type in TALKER_ACTION_INDEX:
                    feature_vector = extract_features(prompt)
                    episodes.append({
                        'agent_name': agent_name,
                        'layer': layer,
                        'action_type': action_type,
                        'feature_vector': feature_vector,
                    })
                elif layer == 'executor' and action_type in EXECUTOR_ACTION_INDEX:
                    feature_vector = extract_features(prompt)
                    episodes.append({
                        'agent_name': agent_name,
                        'layer': layer,
                        'action_type': action_type,
                        'feature_vector': feature_vector,
                    })
                elif layer == 'unknown' and action_type in EXECUTOR_ACTION_INDEX:
                    # Many prompts don't match layer patterns but are executor-like
                    feature_vector = extract_features(prompt)
                    episodes.append({
                        'agent_name': agent_name,
                        'layer': 'executor',
                        'action_type': action_type,
                        'feature_vector': feature_vector,
                    })

    return episodes, total


# ---------------------------------------------------------------------------
# NN inference (PyTorch-accelerated batch inference)
# ---------------------------------------------------------------------------

try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False


def load_nn_model_torch(weights_path: Path, model_class):
    """Load NN weights JSON into a PyTorch model for fast batch inference."""
    with open(weights_path) as f:
        data = json.load(f)

    model = model_class()
    state_dict = {}
    for key, val in data['weights'].items():
        state_dict[key] = torch.tensor(val, dtype=torch.float32)
    model.load_state_dict(state_dict)
    model.eval()
    return model, data['actions']


def nn_batch_predict(
    feature_vectors: list[list[float]],
    model,
    actions: list[str],
) -> list[tuple[str, float]]:
    """Batch inference using PyTorch. Returns list of (action, confidence)."""
    if not feature_vectors:
        return []
    x = torch.tensor(feature_vectors, dtype=torch.float32)
    with torch.no_grad():
        logits = model(x)
        probs = torch.softmax(logits, dim=-1)
        confidences, indices = probs.max(dim=-1)
    return [
        (actions[idx.item()], conf.item())
        for idx, conf in zip(indices, confidences)
    ]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description='Compute D_cc and H_b emergence metrics')
    parser.add_argument('--logs-dir', default=str(REPO_ROOT / 'custom_game_engine/logs/llm-prompts'))
    parser.add_argument('--weights-dir', default=str(REPO_ROOT / 'training/weights'))
    parser.add_argument('--output', default=None, help='Output markdown file path')
    args = parser.parse_args()

    logs_dir = Path(args.logs_dir)
    weights_dir = Path(args.weights_dir)

    print('=' * 60)
    print('MVEE Emergence Metrics: D_cc and H_b')
    print('=' * 60)

    # --- Step 1: Parse LLM prompt logs ---
    print('\n--- Parsing LLM prompt logs ---')
    episodes, total_entries = parse_llm_logs(logs_dir)
    print(f'Total log entries: {total_entries}')
    print(f'Parsed episodes with agent identity: {len(episodes)}')

    talker_episodes = [e for e in episodes if e['layer'] == 'talker']
    executor_episodes = [e for e in episodes if e['layer'] == 'executor']
    print(f'  Talker: {len(talker_episodes)}')
    print(f'  Executor: {len(executor_episodes)}')

    # --- Step 2: Compute LLM baseline metrics ---
    print('\n--- LLM Baseline (pre-distillation) ---')

    # Per-agent action counts for LLM decisions
    llm_talker_by_agent: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    llm_executor_by_agent: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    llm_talker_total: dict[str, int] = defaultdict(int)
    llm_executor_total: dict[str, int] = defaultdict(int)

    for ep in talker_episodes:
        llm_talker_by_agent[ep['agent_name']][ep['action_type']] += 1
        llm_talker_total[ep['action_type']] += 1

    for ep in executor_episodes:
        llm_executor_by_agent[ep['agent_name']][ep['action_type']] += 1
        llm_executor_total[ep['action_type']] += 1

    llm_h_b_talker = compute_h_b(llm_talker_total, TALKER_ACTIONS)
    llm_h_b_executor = compute_h_b(llm_executor_total, EXECUTOR_ACTIONS)
    llm_h_b_overall = (llm_h_b_talker * len(talker_episodes) + llm_h_b_executor * len(executor_episodes)) / max(len(episodes), 1)

    llm_d_cc_talker = compute_d_cc(dict(llm_talker_by_agent), TALKER_ACTIONS)
    llm_d_cc_executor = compute_d_cc(dict(llm_executor_by_agent), EXECUTOR_ACTIONS)
    llm_d_cc_overall = (llm_d_cc_talker + llm_d_cc_executor) / 2.0

    print(f'H_b (overall):  {llm_h_b_overall:.4f}')
    print(f'H_b (talker):   {llm_h_b_talker:.4f}')
    print(f'H_b (executor): {llm_h_b_executor:.4f}')
    print(f'D_cc (overall): {llm_d_cc_overall:.4f}')
    print(f'D_cc (talker):  {llm_d_cc_talker:.4f}')
    print(f'D_cc (executor):{llm_d_cc_executor:.4f}')

    # Agent counts
    talker_agents = [a for a, c in llm_talker_by_agent.items() if sum(c.values()) >= MIN_AGENT_EPISODES]
    executor_agents = [a for a, c in llm_executor_by_agent.items() if sum(c.values()) >= MIN_AGENT_EPISODES]
    print(f'Agents with >= {MIN_AGENT_EPISODES} episodes: talker={len(talker_agents)}, executor={len(executor_agents)}')

    # --- Step 3: Load NNs and compute post-Phase 4 metrics ---
    print('\n--- Post-Phase 4 (NN distillation) ---')

    talker_weights_path = weights_dir / 'talker_nn.json'
    executor_weights_path = weights_dir / 'executor_nn.json'

    nn_talker_by_agent: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    nn_executor_by_agent: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    nn_talker_total: dict[str, int] = defaultdict(int)
    nn_executor_total: dict[str, int] = defaultdict(int)

    nn_talker_correct = 0
    nn_executor_correct = 0
    nn_talker_high_conf = 0
    nn_executor_high_conf = 0
    nn_talker_high_conf_correct = 0
    nn_executor_high_conf_correct = 0

    if not HAS_TORCH:
        print('ERROR: PyTorch not available. Cannot run NN inference.')
        sys.exit(1)

    if talker_weights_path.exists():
        talker_model, talker_actions = load_nn_model_torch(talker_weights_path, TalkerNN)
        print(f'Loaded TalkerNN weights ({talker_weights_path.stat().st_size / 1024:.1f} KB)')

        fvs = [ep['feature_vector'] for ep in talker_episodes]
        predictions = nn_batch_predict(fvs, talker_model, talker_actions)
        for ep, (predicted_action, confidence) in zip(talker_episodes, predictions):
            nn_talker_by_agent[ep['agent_name']][predicted_action] += 1
            nn_talker_total[predicted_action] += 1
            if predicted_action == ep['action_type']:
                nn_talker_correct += 1
            if confidence >= 0.85:
                nn_talker_high_conf += 1
                if predicted_action == ep['action_type']:
                    nn_talker_high_conf_correct += 1
    else:
        print(f'WARNING: {talker_weights_path} not found')

    if executor_weights_path.exists():
        executor_model, executor_actions = load_nn_model_torch(executor_weights_path, ExecutorNN)
        print(f'Loaded ExecutorNN weights ({executor_weights_path.stat().st_size / 1024:.1f} KB)')

        fvs = [ep['feature_vector'] for ep in executor_episodes]
        predictions = nn_batch_predict(fvs, executor_model, executor_actions)
        for ep, (predicted_action, confidence) in zip(executor_episodes, predictions):
            nn_executor_by_agent[ep['agent_name']][predicted_action] += 1
            nn_executor_total[predicted_action] += 1
            if predicted_action == ep['action_type']:
                nn_executor_correct += 1
            if confidence >= 0.85:
                nn_executor_high_conf += 1
                if predicted_action == ep['action_type']:
                    nn_executor_high_conf_correct += 1
    else:
        print(f'WARNING: {executor_weights_path} not found')

    nn_h_b_talker = compute_h_b(nn_talker_total, TALKER_ACTIONS) if nn_talker_total else 0.0
    nn_h_b_executor = compute_h_b(nn_executor_total, EXECUTOR_ACTIONS) if nn_executor_total else 0.0
    nn_h_b_overall = (nn_h_b_talker * len(talker_episodes) + nn_h_b_executor * len(executor_episodes)) / max(len(episodes), 1)

    nn_d_cc_talker = compute_d_cc(dict(nn_talker_by_agent), TALKER_ACTIONS) if nn_talker_by_agent else 0.0
    nn_d_cc_executor = compute_d_cc(dict(nn_executor_by_agent), EXECUTOR_ACTIONS) if nn_executor_by_agent else 0.0
    nn_d_cc_overall = (nn_d_cc_talker + nn_d_cc_executor) / 2.0

    talker_acc = nn_talker_correct / max(len(talker_episodes), 1)
    executor_acc = nn_executor_correct / max(len(executor_episodes), 1)
    talker_hc_acc = nn_talker_high_conf_correct / max(nn_talker_high_conf, 1)
    executor_hc_acc = nn_executor_high_conf_correct / max(nn_executor_high_conf, 1)

    # LLM fallback rate: % of decisions below 0.85 confidence threshold
    talker_fallback_rate = 1.0 - (nn_talker_high_conf / max(len(talker_episodes), 1))
    executor_fallback_rate = 1.0 - (nn_executor_high_conf / max(len(executor_episodes), 1))

    print(f'H_b (overall):  {nn_h_b_overall:.4f}')
    print(f'H_b (talker):   {nn_h_b_talker:.4f}')
    print(f'H_b (executor): {nn_h_b_executor:.4f}')
    print(f'D_cc (overall): {nn_d_cc_overall:.4f}')
    print(f'D_cc (talker):  {nn_d_cc_talker:.4f}')
    print(f'D_cc (executor):{nn_d_cc_executor:.4f}')
    print(f'NN accuracy (talker):   {talker_acc:.3f} ({nn_talker_correct}/{len(talker_episodes)})')
    print(f'NN accuracy (executor): {executor_acc:.3f} ({nn_executor_correct}/{len(executor_episodes)})')
    print(f'High-conf (≥0.85) talker:   {nn_talker_high_conf}/{len(talker_episodes)} ({1-talker_fallback_rate:.1%} NN, {talker_fallback_rate:.1%} LLM fallback)')
    print(f'High-conf (≥0.85) executor: {nn_executor_high_conf}/{len(executor_episodes)} ({1-executor_fallback_rate:.1%} NN, {executor_fallback_rate:.1%} LLM fallback)')
    if nn_talker_high_conf > 0:
        print(f'High-conf accuracy (talker):   {talker_hc_acc:.3f}')
    if nn_executor_high_conf > 0:
        print(f'High-conf accuracy (executor): {executor_hc_acc:.3f}')

    # --- Step 4: Comparison summary ---
    print('\n--- Comparison: LLM vs NN ---')
    print(f'{"Metric":<25} {"LLM (baseline)":>15} {"NN (Phase 4)":>15} {"Delta":>10}')
    print('-' * 67)
    print(f'{"H_b overall":<25} {llm_h_b_overall:>15.4f} {nn_h_b_overall:>15.4f} {nn_h_b_overall - llm_h_b_overall:>+10.4f}')
    print(f'{"H_b talker":<25} {llm_h_b_talker:>15.4f} {nn_h_b_talker:>15.4f} {nn_h_b_talker - llm_h_b_talker:>+10.4f}')
    print(f'{"H_b executor":<25} {llm_h_b_executor:>15.4f} {nn_h_b_executor:>15.4f} {nn_h_b_executor - llm_h_b_executor:>+10.4f}')
    print(f'{"D_cc overall":<25} {llm_d_cc_overall:>15.4f} {nn_d_cc_overall:>15.4f} {nn_d_cc_overall - llm_d_cc_overall:>+10.4f}')
    print(f'{"D_cc talker":<25} {llm_d_cc_talker:>15.4f} {nn_d_cc_talker:>15.4f} {nn_d_cc_talker - llm_d_cc_talker:>+10.4f}')
    print(f'{"D_cc executor":<25} {llm_d_cc_executor:>15.4f} {nn_d_cc_executor:>15.4f} {nn_d_cc_executor - llm_d_cc_executor:>+10.4f}')

    d_cc_target = 0.02
    d_cc_met = nn_d_cc_overall > d_cc_target
    print(f'\nTarget D_cc > {d_cc_target}: {"MET" if d_cc_met else "NOT MET"} (actual: {nn_d_cc_overall:.4f})')

    # --- Step 5: Per-agent breakdown ---
    print('\n--- Per-Agent Action Distribution (top agents by episode count) ---')
    all_agents = set(llm_talker_by_agent.keys()) | set(llm_executor_by_agent.keys())
    agent_totals = {
        a: sum(llm_talker_by_agent.get(a, {}).values()) + sum(llm_executor_by_agent.get(a, {}).values())
        for a in all_agents
    }
    top_agents = sorted(agent_totals, key=agent_totals.get, reverse=True)[:10]
    for agent in top_agents:
        total = agent_totals[agent]
        t_counts = dict(llm_talker_by_agent.get(agent, {}))
        e_counts = dict(llm_executor_by_agent.get(agent, {}))
        top_actions = sorted(
            {**t_counts, **e_counts}.items(),
            key=lambda x: -x[1]
        )[:5]
        actions_str = ', '.join(f'{a}:{c}' for a, c in top_actions)
        print(f'  {agent:12s} ({total:4d} eps): {actions_str}')

    # --- Output results ---
    results = {
        'llm_baseline': {
            'h_b_overall': round(llm_h_b_overall, 4),
            'h_b_talker': round(llm_h_b_talker, 4),
            'h_b_executor': round(llm_h_b_executor, 4),
            'd_cc_overall': round(llm_d_cc_overall, 4),
            'd_cc_talker': round(llm_d_cc_talker, 4),
            'd_cc_executor': round(llm_d_cc_executor, 4),
            'total_episodes': len(episodes),
            'talker_episodes': len(talker_episodes),
            'executor_episodes': len(executor_episodes),
            'agents_with_sufficient_data_talker': len(talker_agents),
            'agents_with_sufficient_data_executor': len(executor_agents),
        },
        'nn_phase4': {
            'h_b_overall': round(nn_h_b_overall, 4),
            'h_b_talker': round(nn_h_b_talker, 4),
            'h_b_executor': round(nn_h_b_executor, 4),
            'd_cc_overall': round(nn_d_cc_overall, 4),
            'd_cc_talker': round(nn_d_cc_talker, 4),
            'd_cc_executor': round(nn_d_cc_executor, 4),
            'talker_accuracy': round(talker_acc, 4),
            'executor_accuracy': round(executor_acc, 4),
            'talker_high_conf_count': nn_talker_high_conf,
            'executor_high_conf_count': nn_executor_high_conf,
            'talker_fallback_rate': round(talker_fallback_rate, 4),
            'executor_fallback_rate': round(executor_fallback_rate, 4),
            'd_cc_target_met': d_cc_met,
        },
    }

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        _write_results_md(output_path, results, top_agents, agent_totals,
                          llm_talker_by_agent, llm_executor_by_agent)
        print(f'\nResults written to {output_path}')

    # Also write JSON
    json_path = weights_dir / 'emergence_metrics.json'
    with open(json_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f'JSON metrics saved to {json_path}')

    return results


def _write_results_md(
    path: Path,
    results: dict,
    top_agents: list[str],
    agent_totals: dict[str, int],
    llm_talker_by_agent: dict,
    llm_executor_by_agent: dict,
):
    """Write results as markdown for the paper."""
    llm = results['llm_baseline']
    nn = results['nn_phase4']

    md = f"""# Phase 4 Emergence Metrics: D_cc and H_b

**Date:** 2026-03-15
**Computed by:** ML Engineer (ed7bfa0d)
**Data source:** MVEE LLM prompt logs (Jan 5 – Feb 3, 2026)
**Total episodes:** {llm['total_episodes']} (talker: {llm['talker_episodes']}, executor: {llm['executor_episodes']})
**Unique agents:** {llm['agents_with_sufficient_data_talker']} talker, {llm['agents_with_sufficient_data_executor']} executor (≥{MIN_AGENT_EPISODES} episodes each)

## Summary

| Metric | LLM Baseline | NN (Phase 4) | Delta | Target |
|--------|-------------|-------------|-------|--------|
| **H_b overall** | {llm['h_b_overall']:.4f} | {nn['h_b_overall']:.4f} | {nn['h_b_overall'] - llm['h_b_overall']:+.4f} | ≥ 0.80 |
| H_b talker | {llm['h_b_talker']:.4f} | {nn['h_b_talker']:.4f} | {nn['h_b_talker'] - llm['h_b_talker']:+.4f} | |
| H_b executor | {llm['h_b_executor']:.4f} | {nn['h_b_executor']:.4f} | {nn['h_b_executor'] - llm['h_b_executor']:+.4f} | |
| **D_cc overall** | {llm['d_cc_overall']:.4f} | {nn['d_cc_overall']:.4f} | {nn['d_cc_overall'] - llm['d_cc_overall']:+.4f} | > 0.02 |
| D_cc talker | {llm['d_cc_talker']:.4f} | {nn['d_cc_talker']:.4f} | {nn['d_cc_talker'] - llm['d_cc_talker']:+.4f} | |
| D_cc executor | {llm['d_cc_executor']:.4f} | {nn['d_cc_executor']:.4f} | {nn['d_cc_executor'] - llm['d_cc_executor']:+.4f} | |

## NN Performance

| Metric | Talker | Executor |
|--------|--------|----------|
| Accuracy (all) | {nn['talker_accuracy']:.1%} | {nn['executor_accuracy']:.1%} |
| High-conf decisions (≥0.85) | {nn['talker_high_conf_count']} | {nn['executor_high_conf_count']} |
| LLM fallback rate | {nn['talker_fallback_rate']:.1%} | {nn['executor_fallback_rate']:.1%} |

## D_cc Target Assessment

**Target: D_cc > 0.02**
**Result: {'MET' if nn['d_cc_target_met'] else 'NOT MET'}** (actual: {nn['d_cc_overall']:.4f})

"""

    if not nn['d_cc_target_met']:
        md += """### Diagnosis

The NN D_cc is near-zero because the 40-dimensional feature vector does not include
agent identity or species encoding. The NN learns a single population-average policy:
given the same state (priorities, resources, mood, skills), it produces the same
action distribution regardless of which agent is deciding.

The LLM achieves higher D_cc because each prompt includes the agent's name,
personality description, and unique backstory — information the NN never sees.

**Remediation path:**
1. Add agent/species one-hot encoding or embedding to the feature vector (Phase 5)
2. Stratify training data to ensure each agent type has adequate representation
3. Retrain with species-aware architecture (species embedding → concat with features)

This confirms the Research PM's pre-Phase 4 prediction: without species encoding,
D_cc stays near the baseline of 0.0047.

"""

    md += f"""## Methodology

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

Only agents with ≥ {MIN_AGENT_EPISODES} episodes are included to avoid noise from
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
"""
    for agent in top_agents:
        total = agent_totals[agent]
        t_counts = dict(llm_talker_by_agent.get(agent, {}))
        e_counts = dict(llm_executor_by_agent.get(agent, {}))
        top_actions = sorted(
            {**t_counts, **e_counts}.items(),
            key=lambda x: -x[1]
        )[:5]
        actions_str = ', '.join(f'{a}:{c}' for a, c in top_actions)
        md += f'| {agent} | {total} | {actions_str} |\n'

    md += """
## References

- Shannon, C. E. (1948). A mathematical theory of communication.
- Lin, J. (1991). Divergence measures based on the Shannon entropy. IEEE Trans. Info. Theory.
- Bedau, M. A. et al. (2000). Open problems in artificial life. Artificial Life.
- Rusu, A. et al. (2015). Policy distillation. arXiv:1511.06295.
- Ross, S. et al. (2011). A reduction of imitation learning to no-regret online learning. AISTATS.
"""

    with open(path, 'w') as f:
        f.write(md)


if __name__ == '__main__':
    main()
