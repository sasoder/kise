export type ComponentEntry = {
  name: string;
  path: string;
  description: string;
  tags: string[];
};

export const registry: ComponentEntry[] = [
  {
    name: 'GeneratedScene',
    path: 'generated/components/GeneratedScene.tsx',
    description: 'Minimal intro/title scene with spring animation.',
    tags: ['intro', 'title'],
  },
];
