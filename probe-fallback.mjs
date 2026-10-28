// ESM + tsx-free probe of the rewritten deterministic generator via a tiny build
import { execSync } from 'node:child_process';
// Compile just the generator (plus its imports) to JS in a temp dir using tsc paths.
execSync('npx tsc src/lib/rescue/actionGenerator.ts src/types/rescue.ts --outDir .fallback-test --module commonjs --target es2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx preserve', { stdio: 'inherit' });
