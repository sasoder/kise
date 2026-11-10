// Reviewed Swedish copy and forced-aligned word onsets (onset minus one frame).
// All frame offsets are local to startFrame at 60fps; supplied Abass edit is the source.
export const rounds = {
  "teeth": {
    "question": "Hur många permanenta tänder\nhar en vuxen vanligtvis?",
    "options": [
      "28",
      "32",
      "36"
    ],
    "optionFrames": [
      234,
      288,
      354
    ],
    "correct": 1,
    "revealFrame": 491,
    "startFrame": 256,
    "endFrame": 819,
    "label": "AbassQuizTeeth"
  },
  "spit": {
    "question": "Vad gör du direkt efter\ntandborstning?",
    "options": [
      "Skölja med vatten",
      "Bara spotta",
      "Skölja med munskölj"
    ],
    "optionFrames": [
      205,
      295,
      395
    ],
    "correct": 1,
    "revealFrame": 555,
    "startFrame": 819,
    "endFrame": 1453,
    "label": "AbassQuizSpit"
  },
  "between": {
    "question": "Vad rengör bäst\nmellan tänderna?",
    "options": [
      "Tandborsten",
      "Munskölj",
      "Tandtråd / mellanrumsborste"
    ],
    "optionFrames": [
      165,
      257,
      331
    ],
    "correct": 2,
    "revealFrame": 559,
    "startFrame": 1453,
    "endFrame": 2151,
    "label": "AbassQuizBetweenTeeth"
  },
  "caries": {
    "question": "Vad är vanligaste\norsaken till karies?",
    "options": [
      "Kallt eller varmt vatten",
      "Sockret i sig",
      "Bakterier som bildar syror"
    ],
    "optionFrames": [
      273,
      410,
      507
    ],
    "correct": 2,
    "revealFrame": 656,
    "startFrame": 2354,
    "endFrame": 3131,
    "label": "AbassQuizCaries"
  }
} as const;
