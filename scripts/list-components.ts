import { registry } from '../src/lib/component-registry';

for (const item of registry) {
  console.log(`- ${item.name}`);
  console.log(`  ${item.description}`);
  console.log(`  path: ${item.path}`);
  console.log(`  tags: ${item.tags.join(', ')}`);
}
