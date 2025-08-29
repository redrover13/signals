#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
LOG="/tmp/nx_test_errors.log"
APPLY=false

if [[ "${1:-}" == "--apply" ]]; then
  APPLY=true
fi

echo "Running nx test to capture errors (this may take a while)..."
# Run tests and capture output (don't fail the script if tests fail)
pnpm nx run-many --target=test --all --parallel=false 2>&1 | tee "$LOG" || true

echo "Scanning for TypeScript/Jest error patterns in $LOG"

python3 - <<'PY'
import re, subprocess, sys, os, shutil

root = os.getcwd()
log = '/tmp/nx_test_errors.log'
with open(log, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

pairs = []
# Pattern: Module '...path...' has no exported member 'Member'
for m in re.finditer(r"Module '\"?([^'\"]+)\"?' has no exported member '\"?([^'\"]+)\"?'", text):
    mod, member = m.group(1), m.group(2)
    pairs.append(('missing_export', mod, member))

# Pattern: Cannot find module '...path...' or its corresponding type declarations.
for m in re.finditer(r"Cannot find module '\"?([^'\"]+)\"?' or its corresponding type declarations", text):
    mod = m.group(1)
    pairs.append(('missing_module', mod, None))

if not pairs:
    print('No missing-module or missing-export patterns found in nx test output.')
    sys.exit(0)

files = subprocess.check_output(['git','ls-files'], cwd=root, text=True).splitlines()

def find_candidates(module_path):
    # Normalize module path, try matching file endings
    candidates = []
    mod = module_path.rstrip('/')
    basename = os.path.basename(mod)
    for f in files:
        if f.endswith(mod + '.ts') or f.endswith(mod + '.tsx') or f.endswith(mod + '.js') or f.endswith(mod + '.d.ts'):
            candidates.append(f)
        # also try ending with /index.ts
        if f.endswith(os.path.join(mod, 'index.ts')) or f.endswith(os.path.join(mod, 'index.js')):
            candidates.append(f)
        # fallback: exact basename match
        if os.path.basename(f) == basename + '.ts' or os.path.basename(f) == basename + '.tsx' or os.path.basename(f) == basename + '.js':
            candidates.append(f)
    # de-dup
    return sorted(set(candidates))

def backup(path):
    bak = path + '.autofix.bak'
    if not os.path.exists(bak):
        shutil.copyfile(path, bak)

apply = os.environ.get('FIX_MCP_APPLY','') == '1' or ('--apply' in sys.argv)

for kind, mod, member in pairs:
    print('---')
    if kind == 'missing_export':
        print(f"Missing export '{member}' from module '{mod}'")
        candidates = find_candidates(mod)
        if not candidates:
            print(f"  No candidate file found for module '{mod}'. Consider adding the module file at libs/.../ or fixing the import path.")
            continue
        target = candidates[0]
        print(f"  Candidate file: {target}")
        # Check if member already exists
        with open(target,'r',encoding='utf-8',errors='ignore') as tf:
            content = tf.read()
        if re.search(rf"export\s+(const|function|class|enum|type)\s+{re.escape(member)}\b", content):
            print(f"  Member '{member}' already appears exported in {target} (skipping).")
            continue
        if apply:
            print(f"  Applying stub export for '{member}' into {target}")
            backup(target)
            stub = f"\n// AUTO-STUB: added by scripts/fix-mcp-errors.sh to satisfy tests\nexport const {member} = (...args: any[]) => {{ throw new Error('AUTO-STUB: {member}'); }};\n"
            with open(target,'a',encoding='utf-8') as tf:
                tf.write(stub)
        else:
            print(f"  Suggested fix: append a stub export to {target}:")
            print(f"    export const {member} = (...args: any[]) => {{ throw new Error('AUTO-STUB: {member}'); }};")

    elif kind == 'missing_module':
        print(f"Missing module '{mod}' (cannot find module or its type declarations)")
        candidates = find_candidates(mod)
        #!/usr/bin/env bash
        set -euo pipefail

        ROOT="$(pwd)"
        LOG="/tmp/nx_test_errors.log"

        echo "Running nx test to capture errors (dry-run) and writing log to $LOG"
        # Run tests and capture output (don't fail the script if tests fail)
        pnpm nx run-many --target=test --all --parallel=false 2>&1 | tee "$LOG" || true

        echo "Scanning for TypeScript/Jest error patterns in $LOG"

        python3 - <<'PY'
        import re, subprocess, sys, os

        root = os.getcwd()
        log = '/tmp/nx_test_errors.log'
        with open(log, 'r', encoding='utf-8', errors='ignore') as f:
            text = f.read()

        matches = []

        # Missing export: Module 'x' has no exported member 'Y'
        for m in re.finditer(r"Module '\"?([^'\"]+)\"?' has no exported member '\"?([^'\"]+)\"?'", text):
            matches.append(('missing_export', m.group(1), m.group(2)))

        # Cannot find module 'x' or its corresponding type declarations
        for m in re.finditer(r"Cannot find module '\"?([^'\"]+)\"?' or its corresponding type declarations", text):
            matches.append(('missing_module', m.group(1), None))

        if not matches:
            print('No missing-module or missing-export patterns found in nx test output.')
            sys.exit(0)

        files = subprocess.check_output(['git','ls-files'], cwd=root, text=True).splitlines()

        def find_candidates(module_path):
            mod = module_path.rstrip('/')
            candidates = [f for f in files if f.endswith(mod + '.ts') or f.endswith(mod + '.tsx') or f.endswith(mod + '/index.ts')]
            return candidates

        for kind, mod, member in matches:
            print('---')
            if kind == 'missing_export':
                print(f"Missing export '{member}' from module '{mod}'")
                cand = find_candidates(mod)
                if cand:
                    print('  Candidate files:')
                    for c in cand[:3]:
                        print('   -', c)
                else:
                    print('  No local candidate found. Consider fixing the import path or adding the export to the library.')
            else:
                print(f"Missing module '{mod}' (cannot find module or types)")
                cand = find_candidates(mod)
                if cand:
                    print('  Candidate files:')
                    for c in cand[:3]:
                        print('   -', c)
                else:
                    print('  Suggest creating a minimal stub under libs/<name>/src or correcting the import path.')

        print('\nDry-run complete. To apply automated safe stubs use the --apply flag (NOT implemented in this dry-run script).')
        PY

        echo "Finished scan. Inspect $LOG for full test output."
};
