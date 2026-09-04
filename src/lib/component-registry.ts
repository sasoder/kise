export type ComponentEntry = {
  name: string;
  path: string;
  description: string;
  tags: string[];
};

// Entries are added only after a generated scene is explicitly approved as reusable.
export const registry: ComponentEntry[] = [
  {
    name: "SprawlingProjectV2",
    path: "generated/components/SprawlingProjectV2.tsx",
    description:
      "Agents spawn from the OpenAI mark, snap into a staircase tree with sprouting twigs; camera visits three branches (an ink ring read inward, three ink bars rewritten, a cluster that sacrifices a few) then pulls back. Grid background, 24fps.",
    tags: ["dwarkesh", "grid", "agents", "tree", "tracking-camera", "24fps"],
  },
  {
    name: "SubjectiveLongTimeV2",
    path: "generated/components/SubjectiveLongTimeV2.tsx",
    description:
      "The tree folds sideways onto its own spine, the spine stretches off the bottom of the frame with streaming ticks, a playhead rises to the start where three task rings fill from the centre outward. Grid background, 24fps.",
    tags: ["dwarkesh", "grid", "timeline", "time-dilation", "24fps"],
  },
  {
    name: "MessageBoardV2",
    path: "generated/components/MessageBoardV2.tsx",
    description:
      "A crowd of 1,200 agents posting threads to each other; ring one, pull back to all, a white scan searches for an outward thread, the human listens above, the board escalates and pours into a single point beneath an ink line. Grid background, 24fps.",
    tags: ["dwarkesh", "grid", "crowd", "threads", "scan", "human", "24fps"],
  },
  {
    name: "NoneAlertedTiersV2",
    path: "generated/components/NoneAlertedTiersV2.tsx",
    description:
      "A funnel of counts: many agents lift out of the crowd into a band, a rare few rise into a locked row, an empty dashed slot draws under the human, a white check sweeps every case and finds none. Grid background, 24fps.",
    tags: ["dwarkesh", "grid", "crowd", "tiers", "human", "24fps"],
  },
];
