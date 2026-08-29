"use strict";
/**
 * Model catalog — typed access to model-catalog.json.
 *
 * ADR-457 build-at-publish: the hand-written bin/lib/model-catalog.cjs
 * collapsed to a TypeScript source of truth. Behaviour is preserved
 * byte-for-behaviour from the prior hand-written .cjs; only types are added.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RUNTIMES_WITH_FAST_MODE = exports.EFFORT_ARGV = exports.EFFORT_RENDERING = exports.CLAUDE_AGENT_ALIASES = exports.KNOWN_PROVIDERS = exports.PROVIDER_PRESETS = exports.RUNTIMES_WITH_REASONING_EFFORT = exports.KNOWN_RUNTIMES = exports.RUNTIME_PROFILE_MAP = exports.MODEL_ALIAS_MAP = exports.AGENT_DEFAULT_TIERS = exports.AGENT_TO_PHASE_TYPE = exports.MODEL_PROFILES = exports.ADAPTIVE_TIER_VALUES = exports.VALID_TIERS = exports.VALID_AGENT_TIERS = exports.VALID_PHASE_TYPES = exports.VALID_PROFILES = exports.catalog = void 0;
exports.isAnthropicFlavoredModel = isAnthropicFlavoredModel;
exports.nextTier = nextTier;
exports.formatAgentToModelMapAsTable = formatAgentToModelMapAsTable;
exports.getAgentToModelMapForProfile = getAgentToModelMapForProfile;
exports.renderEffortArgv = renderEffortArgv;
exports.renderEffortForRuntime = renderEffortForRuntime;
exports.mergeEffortTierDefaults = mergeEffortTierDefaults;
const node_path_1 = __importDefault(require("node:path"));
// In .cts (CommonJS output) files, `require` is available as a global;
// we use it directly to load JSON candidates.
const _require = require;
// Resolve model-catalog.json via a prioritised candidate list so the module
// works in every layout:
//
//   1. Co-located install path — gsd-core/bin/shared/model-catalog.json
//   2. GSD_MODEL_CATALOG env override
//
// A third candidate — `sdk/shared/model-catalog.json`, three levels up — used to
// sit between them. It was the legacy source-repo path kept as a fallback by the
// #3288 fix, whose contract was "check the co-located path FIRST, before the
// legacy source-repo path". ADR-0174 then retired the `@opengsd/gsd-sdk` package
// boundary and deleted the `sdk/` tree outright, so that candidate can no longer
// resolve in any layout: in a source repo there is no `sdk/`, and in an install
// layout it points at `~/.claude/sdk/shared/`, which the installer never writes
// (the original #3288 bug). It is removed rather than left as dead weight that
// implies a package boundary this repo no longer has.
const _catalogCandidates = [
    node_path_1.default.resolve(__dirname, '..', 'shared', 'model-catalog.json'),
    ...(process.env['GSD_MODEL_CATALOG'] ? [node_path_1.default.resolve(process.env['GSD_MODEL_CATALOG'])] : []),
];
let catalog = null;
let _catalogLastErr = null;
for (const _p of _catalogCandidates) {
    try {
        catalog = _require(_p);
        break;
    }
    catch (e) {
        const isMissingCandidate = (e && e.code === 'MODULE_NOT_FOUND' && String(e.message || '').includes(_p)) ||
            (e && e.code === 'ENOENT');
        if (!isMissingCandidate)
            throw e;
        _catalogLastErr = e;
    }
}
if (!catalog) {
    throw new Error(`model-catalog.json not found. Tried:\n${_catalogCandidates.map((p) => `  ${p}`).join('\n')}\nLast error: ${_catalogLastErr?.message}`);
}
// After the throw guard above, catalog is guaranteed non-null.
const _catalog = catalog;
exports.catalog = _catalog;
exports.VALID_PROFILES = [..._catalog.profiles];
exports.VALID_PHASE_TYPES = new Set(_catalog.phaseTypes);
exports.VALID_AGENT_TIERS = new Set(Object.keys(_catalog.adaptiveTierMap));
// Catalog-derived so this can never drift from the resolver's tier gate:
// Object.values(adaptiveTierMap) === ['opus', 'sonnet', 'haiku'] today, plus 'inherit'.
exports.VALID_TIERS = new Set([...Object.values(_catalog.adaptiveTierMap), 'inherit']);
// Same catalog-derived tier values as VALID_TIERS but WITHOUT 'inherit' — used
// by config-loader's runtime-override validation (model_profile_overrides /
// model_policy.runtime_tiers), which does not accept 'inherit' as a tier.
exports.ADAPTIVE_TIER_VALUES = new Set(Object.values(_catalog.adaptiveTierMap));
exports.MODEL_PROFILES = Object.fromEntries(Object.entries(_catalog.agents).map(([agent, meta]) => [agent, {
        quality: meta.golden,
        balanced: meta.balanced,
        budget: meta.budget,
        adaptive: _catalog.adaptiveTierMap[meta.routingTier],
    }]));
exports.AGENT_TO_PHASE_TYPE = Object.fromEntries(Object.entries(_catalog.agents).map(([agent, meta]) => [agent, meta.phaseType]));
exports.AGENT_DEFAULT_TIERS = Object.fromEntries(Object.entries(_catalog.agents).map(([agent, meta]) => [agent, meta.routingTier]));
exports.MODEL_ALIAS_MAP = Object.fromEntries(Object.entries(_catalog.runtimeTierDefaults['claude'] ?? {}).map(([tier, entry]) => [tier, entry?.model]));
exports.RUNTIME_PROFILE_MAP = (() => {
    const result = {};
    for (const [runtime, tiers] of Object.entries(_catalog.runtimeTierDefaults)) {
        const filtered = {};
        for (const [tier, entry] of Object.entries(tiers)) {
            if (entry)
                filtered[tier] = entry;
        }
        if (Object.keys(filtered).length > 0)
            result[runtime] = filtered;
    }
    return result;
})();
exports.KNOWN_RUNTIMES = new Set(Object.keys(_catalog.runtimeTierDefaults));
exports.RUNTIMES_WITH_REASONING_EFFORT = new Set(Object.entries(_catalog.runtimeTierDefaults)
    .filter(([, tiers]) => Object.values(tiers).some((entry) => entry && entry.reasoning_effort))
    .map(([runtime]) => runtime));
exports.PROVIDER_PRESETS = _catalog.providerPresets ?? {};
// KNOWN_PROVIDERS excludes 'generic' — it is a sentinel (all null entries) that
// forces users to supply model IDs via model_profile_overrides. It is not a
// real catalog-backed provider (#49).
exports.KNOWN_PROVIDERS = new Set(Object.entries(exports.PROVIDER_PRESETS)
    .filter(([, tiers]) => Object.values(tiers).some((budgets) => budgets && Object.values(budgets).some((entry) => entry && entry.model)))
    .map(([name]) => name));
// ─── #3241 — Anthropic-flavored model detection ──────────────────────────────
//
// Moved here from src/model-resolver.cts (the "seam decision" in
// .gsd/phase/feat-3241-codex-omit-model-by-default/40-design.md): this leaf
// module is the one common dependency both model-resolver and the (layering-
// restricted) install-time Codex-posture checks can share without pulling
// model-resolver's config-loader dependency chain into a "pure read/verify"
// caller. model-resolver re-exports both names for back-compat.
//
// #2310 — True if `model` is an Anthropic-flavored value that must never appear as a
// Codex agent `.toml` `model`. Two forms: (a) a bare Claude Agent-tool tier alias
// (opus/sonnet/haiku/fable — CLAUDE_AGENT_ALIASES below); (b) any Claude model id in
// any provider namespacing — `claude-*`, `anthropic/claude-*`, `us.anthropic.claude-*`
// (the forms the catalog assigns to opencode/hermes/kilo, reachable on a Codex .toml
// via the runtime-resolver path). No OpenAI/Codex model id contains "claude", so a
// case-insensitive substring test is a safe, exhaustive guard for (b). Codex/ChatGPT
// rejects all of these.
exports.CLAUDE_AGENT_ALIASES = new Set(['opus', 'sonnet', 'haiku', 'fable']);
function isAnthropicFlavoredModel(model) {
    return typeof model === 'string' && (exports.CLAUDE_AGENT_ALIASES.has(model) || model.toLowerCase().includes('claude'));
}
function nextTier(currentTier) {
    const order = ['light', 'standard', 'heavy'];
    const idx = order.indexOf(String(currentTier));
    if (idx === -1)
        return null;
    return order[Math.min(idx + 1, order.length - 1)];
}
function formatAgentToModelMapAsTable(agentToModelMap) {
    const agentWidth = Math.max('Agent'.length, ...Object.keys(agentToModelMap).map((a) => a.length));
    const modelWidth = Math.max('Model'.length, ...Object.values(agentToModelMap).map((m) => m.length));
    const sep = '─'.repeat(agentWidth + 2) + '┼' + '─'.repeat(modelWidth + 2);
    const header = ` ${'Agent'.padEnd(agentWidth)} │ ${'Model'.padEnd(modelWidth)}`;
    let out = `${header}\n${sep}\n`;
    for (const [agent, model] of Object.entries(agentToModelMap)) {
        out += ` ${agent.padEnd(agentWidth)} │ ${model.padEnd(modelWidth)}\n`;
    }
    return out;
}
function getAgentToModelMapForProfile(normalizedProfile) {
    const profile = exports.VALID_PROFILES.includes(normalizedProfile) ? normalizedProfile : 'balanced';
    const out = {};
    for (const [agent, profiles] of Object.entries(exports.MODEL_PROFILES)) {
        const profilesRec = profiles;
        out[agent] = profile === 'inherit' ? 'inherit' : (profilesRec[profile] ?? profiles.balanced);
    }
    return out;
}
exports.EFFORT_RENDERING = {
    claude: {
        param: 'output_config.effort',
        channel: 'frontmatter',
        supported: new Set(['low', 'medium', 'high', 'xhigh', 'max']),
        clamp(level) {
            if (level === 'minimal')
                return 'low';
            return level;
        },
    },
    codex: {
        param: 'model_reasoning_effort',
        channel: 'api',
        supported: new Set(['minimal', 'low', 'medium', 'high', 'xhigh']),
        clamp(level) {
            if (level === 'max')
                return 'xhigh';
            return level;
        },
    },
};
exports.EFFORT_ARGV = {
    // Verified against `claude --help`: `--effort <level>`.
    claude: {
        render: (level) => ['--effort', level],
        supported: new Set(['low', 'medium', 'high', 'xhigh', 'max']),
        clamp: (level) => (level === 'minimal' ? 'low' : level),
    },
    // Verified against `opencode run --help`: `--variant` — "model variant
    // (provider-specific reasoning effort, e.g., high, max, minimal)".
    opencode: {
        render: (level) => ['--variant', level],
        supported: new Set(['minimal', 'low', 'medium', 'high', 'xhigh', 'max']),
        clamp: (level) => level,
    },
    // First-party Codex docs: `model_reasoning_effort` is a config-only key with no
    // dedicated flag, so the generic `-c key=value` override is the only argv route.
    codex: {
        render: (level) => ['-c', `model_reasoning_effort=${level}`],
        supported: new Set(['minimal', 'low', 'medium', 'high', 'xhigh']),
        clamp: (level) => (level === 'max' ? 'xhigh' : level),
    },
};
/**
 * Render the invocation-time effort argument for a host.
 *
 * `effortSurface` is the host's negotiated axis value. Only `argv` produces an
 * argument; `none`, `undocumented`, and anything unrecognised produce nothing.
 * Never throws.
 */
function renderEffortArgv(host, universalEffort, effortSurface) {
    const empty = { argv: [], value: null, host };
    if (effortSurface !== 'argv')
        return empty;
    // Own-property lookup only. A plain `EFFORT_ARGV[host]` resolves `__proto__`
    // (and `constructor`/`toString`) to inherited members, which are truthy but
    // carry no `clamp`/`render` — a hostile host id would throw instead of
    // degrading. The host id reaches here from a descriptor, i.e. untrusted JSON.
    if (typeof host !== 'string' || !Object.prototype.hasOwnProperty.call(exports.EFFORT_ARGV, host))
        return empty;
    const spec = exports.EFFORT_ARGV[host];
    if (!spec || typeof spec.clamp !== 'function' || typeof spec.render !== 'function')
        return empty;
    if (typeof universalEffort !== 'string' || universalEffort.length === 0)
        return empty;
    const clamped = spec.clamp(universalEffort);
    if (!spec.supported.has(clamped))
        return empty;
    return { argv: spec.render(clamped), value: clamped, host };
}
/**
 * Render a universal effort string for a specific runtime.
 */
function renderEffortForRuntime(runtime, universalEffort) {
    // #3533 (10d): 'inherit' is not a wire level on ANY runtime — it means
    // "omit the key / pass no argument and follow the session/host default".
    // Renderers must never emit it as a literal; null param/channel tells
    // resolve-execution consumers there is no propagation.
    if (universalEffort === 'inherit') {
        return { value: 'inherit', param: null, channel: null };
    }
    const spec = exports.EFFORT_RENDERING[runtime];
    if (!spec) {
        return { value: universalEffort, param: null, channel: null };
    }
    return {
        value: spec.clamp(universalEffort),
        param: spec.param,
        channel: spec.channel,
    };
}
/**
 * #3531 (10c) — Merge a config `effort.routing_tier_defaults` block over the
 * manifest tier defaults instead of replacing them. A partial config must not
 * discard built-ins: per tier, a valid override value wins and an invalid one
 * is ignored so the manifest value for that tier surfaces (ADR-443 D1's
 * "invalid values fall through" holds within the merged layer).
 *
 * Pure: returns a new object and never mutates either input — the manifest
 * constants (`CANONICAL_CONFIG_DEFAULTS`, the catalog cache) stay frozen. The
 * validator is injected because `EFFORT_SET` lives in model-resolver, which
 * imports this leaf (a reverse import would be a cycle); both effort
 * resolvers pass their own `(v) => typeof v === 'string' && EFFORT_SET.has(v)`.
 */
function mergeEffortTierDefaults(manifest, override, isValid) {
    const merged = { ...(manifest || {}) };
    if (override && typeof override === 'object' && !Array.isArray(override)) {
        for (const [tier, value] of Object.entries(override)) {
            // House pollution guard (mirrors _deepMergeConfig in config-loader): the
            // string-only validator already makes these inert, but an explicit skip
            // keeps this merge safe even if a caller's validator is ever relaxed.
            if (tier === '__proto__' || tier === 'constructor' || tier === 'prototype')
                continue;
            if (isValid(value))
                merged[tier] = value;
        }
    }
    return merged;
}
// ─── Fast mode propagation ───────────────────────────────────────────────────
exports.RUNTIMES_WITH_FAST_MODE = new Set(['api']);
