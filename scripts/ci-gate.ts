import { execSync } from 'child_process';

function run(cmd: string) {
  execSync(cmd, { stdio: 'inherit' });
}

try {
  run('npm run lint:caf');
  run('npm run check:selectors');
  run('npm run check:duplicates');
  run('npm run check:registry');
  run('npm run check:governance');
  run('npm run ci:promotion -- --ci');
  console.log('CI Gate passed.');
} catch (err) {
  console.error('CI Gate failed.');
  process.exit(1);
}