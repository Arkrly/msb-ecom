'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
/**
 * Runtime artifact layout module — resolves the artifact directory shapes
 * (commands, agents, skills) for each supported runtime.
 *
 * grok is intentionally absent: it is in runtime-homes.cjs but has no runtime
 * capability descriptor. The TypeError on unknown runtime is the loud-fail
 * signal that a runtime was added without an artifact layout descriptor.
 *
 * ADR-457 build-at-publish: the hand-written bin/lib/runtime-artifact-layout.cjs
 * collapsed to a TypeScript source of truth. Behaviour is preserved byte-for-behaviour
 * from the prior hand-written .cjs; only types are added.
 */
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = __importDefault(require("node:os"));
// #2874 (ADR-58 cleanup phase): route this module's fs calls through the
// installRuntimeArtifacts call tree's injectable seam — see
// install-fs-adapter.cts's module doc. Resolves to real `node:fs` (the
// `fs` import above stays for type-only references, e.g. `fs.Dirent`)
// unless the top-level installRuntimeArtifacts call injected a `deps.fs`.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const installFsAdapter = require("./install-fs-adapter.cjs");
const { installFs, mkInstallTempDir } = installFsAdapter;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const installProfiles = require("./install-profiles.cjs");
const { stageSkillsForProfile, stageAgentsForRuntimeWithConverter, stageSkillsForRuntimeAsSkills, stageCommandsForRuntimeFlat, } = installProfiles;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const runtimeArtifactConversion = require("./runtime-artifact-conversion.cjs");
const conversionExports = runtimeArtifactConversion;
// #2875 Part 2 (J8): shared model-override precedence resolver — see its
// module doc for why kilo/opencode MUST resolve through this ONE function
// rather than re-deriving the chain per runtime.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const installModelOverrideResolver = require("./install-model-override-resolver.cjs");
const shell_command_projection_cjs_1 = require("./shell-command-projection.cjs");
// #2870: `isGlobalScope` centralizes the `scope === 'global'` boolean
// projection both kind-builder closures below need at the converters'
// positional `isGlobal` boundary (see its doc comment in install-scope.cts
// for why the projection is centralized rather than eliminated).
const install_scope_cjs_1 = require("./install-scope.cjs");
// In .cts (CommonJS output) files, `require` is available as a global.
const _require = require;
// ---------------------------------------------------------------------------
// Source root finders
// ---------------------------------------------------------------------------
/**
 * Locate the GSD commands/gsd source directory.
 *
 * Resolution order:
 * 1. If runtimeConfigDir provided, check <runtimeConfigDir>/.gsd-source marker.
 * 2. Walk up from __dirname using path.dirname (no literal .. segments).
 * 3. Throw a descriptive error if neither succeeds.
 */
function findInstallSourceRoot(runtimeConfigDir) {
    // Step 1: marker check — reads `<runtimeConfigDir>/.gsd-source`, a path
    // under the INSTALL DESTINATION, so this probe goes through the injected
    // adapter (installFs()).
    if (runtimeConfigDir) {
        const markerPath = node_path_1.default.join(runtimeConfigDir, '.gsd-source');
        if (installFs().existsSync(markerPath)) {
            try {
                const src = installFs().readFileSync(markerPath, 'utf8').trim();
                if (src && installFs().existsSync(src))
                    return src;
            }
            catch { /* fall through */ }
        }
    }
    // Step 2: walk up from __dirname to locate the GSD PACKAGE'S OWN source
    // tree (commands/gsd/) — this resolves where the installer's own code is
    // running FROM, not anything under the install destination, so it is
    // deliberately NOT routed through the injected fs adapter (#2874): a fake
    // "destination" adapter has no reason to know about the real package's own
    // on-disk layout (an injected adapter's store starts empty and is never
    // seeded with real repo paths), and routing it through would make this
    // resolution unconditionally throw rather than gracefully staging nothing.
    //
    // Uses `fs.statSync` in a try/catch rather than `fs.existsSync` — this is
    // LOAD-BEARING, not a style choice: tests/executed-plan.test.cjs's F2 cases
    // poison every method on the ROUTED fs surface (including `existsSync`,
    // since installFs()'s REAL_ADAPTER also calls it) to prove nothing on the
    // installRuntimeArtifacts call tree reaches real fs. The F2 "nativePlugin
    // runtime: pi" test calls this function (via findInstallSourceRoot()) AFTER
    // installing that poison, specifically to resolve the pi nativePlugin
    // source path against this repo's own real layout — an operation this
    // function must still be able to perform even while `existsSync` is
    // poisoned, because this Step 2 walk is real-fs-only by design and was
    // never meant to be covered by that poison list. `statSync` is not on the
    // poisoned surface, so this probe survives; switching back to `existsSync`
    // makes that F2 test throw (verified: reverting this to `existsSync` trips
    // the poison and breaks the pi nativePlugin case).
    let dir = __dirname;
    for (let i = 0; i < 6; i++) {
        const candidate = node_path_1.default.join(dir, 'commands', 'gsd');
        try {
            node_fs_1.default.statSync(candidate);
            return candidate;
        }
        catch { /* not here — keep walking up */ }
        const parent = node_path_1.default.dirname(dir);
        if (parent === dir)
            break;
        dir = parent;
    }
    throw new Error(`findInstallSourceRoot: could not locate commands/gsd from ${__dirname}`);
}
/**
 * Locate the GSD agents source directory.
 *
 * Resolution order:
 * 1. If runtimeConfigDir provided, check <runtimeConfigDir>/.gsd-source marker.
 * 2. Walk up from __dirname using path.dirname (no literal .. segments).
 * 3. Throw a descriptive error if neither succeeds.
 */
function findAgentsSourceRoot(runtimeConfigDir) {
    // Step 1: marker check (destination-relative — routed through installFs()).
    if (runtimeConfigDir) {
        const markerPath = node_path_1.default.join(runtimeConfigDir, '.gsd-source');
        if (installFs().existsSync(markerPath)) {
            try {
                const src = installFs().readFileSync(markerPath, 'utf8').trim();
                if (src && installFs().existsSync(src)) {
                    // Marker points to commands/gsd; agents/ is a sibling of commands/
                    const agentsCandidate = node_path_1.default.resolve(node_path_1.default.dirname(src), '..', 'agents');
                    if (installFs().existsSync(agentsCandidate))
                        return agentsCandidate;
                }
            }
            catch { /* fall through */ }
        }
    }
    // Step 2: walk up from __dirname — locates THIS package's own agents/
    // source tree, not the install destination. See findInstallSourceRoot's
    // Step 2 comment (#2874) for why this stays unrouted, real-fs-only, and why
    // it uses `statSync` rather than `existsSync` (load-bearing against F2's
    // poison of the routed fs surface, not a style choice).
    let dir = __dirname;
    for (let i = 0; i < 6; i++) {
        const candidate = node_path_1.default.join(dir, 'agents');
        try {
            node_fs_1.default.statSync(candidate);
            return candidate;
        }
        catch { /* not here — keep walking up */ }
        const parent = node_path_1.default.dirname(dir);
        if (parent === dir)
            break;
        dir = parent;
    }
    throw new Error(`findAgentsSourceRoot: could not locate agents/ from ${__dirname}`);
}
// ---------------------------------------------------------------------------
// Layout table builders
// ---------------------------------------------------------------------------
function commandsKind(destSubpath, prefix, configDir) {
    return {
        kind: 'commands',
        destSubpath,
        prefix,
        stage: (resolved) => stageSkillsForProfile(findInstallSourceRoot(configDir), resolved),
    };
}
function agentsKind(destSubpath, prefix, configDir) {
    return {
        kind: 'agents',
        destSubpath,
        prefix,
        // #2995: a `converter: null` agents entry (claude local, zcode) previously
        // staged via stageAgentsForProfile — a RAW byte copy that never reads content
        // into JS, so gsd:section markers shipped verbatim. Route through the
        // composing stager with an identity converter instead: same output as the raw
        // copy for an unmarked agent, markers stripped for a marked one. Routing both
        // agent kinds through the stager collapses what were five independent agent
        // read points down to three compose call sites: this stager, bin/install.js's
        // inline agent loop, and installCodexConfig's per-agent .toml writer. The
        // exhaustive per-runtime sweep in tests/agent-fragments-emission.install.test.cjs
        // is what keeps a fourth from appearing uncomposed.
        // #2875 Part 2 (row I2): agentCtx threaded through so a runtime using this
        // converter:null builder (claude, plus any future identity-copy runtime)
        // ALSO gets path-rewrites/attribution/frontmatter-extensions/normalize
        // when a caller supplies agentCtx (createRuntimeArtifactInstallPlan /
        // applySurface's agentCtx build). Previously this closure's `(resolved) =>`
        // signature silently dropped the second arg every caller already passed —
        // a caller with NO agentCtx in scope is unaffected (row I2: converter-only,
        // as today), matching stageAgentsForRuntimeWithConverter's own contract.
        stage: (resolved, agentCtx) => stageAgentsForRuntimeWithConverter(findAgentsSourceRoot(configDir), resolved, (content) => content, false, agentCtx),
    };
}
/**
 * Runtime allowlist check for a descriptor-declared `converter` name, applied
 * at DISPATCH time (security fix). `VALID_CONVERTER_NAMES` (capability-
 * validator.cjs) is otherwise enforced ONLY at lint/build time
 * (`check:contract-drift`) — every `conversionExports[converterName]`
 * dynamic-property read below trusted that a `capability.json` reaching this
 * far had already passed that check. It had not, in general: a hand-edited
 * or malformed descriptor naming an Object-prototype member (`"constructor"`,
 * `"toString"`, `"hasOwnProperty"`, ...) resolves to that member instead of
 * throwing, producing garbage staged content rather than a loud failure —
 * pre-existing, but promoted from the `/gsd-surface`-only path to the real
 * install path for seven runtimes by #2875 Part 2's agents-bypass closure.
 * Required lazily (call-time, not module-top) to avoid a load-time circular
 * require, the same pattern install-engine.cts's `_hostBehaviors` already
 * uses for `capability-registry.cjs`. Fails CLOSED: any error loading the
 * allowlist itself (missing module, exotic bundling) is treated as "nothing
 * is allowed", never as "skip the check".
 */
function _resolveNamedConverter(converterName, kindLabel) {
    let validNames;
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        validNames = require('./capability-validator.cjs').VALID_CONVERTER_NAMES;
    }
    catch {
        validNames = undefined;
    }
    if (!validNames || !validNames.has(converterName)) {
        throw new Error(`Unknown converter "${converterName}" declared for a ${kindLabel} kind — refusing to dispatch (not in capability-validator.cjs's VALID_CONVERTER_NAMES allowlist).`);
    }
    const fn = conversionExports[converterName];
    if (typeof fn !== 'function') {
        throw new Error(`Converter "${converterName}" is allowlisted but is not an exported function of runtime-artifact-conversion.cjs.`);
    }
    return fn;
}
/**
 * Build a converted-agents kind descriptor for runtimes whose agent `.md` files
 * need runtime-specific frontmatter/body conversion (e.g. Copilot, Cursor, Codex).
 *
 * Unlike `agentsKind` (which raw-copies source files), this kind applies
 * `converterName` from Runtime Artifact Conversion exports to each agent file
 * during staging, writing flat `${name}.md` files to the staged directory.
 *
 * Agent filenames are preserved verbatim (the prefix is already embedded in the
 * agent stem — e.g. `gsd-planner.md`).
 *
 * #1173 SCOPE, updated by #2875 Part 2 (the agents-bypass closure) — measured
 * against the tree, not the ADR-3574 framing that preceded it:
 *
 * Of the four blockers this comment used to name for wiring `bin/install.js`'s
 * inline agent loop against this resolver, THREE were already stale by the
 * time #2875 measured them and are not re-litigated here: Copilot's
 * `.agent.md` rename (the loop's own `destName = entry.name` comment records
 * the ternary dropped in #2099; the descriptor fold applies it via
 * `hostBehaviors.agentFileExtension`), the cross-cutting path-prefix rewrite +
 * attribution (`stageAgentsForRuntimeWithConverter` already applies
 * `applyAgentPathRewrites` -> `processAttribution` when `agentCtx` is
 * present), and stale-file cleanup (`_removeGsdEntries` prunes every
 * `gsd-`-prefixed entry in a kind's destSubpath, broader than the loop's own
 * extension-gated check).
 *
 * The fourth — config-reading steps — was the real gap, and #2875 Part 2
 * closed it: `stageAgentsForRuntimeWithConverter` now takes a per-file
 * `agentName` (`agentCtx.agentName`, ADR-1235 §1) and a `targetDir`
 * (`agentCtx.targetDir`), which together let it (a) run a post-converter
 * frontmatter-extensions step (`applyAgentFrontmatterExtensions`, driven by
 * `hostBehaviors.agentFrontmatterExtensions` — Claude's `effort` +
 * `disallowedTools` injection) and (b) let THIS function resolve a per-agent
 * model override (`installModelOverrideResolver.resolveAgentModelOverride`,
 * `model_overrides[agent]` > `model_profile_overrides.<rt>.<tier>` > omit)
 * before invoking a converter that needs it (kilo/opencode). Both pieces —
 * plus a data-driven Hermes branding converter
 * (`convertClaudeAgentToHermesAgent`, reading `hostBehaviors.brandingRewrites`
 * rather than a hardcoded string table) — are single-sourced: `bin/install.js`
 * requires the SAME functions this module does, so its inline loop and the
 * descriptor path can no longer independently drift (the CLAUDE.md
 * "Generative Fix Divergence" class the prior duplication risked).
 *
 * `tests/agent-descriptor-parity.test.cjs` proves byte-identical output
 * between the inline loop and a SYNTHETIC descriptor registry (the same
 * override seam `resolveRuntimeArtifactLayoutFromRegistry` exposes) for all
 * six runtimes the inline loop still served: claude, cline, codex, hermes,
 * kilo, opencode.
 *
 * Both findings the prior revision of this comment named as STILL deferred
 * are now CLOSED (#2875 Part 2 Task A/B/C), measured against the real
 * `capability.json` entries and the real production entry points, not
 * argued from this module alone:
 *
 * 1. **kilo/opencode reaching `layout.kinds`.** `installEngine.
 *    installAgentsKindStandalone` (install-engine.cts) is called from inside
 *    `installOpencodeFamilyArtifacts` and resolves the agents kind through
 *    THIS SAME `resolveRuntimeArtifactLayout`/`convertedAgentsKind` path —
 *    `installOpencodeFamilyArtifacts` no longer stages only `commands` +
 *    `skills`. `bin/install.js`'s legacy-flat local path (claude-local,
 *    `hostBehaviors.localInstallStyle === 'legacy-flat'`) reaches the SAME
 *    generic loop only via `installRuntimeArtifacts`'s conditional
 *    `_isSkillsRuntime` branch; a call to `installAgentsKindStandalone` was
 *    added at claude-local's own call site to cover that scope too — the
 *    install-tree golden fixture (`tests/fixtures/install-tree/claude-local.json`)
 *    is what caught the gap when it was first missed.
 * 2. **`/gsd:surface` / `applySurface` activation.** Confirmed convergent,
 *    not merely non-broken: for all six runtimes (claude, cline, codex,
 *    hermes, kilo, opencode), staging via `applySurface` into a freshly
 *    wiped `agents/` directory produces byte-identical output (including
 *    filenames) to `installRuntimeArtifacts`'s own write — verified directly
 *    against the built registry, not inferred.
 *
 * The inline loop (`_DESCRIPTOR_AGENTS_RUNTIMES` and the `bin/install.js`
 * agent-staging block it gated) is DELETED — every runtime the registry
 * declares an `agents` kind for is descriptor-driven now, including a
 * seventh runtime (`kimi-code`) this comment's own prior measurement missed
 * (it fell through the inline loop's generic `else if` branch, same as
 * claude, with no dedicated dialect arm — caught by the same golden fixture).
 *
 * Codex's `config.toml [agents.gsd-*]` strip (`bin/install.js`, under
 * `isMinimalMode` + `hostBehaviors.tomlConfigInstall`) remains the one
 * genuinely out-of-scope constraint: it mutates a host config file, not the
 * agents directory, and no descriptor kind models host-config mutation. It
 * stays exactly where it is.
 *
 * Mirrors the `convertedCommandsKind` pattern (#785).
 *
 * @param destSubpath   destination subpath within configDir (e.g. 'agents')
 * @param prefix        filename prefix (informational; not applied here)
 * @param converterName name of converter function in Runtime Artifact Conversion exports
 * @param configDir     runtime config dir (for .gsd-source marker resolution)
 */
function convertedAgentsKind(destSubpath, prefix, converterName, configDir, scope = 'global') {
    return {
        kind: 'agents',
        destSubpath,
        prefix,
        stage: (resolved, agentCtx) => {
            // #2870: `scope` is this function's own parameter (default `'global'`,
            // so it is never undefined here), sourced upstream from the Install
            // Scope Module's resolved id. `isGlobalScope` projects it to the
            // boolean `stageAgentsForRuntimeWithConverter`'s positional API
            // requires — see its doc comment in install-scope.cts.
            const rawConverter = _resolveNamedConverter(converterName, 'agents');
            // #2875 Part 2 (J5-J8): kilo/opencode agent converters take an options
            // bag (`{isAgent, modelOverride}`), not the `isGlobal` boolean every
            // other agent converter's 2nd positional arg means — mirrors the
            // inline loop's per-runtime `frontmatterDialect === 'opencode' | 'kilo'`
            // branches (bin/install.js), which resolve model_overrides[agent] >
            // model_profile_overrides.<runtime>.<tier> > omit BEFORE calling the
            // converter. Resolved ONCE per stage() call (not per file — a pure
            // function of configDir/targetDir) via the single shared precedence
            // resolver so kilo and opencode can never diverge (J8).
            const needsModelOverride = converterName === 'convertClaudeToOpencodeFrontmatter' || converterName === 'convertClaudeToKiloFrontmatter';
            let converter;
            if (needsModelOverride) {
                const overrideTargetDir = agentCtx?.targetDir ?? configDir;
                const modelOverrides = installModelOverrideResolver.readGsdEffectiveModelOverrides(overrideTargetDir);
                const runtimeResolver = installModelOverrideResolver.readGsdRuntimeProfileResolver(overrideTargetDir);
                converter = (content, _isGlobal, meta) => {
                    const modelOverride = meta
                        ? installModelOverrideResolver.resolveAgentModelOverride(meta.agentName, modelOverrides, runtimeResolver)
                        : null;
                    return rawConverter(content, { isAgent: true, modelOverride });
                };
            }
            else {
                // isGlobal is threaded so scope-aware agent converters (copilot, antigravity)
                // choose global-home vs workspace-relative paths; converters that only take
                // (content) ignore the extra positional arg. Mirrors skillsKind's scope
                // threading (#1173).
                converter = (content) => rawConverter(content, (0, install_scope_cjs_1.isGlobalScope)(scope));
            }
            // ADR-1235 §1: when agentCtx is provided (by createRuntimeArtifactInstallPlan
            // for descriptor-driven runtimes), thread it through so stageAgentsForRuntimeWithConverter
            // can apply the full pre-converter + post-converter sequence in the correct order.
            return stageAgentsForRuntimeWithConverter(findAgentsSourceRoot(configDir), resolved, converter, (0, install_scope_cjs_1.isGlobalScope)(scope), agentCtx);
        },
    };
}
function kimiAgentsKind(destSubpath, prefix, configDir) {
    return {
        kind: 'kimi-agents',
        destSubpath,
        prefix,
        stage: (resolved) => {
            const buildKimiAgentArtifacts = conversionExports['buildKimiAgentArtifacts'];
            // #2995: compose at staging (identity converter) so the readFileSync below
            // sees marker-free content — same single composing stager as agentsKind.
            const stagedAgents = stageAgentsForRuntimeWithConverter(findAgentsSourceRoot(configDir), resolved, (content) => content);
            const subagents = [];
            if (installFs().existsSync(stagedAgents)) {
                for (const entry of installFs().readdirSync(stagedAgents, { withFileTypes: true })) {
                    if (!entry.isFile() || !entry.name.endsWith('.md'))
                        continue;
                    const agentPath = node_path_1.default.join(stagedAgents, entry.name);
                    subagents.push({
                        path: (0, shell_command_projection_cjs_1.posixNormalize)(node_path_1.default.join('agents', entry.name)),
                        content: installFs().readFileSync(agentPath, 'utf8'),
                    });
                }
            }
            const rootAgent = `---\nname: gsd\ndescription: Run GSD workflows in Kimi CLI.\ntools: Agent\n---\n\n# GSD for Kimi CLI\n\nCoordinate installed /skill:gsd-* workflows and route work to generated GSD subagents when a workflow requires an agent handoff.\n`;
            const artifacts = buildKimiAgentArtifacts({ rootAgent, subagents });
            const stageDir = mkInstallTempDir('gsd-kimi-agents-');
            installProfiles.STAGED_DIRS.add(stageDir);
            installFs().writeFileSync(node_path_1.default.join(stageDir, 'gsd.yaml'), artifacts.root.yaml);
            installFs().writeFileSync(node_path_1.default.join(stageDir, 'gsd.md'), artifacts.root.prompt);
            const subagentsDir = node_path_1.default.join(stageDir, 'subagents');
            installFs().mkdirSync(subagentsDir, { recursive: true });
            for (const artifact of artifacts.subagents) {
                installFs().writeFileSync(node_path_1.default.join(subagentsDir, `${artifact.name}.yaml`), artifact.yaml);
                installFs().writeFileSync(node_path_1.default.join(subagentsDir, `${artifact.name}.md`), artifact.prompt);
            }
            return stageDir;
        },
    };
}
/**
 * Build a skills kind descriptor.
 *
 * @param destSubpath
 * @param prefix
 * @param converterName  name of converter function in Runtime Artifact Conversion exports
 * @param runtime        canonical runtime ID (gates Hermes/Qwen branding in converter)
 * @param configDir      runtime config dir (for .gsd-source marker resolution)
 * @param nested         if true, nest concrete skills under their ns-* routers (#69)
 * @param scope          install scope; converted to isGlobal and passed as 5th positional
 *                       arg so scope-aware converters (antigravity, copilot) can choose
 *                       between global home paths and workspace-relative paths without
 *                       colliding with the `runtime` string at position 3.
 * @param capabilityRegistry #2322: optional capability registry — captured in the
 *                       stage() closure so third-party capability skills are bound to
 *                       their declaring capId at staging time. Absent -> stage() stages
 *                       nothing third-party (fail closed).
 */
function skillsKind(destSubpath, prefix, converterName, runtime, configDir, nested = false, scope = 'global', capabilityRegistry) {
    return {
        kind: 'skills',
        destSubpath,
        prefix,
        converter: converterName,
        stage: (resolved) => {
            const realConverter = _resolveNamedConverter(converterName, 'skills');
            // Compute cmdNames once per stage call for performance (#3583).
            // Extra trailing args are ignored by converters that don't need them. The
            // isGlobal flag is the 5th positional (NOT the 3rd): the 3rd positional is
            // `runtime` for the claude/kimi/cline converters, so the scope-aware
            // converters (antigravity, copilot) read isGlobal from position 5 to avoid
            // colliding with `runtime` and always taking the global branch.
            const cmdNames = conversionExports.readGsdCommandNames
                ? conversionExports.readGsdCommandNames()
                : [];
            // #2870: same judgment as convertedAgentsKind above — `scope` is this
            // function's own parameter (default `'global'`, so it is never
            // undefined here); `isGlobalScope` projects it to the boolean
            // `realConverter`'s positional `isGlobal` arg requires.
            const isGlobal = (0, install_scope_cjs_1.isGlobalScope)(scope);
            // #2873 (4b): spec-root reachability is applied LATER in the pipeline —
            // see `rewriteStagedSkillBodies` in runtime-artifact-conversion.cts, not
            // here. This stage() closure runs BEFORE the staged directory's generic
            // path-prefix rewrite pass (`applyRuntimeContentRewritesInPlace`'s
            // `case 'claude'`), which unconditionally rewrites any bare (non-`@`)
            // `~/.claude/` substring to the undocumented `$HOME/.claude/` form and
            // only restores the `@`-prefixed form. Emitting the imperative
            // tilde-path prose here would get silently mangled by that later pass;
            // it must run AFTER it instead, once the `@`-include is in its final
            // rewritten shape.
            const wrappedConverter = (content, skillName) => realConverter(content, skillName, runtime, cmdNames, isGlobal);
            return stageSkillsForRuntimeAsSkills(findInstallSourceRoot(configDir), resolved, wrappedConverter, prefix, nested, capabilityRegistry);
        },
    };
}
/**
 * Build a converted-commands kind descriptor for runtimes that use a flat
 * commands directory with per-file conversion (e.g. Cursor 1.6 slash commands).
 *
 * Unlike `commandsKind` (which passes raw source files through), this kind
 * applies `converterName` from Runtime Artifact Conversion exports to each file during
 * staging, writing flat `${prefix}${stem}.md` files to the staged directory.
 *
 * The staged files are then written by `_copyStaged` (commands branch) which
 * handles prefix logic via the existing layout machinery.
 *
 * @param destSubpath   destination subpath within configDir (e.g. 'commands')
 * @param prefix        filename prefix, e.g. 'gsd-'
 * @param converterName name of converter function in Runtime Artifact Conversion exports
 * @param configDir     runtime config dir (for .gsd-source marker resolution)
 */
function convertedCommandsKind(destSubpath, prefix, converterName, configDir) {
    return {
        kind: 'commands',
        destSubpath,
        prefix,
        stage: (resolved) => {
            const converter = _resolveNamedConverter(converterName, 'commands');
            return stageCommandsForRuntimeFlat(findInstallSourceRoot(configDir), resolved, converter, prefix);
        },
    };
}
function getRegistry() {
    return _require('./capability-registry.cjs');
}
/**
 * Map a single ArtifactKindDescriptor entry to an ArtifactKind using the
 * matching builder function. Mirrors the hand-built calls in the old switch.
 */
function dispatchKindEntry(entry, runtime, configDir, scope, capabilityRegistry) {
    const { kind, destSubpath, prefix, nesting, converter } = entry;
    const nested = nesting === 'nested';
    let result;
    switch (kind) {
        case 'commands':
            result = converter == null
                ? commandsKind(destSubpath, prefix, configDir)
                : convertedCommandsKind(destSubpath, prefix, converter, configDir);
            break;
        case 'agents':
            result = converter == null
                ? agentsKind(destSubpath, prefix, configDir)
                : convertedAgentsKind(destSubpath, prefix, converter, configDir, scope);
            break;
        case 'skills':
            if (converter == null) {
                throw new TypeError(`resolveRuntimeArtifactLayout: skills entry for '${runtime}' has converter=null (converter is required for skills)`);
            }
            result = skillsKind(destSubpath, prefix, converter, runtime, configDir, nested, scope, capabilityRegistry);
            break;
        case 'kimi-agents':
            result = kimiAgentsKind(destSubpath, prefix, configDir);
            break;
        default:
            throw new TypeError(`resolveRuntimeArtifactLayout: unknown kind '${kind}' in descriptor for runtime '${runtime}'`);
    }
    // scope is guaranteed 'local' | 'global' here: resolveRuntimeArtifactLayoutFromRegistry
    // (the only caller of dispatchKindEntry) throws TypeError before this point if scope is
    // anything else (see the `scope !== 'local' && scope !== 'global'` guard above its
    // dispatchKindEntry call), so isGlobalScope's throw-on-invalid-input never fires here.
    if ((0, install_scope_cjs_1.isGlobalScope)(scope) && typeof entry.home === 'string' && entry.home !== '') {
        result.home = node_path_1.default.join(node_os_1.default.homedir(), entry.home);
    }
    return result;
}
/**
 * Resolve the artifact layout for a given runtime and config directory.
 *
 * ADR-857 phase 5d: driven by the capability-registry artifactLayout descriptor
 * instead of a hardcoded switch statement.
 *
 * @param capabilityRegistry #2322: optional — when the caller has a composed
 *   capability registry in scope (e.g. capability-writer.cts's `capability set`
 *   path, or a fresh install's registry-aware profile resolution), pass it here
 *   so the skills kind's stage() closure can materialize installed third-party
 *   capability skills bound to their declaring capId. Both call paths (surface
 *   apply AND the installer) must pass their registry here — resolveProfile's
 *   own `'*'` (full profile) short-circuit never carries a registry, so if it
 *   is not threaded in at layout-build time a `full`-profile install stages no
 *   third-party capability skills regardless of registration (#2322 blocker 2).
 */
function resolveRuntimeArtifactLayout(runtime, configDir, scope = 'global', capabilityRegistry) {
    return resolveRuntimeArtifactLayoutFromRegistry(getRegistry(), runtime, configDir, scope, capabilityRegistry);
}
function resolveRuntimeArtifactLayoutFromRegistry(registry, runtime, configDir, scope = 'global', capabilityRegistry) {
    if (typeof configDir !== 'string' || configDir === '') {
        throw new TypeError('configDir must be a non-empty string');
    }
    if (scope !== 'local' && scope !== 'global') {
        throw new TypeError('scope must be "local" or "global"');
    }
    const desc = registry.runtimes[runtime]?.runtime?.artifactLayout;
    if (!desc) {
        throw new TypeError(`Unknown runtime: '${runtime}' — add to runtime-artifact-layout.cjs table`);
    }
    const entries = desc[scope] ?? [];
    const kinds = entries.map((entry) => dispatchKindEntry(entry, runtime, configDir, scope, capabilityRegistry));
    return { runtime, configDir, scope, kinds };
}
function getTriggerRegistry() {
    return _require('./capability-registry.cjs');
}
/**
 * capability-validator.cjs is a COMMITTED plain .cjs (not built from a .cts
 * source — see its own header comment), so it is required the same way
 * capability-registry.cjs is above: a lazy `_require` rather than a static
 * ES import. DEFAULT_TRIGGER_PRECEDENCE is the single source of truth for
 * "what applies when a descriptor omits triggerPrecedence"; this module
 * reads it rather than re-declaring `['skills', 'commands']` as a second
 * literal that could silently drift from the validator's own default.
 */
function getDefaultTriggerPrecedence() {
    const capValidator = _require('./capability-validator.cjs');
    return capValidator.DEFAULT_TRIGGER_PRECEDENCE;
}
/**
 * True when a `commands` kind entry is namespaced by its destination
 * directory rather than by a filename prefix — i.e. `destSubpath`'s basename
 * equals `prefix` with its trailing hyphen stripped (e.g. `commands/gsd` +
 * `gsd-`). When true, `_copyStaged` (`install-engine.cts`) and `surface.cts`
 * both write the bare stem filename (no prefix) because the directory itself
 * already carries the namespace; `resolveTriggerSurface` mirrors that in its
 * own `destPath` computation. Single source of truth for the three sites
 * that used to compute this independently (#2871 Phase 2 review finding) —
 * a new caller MUST reuse this rather than re-deriving the rule.
 */
function isNamespacedByDir(kind, destSubpath, prefix) {
    const destLast = node_path_1.default.posix.basename((0, shell_command_projection_cjs_1.posixNormalize)(destSubpath));
    const prefixStem = prefix ? prefix.replace(/-$/, '') : '';
    return kind === 'commands' && destLast === prefixStem;
}
/**
 * Compose the destination filename `_copyStaged` (install-engine.cts) writes
 * for a `commands` kind entry, given `isNamespacedByDir`'s result, the
 * kind's prefix, and the file's `.md`-stripped stem. Single source of truth
 * alongside `isNamespacedByDir` for the FILENAME COMPOSITION itself (#2871
 * Phase 2 review finding — the boolean was single-sourced first, but the
 * `${stem}.md` / `${prefix}${stem}.md` string-building around it stayed
 * duplicated between `_copyStaged` and `resolveTriggerSurface`'s `destPath`
 * prediction below, so a divergence in the write convention would not have
 * failed anything).
 *
 * Byte-identical to `_copyStaged`'s prior separate branches: when
 * `namespacedByDir` is true this returns `${stem}.md`. `_copyStaged` always
 * derives `stem` as `entry.name.slice(0, -3)` for an `entry.name` that has
 * already been filtered to end in `.md`, so `${stem}.md` is always exactly
 * `entry.name` again — `_copyStaged` can pass this helper's result in place
 * of the `entry.name` it used to write directly, with no behavior change.
 */
function composeCommandFilename(namespacedByDir, prefix, stem) {
    return namespacedByDir ? `${stem}.md` : `${prefix}${stem}.md`;
}
/**
 * True when candidate `a` should win over the current best `b` for the same
 * trigger. Scope rank first (Phase 1's `install-scope.cts#scopeRank` —
 * global outranks local; NOT re-derived here), then the runtime's
 * `triggerPrecedence` kind ordering (lower index = higher priority). A kind
 * absent from `precedenceRank` (should not happen — every entry's kind is
 * validated against the same closed vocabulary the precedence list draws
 * from) sorts last rather than throwing, so a malformed precedence value
 * degrades to "leaves the incumbent standing" instead of corrupting the
 * whole resolution.
 */
function isHigherPriority(a, b, precedenceRank) {
    const rankA = (0, install_scope_cjs_1.scopeRank)(a.scope);
    const rankB = (0, install_scope_cjs_1.scopeRank)(b.scope);
    if (rankA !== rankB)
        return rankA > rankB;
    const pa = precedenceRank.get(a.kind) ?? Number.POSITIVE_INFINITY;
    const pb = precedenceRank.get(b.kind) ?? Number.POSITIVE_INFINITY;
    return pa < pb;
}
/**
 * Resolve the `/gsd-<name>`-style trigger surface for a runtime: what the
 * user types, at which scope, whether it wins or is shadowed, and (for
 * nested-router runtimes) whether the host registers it directly or only
 * reaches it through a router. Pure — no filesystem, no mutation of `scopes`
 * or `opts`, and safe against a caller mutating the returned array/objects
 * (a fresh array/objects are built on every call; nothing is cached or
 * shared across calls beyond the read-only registry module).
 *
 * Only `commands` and `skills` kind entries are considered — see the
 * module-level comment above. `resolveRuntimeArtifactLayout` is untouched by
 * this function; they are independent readers of the same descriptor.
 *
 * @throws {TypeError} for an unknown runtime — same contract (and message
 *   shape) as `resolveRuntimeArtifactLayoutFromRegistry`.
 * @throws {TypeError} for an unrecognized entry in `scopes` — reuses
 *   `install-scope.cts`'s shared `validateScopeId`, the same validator
 *   `scopeRank`/`resolveScope`/`isGlobalScope` already throw through, so this
 *   sibling of theirs cannot silently fail open on a bad scope (#2871 Phase 2
 *   review finding). `scopes: []` is untouched — an empty array has no
 *   entries to validate and still resolves to `[]`.
 */
function resolveTriggerSurface(runtime, scopes, opts) {
    const registry = opts.registry ?? getTriggerRegistry();
    const runtimeDescriptor = registry.runtimes[runtime]?.runtime;
    const layout = runtimeDescriptor?.artifactLayout;
    if (!layout) {
        throw new TypeError(`Unknown runtime: '${runtime}' — add to runtime-artifact-layout.cjs table`);
    }
    for (const scope of scopes) {
        (0, install_scope_cjs_1.validateScopeId)(scope, 'resolveTriggerSurface');
    }
    const scopeSet = new Set(scopes);
    const stems = opts.stems ?? [];
    const routerStemSet = new Set(opts.routerStems ?? []);
    const childToRouters = opts.childToRouters ?? {};
    const precedence = runtimeDescriptor?.triggerPrecedence ?? getDefaultTriggerPrecedence();
    const precedenceRank = new Map(precedence.map((kind, index) => [kind, index]));
    const surfaces = [];
    for (const scope of install_scope_cjs_1.SCOPE_ORDER) {
        if (!scopeSet.has(scope))
            continue;
        const entries = layout[scope] ?? [];
        for (const entry of entries) {
            if (entry.kind !== 'commands' && entry.kind !== 'skills')
                continue; // excludes agents/kimi-agents
            const kind = entry.kind;
            const destSubpath = (0, shell_command_projection_cjs_1.posixNormalize)(entry.destSubpath);
            const namespacedByDir = isNamespacedByDir(kind, entry.destSubpath, entry.prefix);
            const nested = entry.nesting === 'nested';
            for (const stem of stems) {
                const trigger = `${entry.prefix}${stem}`;
                let destPath;
                if (kind === 'skills') {
                    destPath = `${destSubpath}/${entry.prefix}${stem}`;
                }
                else {
                    destPath = `${destSubpath}/${composeCommandFilename(namespacedByDir, entry.prefix, stem)}`;
                }
                let registration = 'direct';
                let routerTrigger = null;
                if (nested && routerStemSet.size > 0 && !routerStemSet.has(stem)) {
                    const owningRouters = childToRouters[stem];
                    const routerStem = owningRouters && owningRouters.length > 0 ? owningRouters[0] : undefined;
                    if (routerStem !== undefined && routerStemSet.has(routerStem)) {
                        registration = 'via-router';
                        routerTrigger = `${entry.prefix}${routerStem}`;
                    }
                }
                surfaces.push({ trigger, kind, scope, destPath, registration, routerTrigger, shadowedBy: null });
            }
        }
    }
    // Winner computation, per trigger string, across every scope/kind candidate.
    const groups = new Map();
    for (const surface of surfaces) {
        const group = groups.get(surface.trigger);
        if (group) {
            group.push(surface);
        }
        else {
            groups.set(surface.trigger, [surface]);
        }
    }
    for (const group of groups.values()) {
        if (group.length <= 1)
            continue; // sole candidate: unshadowed by construction
        let winner = group[0];
        for (let i = 1; i < group.length; i++) {
            const candidate = group[i];
            if (isHigherPriority(candidate, winner, precedenceRank))
                winner = candidate;
        }
        for (const surface of group) {
            if (surface !== winner) {
                surface.shadowedBy = { kind: winner.kind, scope: winner.scope };
            }
        }
    }
    return surfaces;
}
module.exports = { resolveRuntimeArtifactLayout, resolveRuntimeArtifactLayoutFromRegistry, findInstallSourceRoot, resolveTriggerSurface, isNamespacedByDir, composeCommandFilename };
