<!-- OPENSPEC:START -->
# Project Instructions for AI Assistants

These instructions are for AI assistants working in this project.

## 🚨 CRITICAL: Technical Standards Compliance

**Before writing ANY code, you MUST read:** [openspec/TECHNICAL_STANDARDS.md](openspec/TECHNICAL_STANDARDS.md)

### Mandatory Requirements

1. **AI Integration**: All AI/model interactions MUST use Vercel AI SDK
   - Use `generateText`, `streamText`, or framework hooks (`useChat`, `useCompletion`)
   - NEVER directly call AI APIs (OpenAI, Anthropic, MiniMax, etc.)
   - Import from `ai` or `@ai-sdk/vue` packages

2. **Frontend**: Vue 3 + TypeScript + Composition API
3. **Backend**: Supabase (Auth, PostgreSQL, Realtime, Storage)
4. **UI Components**: TDesign Vue Next

See [TECHNICAL_STANDARDS.md](openspec/TECHNICAL_STANDARDS.md) for complete requirements.

---

# OpenSpec Instructions

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->