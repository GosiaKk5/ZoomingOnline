# Services

Domain and application logic that may orchestrate stores, browser APIs, and IO.

- Own business rules and policies (e.g., zoom calculations, URL sync)
- May read/write Svelte stores and use browser APIs (window/history)
- No DOM rendering or Svelte component imports
- Can depend on utils (pure helpers), but not on components
