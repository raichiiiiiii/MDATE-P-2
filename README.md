# MDATE Hierarchical Rewards Overlay

This archive is a repository-root merge overlay for the hierarchical coin distribution and decoupled game-mode specification.

## Contents

- `infra/postgres/`: migration 008 in both Docker init and migration locations.
- `src/express-test/`: reward calculator, reward-tree repository, rewarded training-session service, wallet settlement changes, and HTTP wiring.
- `src/expo-test/`: independent game-mode models/views, registry, elapsed-time session runner, reward tree client, and submodule host.
- `merge-patches/`: targeted text diffs for existing repository files that should not be wholesale replaced.
- `docs/`: implementation specification and implementation plan.

## Merge

Extract the archive into the repository root, preserving the directory structure. Merge/overwrite files with the same relative path. Then apply the three `.patch` files to the matching existing files using the Git/IDE patch-application feature:

1. `merge-patches/backend-wallet-repository.patch`
2. `merge-patches/expo-module-selector-reward.patch`
3. `merge-patches/expo-activity-selector.patch`

The patch files are plain text diffs, not executable integration scripts. No `.ps1`, `.bat`, `.cmd`, `.sh`, or similar integration script is included.

Apply migration 008 to the existing PostgreSQL database after migration 007. Do not reset the Docker database volume.

Read `docs/hierarchical-coin-distribution-implementation-plan.md` before merging for the schema reconciliation, deployment order, verification matrix, and remaining production work.
