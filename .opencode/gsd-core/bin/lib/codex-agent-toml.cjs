"use strict";
/**
 * Codex Agent TOML — typed IR for `~/.codex/agents/<agent>.toml` (#3243, ADR-2313).
 *
 * A genuine leaf: node builtins only. This is a **document model**, not a policy —
 * it knows how to parse/render/strip two known keys (`model`,
 * `model_reasoning_effort`) from a Codex agent `.toml`. It does NOT know which
 * `model` values are illegal for Codex (that predicate — Anthropic-flavored
 * detection — stays in `model-catalog.cts`; callers decide what to strip).
 *
 * Moved here (not copied) from `agent-install-check.cts` (#3242, Phase 2), which
 * wrote the hard half: block-range detection, BOM stripping, TOML value
 * unquoting, and the lenient header scan. That module's behavior is UNCHANGED —
 * it imports `stripBOM`/`scanTomlLines` from here and its regression suite
 * (`tests/agent-install-check.test.cjs`) is the proof.
 *
 * ── The reconciliation (40-design.md) ──────────────────────────────────────
 *
 * Phase 2's reader and this phase's writer disagree on how to handle an
 * unterminated `developer_instructions` block, deliberately:
 *
 *   - The READER (`scanTomlLines`, used directly by `checkCodexModelPosture`)
 *     stays LENIENT: an unterminated block still excludes "the rest of the
 *     file" from the header scan (findDeveloperInstructionsBlockRange's
 *     existing fallback), because misreading prompt prose as a pin is only a
 *     false positive — it wastes a user's time, nothing more.
 *   - The WRITER (`parseCodexAgentToml`, used by the Codex sync) is STRICT: an
 *     unterminated block makes the whole document `{ok:false}`, because a
 *     writer that proceeds on a malformed document risks rewriting it.
 *
 * One block-range detector, two call sites, two policies — never two detectors
 * that could silently drift from each other.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PARSE_REASON = void 0;
exports.stripBOM = stripBOM;
exports.unquoteTomlValue = unquoteTomlValue;
exports.findDeveloperInstructionsBlockRange = findDeveloperInstructionsBlockRange;
exports.scanTomlLines = scanTomlLines;
exports.parseCodexAgentToml = parseCodexAgentToml;
exports.renderCodexAgentToml = renderCodexAgentToml;
exports.stripModel = stripModel;
exports.stripReasoningEffort = stripReasoningEffort;
/** Frozen reason enum for a failed {@link parseCodexAgentToml}. */
exports.PARSE_REASON = Object.freeze({
    UNTERMINATED_BLOCK: 'unterminated_block',
});
// The UTF-8 BOM codepoint, spelled as an escape rather than the literal
// character so the source file never carries an invisible codepoint.
const BOM_CHAR = String.fromCharCode(0xfeff);
// Strips a leading UTF-8 BOM (U+FEFF), which fs.readFileSync(..., 'utf8') does not
// strip on its own, and unwraps a TOML basic/literal string value's surrounding
// quotes so `model = "sonnet"` yields `sonnet`, not `"sonnet"`.
function stripBOM(content) {
    return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}
function unquoteTomlValue(rawValue) {
    const trimmed = rawValue.trim();
    const quoted = trimmed.match(/^"([^"]*)"/) ?? trimmed.match(/^'([^']*)'/);
    return quoted ? quoted[1] : trimmed;
}
// The `developer_instructions` block is a TOML multi-line literal string
// (`developer_instructions = '''...'''`) that `generateCodexAgentToml` always
// emits after the header fields. Prompt prose inside that block discusses models
// constantly, so a `model = ...`-shaped line inside it must never be read as a
// live pin — but the block can legally appear anywhere in the file (a
// hand-reordered agent can move `model` after it), and another key's *value* can
// legally contain the literal text `developer_instructions = '''` (e.g. a
// `description` field quoting it) without that being the real block opener. So
// instead of truncating the file at the first textual occurrence of the marker
// anywhere in the content, this locates the block by its anchored line-start
// opener (`^\s*developer_instructions\s*=\s*'''`, never a mid-line/mid-value
// match) and its closing `'''` line, and excludes only the lines between them —
// every other line in the file, before AND after the block, is scanned.
//
// If no opener is found, nothing is excluded (the whole file is scanned) and
// `terminated` is trivially true. If the block IS opened but never closed before
// EOF (malformed file), `terminated` is false: the lenient reader (scanTomlLines)
// still treats the rest of the file as inside the block (the safe direction for
// a reader — see module header comment); the strict writer (parseCodexAgentToml)
// reads `terminated` and refuses instead. The emitter always uses `'''` (a TOML
// literal string), never a `"""` basic multi-line string, so only `'''` is
// treated as the block delimiter here.
function findDeveloperInstructionsBlockRange(lines) {
    const openIndex = lines.findIndex((line) => /^\s*developer_instructions\s*=\s*'''/.test(line));
    if (openIndex === -1) {
        return { start: -1, end: -1, terminated: true };
    }
    const afterOpenMarker = lines[openIndex].replace(/^\s*developer_instructions\s*=\s*'''/, '');
    if (afterOpenMarker.includes("'''")) {
        // Same-line block: developer_instructions = '''one line'''
        return { start: openIndex, end: openIndex, terminated: true };
    }
    for (let i = openIndex + 1; i < lines.length; i++) {
        if (lines[i].includes("'''")) {
            return { start: openIndex, end: i, terminated: true };
        }
    }
    return { start: openIndex, end: lines.length - 1, terminated: false };
}
// Line-oriented scan of every line OUTSIDE the `developer_instructions` block
// (see findDeveloperInstructionsBlockRange). Full-key-name anchoring —
// `^([A-Za-z_][\w]*)\s*=` for a bare key, or `^"([^"]*)"\s*=` / `^'([^']*)'\s*=`
// for TOML's legal quoted-key forms, normalized to the same key name — means
// `model_verbosity` / `model_reasoning_effort` never satisfy a `model` probe,
// and vice versa; `#`-prefixed lines (after trimming leading whitespace) are
// treated as comments, never live pins. Shared by both scanTomlLines (the
// lenient reader, boolean-only for reasoning effort) and parseCodexAgentToml
// (the strict writer, which also needs the effort's value and both keys' line
// indices so stripModel/stripReasoningEffort can remove exactly one line).
function scanHeaderLines(lines, blockStart, blockEnd) {
    let model = null;
    let modelLineIndex = null;
    let reasoningEffort = null;
    let reasoningEffortLineIndex = null;
    for (let i = 0; i < lines.length; i++) {
        if (blockStart !== -1 && i >= blockStart && i <= blockEnd)
            continue;
        const trimmed = lines[i].trim();
        if (trimmed === '' || trimmed.startsWith('#'))
            continue;
        const match = trimmed.match(/^(?:"([^"]*)"|'([^']*)'|([A-Za-z_][\w]*))\s*=\s*(.*)$/);
        if (!match)
            continue;
        const key = match[1] ?? match[2] ?? match[3];
        const rawValue = match[4];
        if (key === 'model') {
            model = unquoteTomlValue(rawValue);
            modelLineIndex = i;
        }
        else if (key === 'model_reasoning_effort') {
            reasoningEffort = unquoteTomlValue(rawValue);
            reasoningEffortLineIndex = i;
        }
    }
    return { model, modelLineIndex, reasoningEffort, reasoningEffortLineIndex };
}
/**
 * The LENIENT reader entry point (Phase 2, moved verbatim in behavior). Never
 * fails: an unterminated block falls back to "rest of file is inside the
 * block" via {@link findDeveloperInstructionsBlockRange}'s own fallback.
 * `content` is expected already BOM-stripped (callers pass `stripBOM(raw)`).
 */
function scanTomlLines(content) {
    const lines = content.split(/\r?\n/);
    const { start, end } = findDeveloperInstructionsBlockRange(lines);
    const { model, reasoningEffort } = scanHeaderLines(lines, start, end);
    return { model, hasReasoningEffort: reasoningEffort !== null };
}
// Splits `content` into `{lines, terminators}` where `terminators[i]` is the
// terminator that FOLLOWS `lines[i]` (`'\r\n'`, `'\r'`, `'\n'`, or `''` for a
// line with none — only possible as the file's last line). The two arrays are
// always the same length and there is NEVER a phantom trailing entry: a
// source ending in a terminator (the common case) yields exactly as many
// lines as it has content lines, not one more. `render` is then a plain
// `lines[i] + terminators[i]` concatenation with no special-casing of "the
// last line" — see `renderCodexAgentToml`.
//
// `String#split` with a capturing group interleaves the delimiters into the
// result array — `"a\r\nb\nc".split(/(\r\n|\r|\n)/)` yields
// `["a","\r\n","b","\n","c"]` — so even indices are line content and odd
// indices are that line's terminator. When `content` ends WITH a terminator,
// `split` appends one extra empty-string element after the last real
// terminator (e.g. `"a\n".split(...)` → `["a","\n",""]`); that trailing `""`
// is not a real line, it is `split`'s "nothing after the last delimiter"
// marker, so the loop below stops before consuming it instead of recording it
// as a phantom empty final line (the defect this replaced — see A29: a doc
// with a phantom last element made every removal rule reason about the wrong
// element for any trailing-newline-terminated file, the common case). `\r\n`
// is tried before the bare `\r` alternative so a CRLF is never misread as a
// lone-CR line followed by an empty LF-terminated line.
function splitPreservingTerminators(content) {
    if (content === '')
        return { lines: [], terminators: [] };
    const parts = content.split(/(\r\n|\r|\n)/);
    const lastIndex = parts.length - 1;
    const lines = [];
    const terminators = [];
    for (let i = 0; i < parts.length; i += 2) {
        if (i === lastIndex && parts[i] === '')
            break; // split's post-terminator marker, not a real line
        lines.push(parts[i]);
        terminators.push(parts[i + 1] ?? '');
    }
    return { lines, terminators };
}
/**
 * The STRICT parse entry point (Phase 3, the writer's half of the
 * reconciliation). Returns `{ok:false, reason:UNTERMINATED_BLOCK}` rather than
 * guessing when the `developer_instructions` block is opened but never closed.
 * On success, `doc` carries enough (the original `lines`/`terminators`, BOM/
 * trailing-newline flags, and the two resolved values with their line indices)
 * for {@link renderCodexAgentToml} to reproduce the source byte-identically —
 * including a source with mixed line-ending styles — and for
 * {@link stripModel}/{@link stripReasoningEffort} to remove exactly one line
 * and its own terminator.
 */
function parseCodexAgentToml(content) {
    const hadBOM = content.charCodeAt(0) === 0xfeff;
    const stripped = stripBOM(content);
    // Informational only — see CodexAgentDoc.eol's docstring. Never used by
    // renderCodexAgentToml.
    const eol = stripped.includes('\r\n') ? '\r\n' : '\n';
    const trailingNewline = /(\r\n|\r|\n)$/.test(stripped);
    const { lines, terminators } = splitPreservingTerminators(stripped);
    const { start, end, terminated } = findDeveloperInstructionsBlockRange(lines);
    if (start !== -1 && !terminated) {
        return { ok: false, reason: exports.PARSE_REASON.UNTERMINATED_BLOCK };
    }
    const { model, modelLineIndex, reasoningEffort, reasoningEffortLineIndex } = scanHeaderLines(lines, start, end);
    const doc = {
        lines,
        terminators,
        eol,
        hadBOM,
        trailingNewline,
        blockRange: { start, end },
        model,
        modelLineIndex,
        reasoningEffort,
        reasoningEffortLineIndex,
    };
    return { ok: true, doc };
}
/**
 * Renders `doc` back to a string. For an unmodified doc this is
 * byte-identical to the original `parseCodexAgentToml` input (matrix row
 * A14) — it never re-derives line content, only rejoins each line with its
 * OWN recorded terminator (`terminators[i]`, never the whole-file `eol`) and
 * re-prepends a BOM if one was present. This is a plain concatenation of the
 * surviving `[line, terminator]` pieces, so a source with mixed `\r\n`/`\n`/
 * lone-`\r` line endings round-trips exactly, and a strip
 * ({@link stripModel}/{@link stripReasoningEffort}) removes only the target
 * line and its own terminator — every other line's ending is untouched.
 */
function renderCodexAgentToml(doc) {
    let body = '';
    for (let i = 0; i < doc.lines.length; i++) {
        body += doc.lines[i] + (doc.terminators[i] ?? '');
    }
    return doc.hadBOM ? BOM_CHAR + body : body;
}
// Removes exactly one line (by index) — AND its own terminator — from
// `doc.lines`/`doc.terminators`, re-indexing the block range and the OTHER
// key's line index so a subsequent strip/render still sees a consistent doc.
// Never touches any other line's content or terminator.
//
// The one exception is when `index` names the file's LAST line: a plain
// slice-out would drop the removed line's terminator but leave the
// *previous* line's terminator standing in its place, which silently
// invents (or drops) a trailing newline the source never had — a middle-line
// removal never has this problem because the terminator that survives (the
// one that WAS between the previous line and the removed one) is exactly the
// terminator the new neighbors should have between them. For a last-line
// removal, the file's trailing-newline-or-not status lives in whether the
// REMOVED line's own terminator was empty (that is what `trailingNewline`
// was computed from) — so the new last line inherits the removed line's
// EMPTINESS only: if the removed terminator was `''`, the new last line's
// terminator is cleared to `''` too. If the removed terminator was
// non-empty, the source already ended with a newline and the new last line
// already has the right one (its OWN, unchanged) — overwriting it with the
// removed line's terminator would silently change the new last line's own
// ending style on a mixed-EOL source (see A26). Removing the only remaining
// line is the degenerate case: there is no new last line, so the result is
// the empty document.
function removeLine(doc, index, which) {
    const isLastLine = index === doc.lines.length - 1;
    let lines;
    let terminators;
    if (doc.lines.length === 1) {
        lines = [];
        terminators = [];
    }
    else if (isLastLine) {
        lines = doc.lines.slice(0, index);
        terminators = doc.terminators.slice(0, index);
        // Inherit the removed line's EMPTINESS, never its STYLE: if the removed
        // line had no terminator (the source had no trailing newline), the new
        // last line's terminator becomes '' too. Otherwise the source DID end
        // with a newline, and the new last line already has the right one — its
        // OWN terminator (already carried over by the slice above), which may
        // differ in style from the removed line's (a mixed-EOL source) — so it is
        // left unchanged rather than overwritten.
        if (doc.terminators[index] === '') {
            terminators[terminators.length - 1] = '';
        }
    }
    else {
        lines = doc.lines.slice(0, index).concat(doc.lines.slice(index + 1));
        terminators = doc.terminators.slice(0, index).concat(doc.terminators.slice(index + 1));
    }
    const reindex = (i) => (i === null ? null : i > index ? i - 1 : i);
    const blockRange = { ...doc.blockRange };
    if (blockRange.start !== -1) {
        if (blockRange.start > index)
            blockRange.start -= 1;
        if (blockRange.end > index)
            blockRange.end -= 1;
    }
    return {
        ...doc,
        lines,
        terminators,
        blockRange,
        model: which === 'model' ? null : doc.model,
        modelLineIndex: which === 'model' ? null : reindex(doc.modelLineIndex),
        reasoningEffort: which === 'reasoningEffort' ? null : doc.reasoningEffort,
        reasoningEffortLineIndex: which === 'reasoningEffort' ? null : reindex(doc.reasoningEffortLineIndex),
    };
}
/**
 * Returns a new doc with the `model` line removed (a no-op copy if there was
 * no `model` line). Every other byte — comments, other keys, the
 * `developer_instructions` block, line endings, BOM — is untouched.
 */
function stripModel(doc) {
    if (doc.modelLineIndex === null)
        return doc;
    return removeLine(doc, doc.modelLineIndex, 'model');
}
/**
 * Returns a new doc with the `model_reasoning_effort` line removed (a no-op
 * copy if there was none). Every other byte is untouched.
 */
function stripReasoningEffort(doc) {
    if (doc.reasoningEffortLineIndex === null)
        return doc;
    return removeLine(doc, doc.reasoningEffortLineIndex, 'reasoningEffort');
}
