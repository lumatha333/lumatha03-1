import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);
const readArgValue = (flag) => {
  const idx = args.indexOf(flag);
  if (idx === -1) return undefined;
  return args[idx + 1];
};

const skipBuild = hasFlag('--skip-build');
const noPush = hasFlag('--no-push');
const customMessage = readArgValue('--message') || process.env.SHIP_MESSAGE;

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    shell: false,
    ...options,
  });

  if (result.error) {
    console.error(`Failed to run ${command}:`, result.error.message);
    process.exit(1);
  }

  return result;
}

function runNpmBuild() {
  if (process.platform === 'win32') {
    return run('cmd', ['/c', 'npm run build']);
  }
  return run('npm', ['run', 'build']);
}

function runGit(commandArgs, options = {}) {
  return run('git', commandArgs, options);
}

function runGitCapture(commandArgs) {
  const result = spawnSync('git', commandArgs, {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf-8',
  });

  if (result.error) {
    console.error(`Failed to run git ${commandArgs.join(' ')}:`, result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    const err = (result.stderr || '').trim();
    if (err) console.error(err);
    process.exit(result.status || 1);
  }

  return (result.stdout || '').trim();
}

function hasStagedChanges() {
  const result = spawnSync('git', ['diff', '--cached', '--quiet'], { stdio: 'ignore' });
  // git diff --quiet:
  // 0 = no changes, 1 = changes
  return result.status === 1;
}

function createCommitMessage() {
  if (customMessage) return customMessage;

  const now = new Date();
  const iso = now.toISOString().replace('T', ' ').slice(0, 19);
  return `chore: ship ${iso}`;
}

const branch = runGitCapture(['rev-parse', '--abbrev-ref', 'HEAD']);

if (branch === 'HEAD') {
  console.error('Detached HEAD detected. Checkout a branch before shipping.');
  process.exit(1);
}

if (!skipBuild) {
  console.log('\n[ship] Running build...');
  const build = runNpmBuild();
  if (build.status !== 0) {
    console.error('[ship] Build failed. Stopping release.');
    process.exit(build.status || 1);
  }
}

console.log('\n[ship] Staging changes...');
const add = runGit(['add', '-A']);
if (add.status !== 0) process.exit(add.status || 1);

if (!hasStagedChanges()) {
  console.log('[ship] No changes to commit. Nothing to push/deploy.');
  process.exit(0);
}

const commitMessage = createCommitMessage();
console.log(`\n[ship] Committing with message: ${commitMessage}`);
const commit = runGit(['commit', '-m', commitMessage]);
if (commit.status !== 0) process.exit(commit.status || 1);

if (noPush) {
  console.log('[ship] Commit done. Push skipped (--no-push).');
  process.exit(0);
}

console.log(`\n[ship] Pushing to origin/${branch}...`);
const push = runGit(['push', 'origin', branch]);
if (push.status !== 0) process.exit(push.status || 1);

console.log('\n[ship] Done. GitHub push completed. If Vercel is connected to this branch, deployment is now triggered.');
