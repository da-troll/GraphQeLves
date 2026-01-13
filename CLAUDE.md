# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GraphQeLves is a Chrome DevTools extension for inspecting and debugging GraphQL network requests. It captures real-time GraphQL traffic and provides request/response inspection, filtering, and batch export functionality.

## Build Commands

```bash
npm run dev       # Start Vite dev server with hot reload
npm run build     # TypeScript check + Vite production build → dist/
npm run preview   # Preview production build locally
```

## Loading the Extension

1. Run `npm run build`
2. Open `chrome://extensions/` with Developer mode enabled
3. Click "Load unpacked" and select the `dist/` folder

## Architecture

**Data Flow:**
```
Chrome DevTools Network API
        ↓
useNetworkMonitor hook (src/hooks/) — parses GraphQL payloads, filters requests
        ↓
Zustand store (src/store.ts) — manages events, selection, filters
        ↓
React components (src/components/) — EventList (left), DetailPane (right)
```

**Key Entry Points:**
- `src/devtools.ts` — Registers the Chrome DevTools panel
- `src/App.tsx` — Main React component with split pane layout
- `manifest.json` — Chrome extension manifest (V3)

**Dual Build Outputs:**
- `index.html` — Main DevTools panel UI
- `devtools.html` — DevTools loader that creates the panel

## Key Implementation Details

**GraphQL Parsing (src/utils/parsing.ts):**
- Extracts operations from JSON and multipart request bodies
- Detects operation types from query prefix (query/mutation/subscription)
- Identifies persisted queries via `extensions.persistedQuery`
- Supports batched GraphQL requests (multiple operations per HTTP request)

**Store State (src/store.ts):**
- `events: NetworkEvent[]` — All captured GraphQL requests
- `selectedEventIds: Set<string>` — Multi-select support
- `filter` — Operation type filter (all/query/mutation/subscription/persisted)
- `columnVisibility` — Numeric toggle (0=both, 1=time, 2=none, 3=size)

**Export & Security (src/utils/export.ts):**
- Creates JSON bundles with cURL commands
- Redacts sensitive headers: authorization, cookie, x-api-key, api-key, set-cookie

**Development Mode:**
When `chrome.devtools` API is unavailable, `useNetworkMonitor.ts` generates mock GraphQL events every 3 seconds for local development without loading as extension.

## Tech Stack

- React 18 + TypeScript (strict mode)
- Vite 5 (dual entry points configured in vite.config.ts)
- Tailwind CSS with custom GraphQL type colors (query=green, mutation=blue, subscription=purple, persisted=amber)
- Zustand for state management
- react-virtuoso for virtual scrolling
- react-syntax-highlighter for code display
