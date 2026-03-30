export type ComponentEntry = {
  name: string;
  path: string;
  description: string;
  tags: string[];
};

// Entries are added only after a generated scene is explicitly approved as reusable.
export const registry: ComponentEntry[] = [];
