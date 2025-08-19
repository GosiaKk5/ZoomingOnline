# Stores

Svelte stores for application state. Keep them minimal and declarative.

- Hold reactive state and derived state only
- No business logic: call Services for calculations/policies
- Components interact via Actions (where orchestration lives)

Structure
- Flat layout: plotConfig.ts, zoomState.ts, derivedStores.ts, actions.ts live directly under `src/stores/`.
