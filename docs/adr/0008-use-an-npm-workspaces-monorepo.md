# Use an npm workspaces monorepo

The repository will evolve into `apps/web`, `apps/room-worker`, `packages/game-core`, and `packages/online-protocol`, managed with npm workspaces. Keeping the current frontend root beside an ad hoc worker and splitting the backend into another repository were rejected because both make shared-rule versioning, architecture enforcement, and atomic protocol changes harder; neither application may duplicate or own game semantics.
