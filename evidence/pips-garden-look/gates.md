# Gates — feat/pips-garden-look

## BLOCKED: sand upload bundles missing (2026-11-17)

Kickoff requires:

```bash
mkdir -p ~/pstack && tar xzf uploads/pstack-skills.tar.gz -C ~/pstack
mkdir -p ~/garden-design && tar xzf uploads/garden-design-v2.tar.gz -C ~/garden-design
```

Neither `uploads/pstack-skills.tar.gz` nor `uploads/garden-design-v2.tar.gz` exists on this runner (searched `/workspace/uploads`, `/agent/uploads`, `/home/ubuntu/uploads`, and full-system `find` for `*.tar.gz`).

**Impact**

- Visual spec `~/garden-design/design/garden-map-demo/garden.html` and `shots/` baselines cannot be read or committed.
- Emil animation skills under `~/garden-design/skills/` are unavailable.
- Acceptance §1–2 (baseline commit before visual change; ≤1% pixel diff) cannot start.

**Workaround for operator**

1. Re-attach `pstack-skills.tar.gz` and `garden-design-v2.tar.gz` to the sand agent (or place under `uploads/` in the repo workspace) and re-run this brief.
2. pstack skills were partially recovered from the Cursor pstack plugin cache at `~/pstack/skills/` (not identical to the tarball).

**No pause items** for deploy, force-push to shared branches, data deletion, or customer messages besides this gate.
