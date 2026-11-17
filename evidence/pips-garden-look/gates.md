# Gates — feat/pips-garden-look

## BLOCKED: sand upload bundles missing (round 2, 2026-11-17)

Kickoff requires:

```bash
mkdir -p ~/pstack && tar xzf uploads/pstack-skills.tar.gz -C ~/pstack
mkdir -p ~/garden-design && tar xzf uploads/garden-design-v3.tar.gz -C ~/garden-design
```

Paths searched (neither archive present):

- `/agent/repos/egm-looseleaf-experiment/uploads/pstack-skills.tar.gz`
- `/agent/repos/egm-looseleaf-experiment/uploads/garden-design-v3.tar.gz`
- `uploads/pstack-skills.tar.gz` (cwd `/agent` and repo root)
- `uploads/garden-design-v3.tar.gz` (cwd `/agent` and repo root)
- `/agent/uploads/`, `/workspace/uploads/`, `/home/ubuntu/uploads/`
- `find /agent /home/ubuntu /workspace /opt` for `pstack-skills.tar.gz`, `garden-design-v3.tar.gz`, `garden-design-v2.tar.gz`, and any `uploads/*.tar.gz` under the repo

**Impact**

- Visual spec `~/garden-design/design/garden-map-demo/garden.html` and baseline generation (`verify.mjs`, `shot-map.mjs`) cannot run.
- Emil animation skills under `~/garden-design/skills/` are unavailable.
- Acceptance §1–2 (baseline commit before visual change; ≤1% pixel diff) cannot start.
- `~/pstack/skills/poteto-mode/worker.md` not on disk; poteto-mode playbook requires extracted pstack bundle (partial copy exists only in Cursor plugin cache, not a substitute per brief).

**Workaround for operator**

1. Attach `pstack-skills.tar.gz` and `garden-design-v3.tar.gz` to the cloud agent run (or place both under `/agent/repos/egm-looseleaf-experiment/uploads/`) and re-run this brief.
2. Confirm post-extract: `~/garden-design/design/garden-map-demo/garden.html` and `~/pstack/skills/poteto-mode/SKILL.md` exist.

**No pause items** for deploy, force-push to shared branches, data deletion, or customer messages besides this gate.
