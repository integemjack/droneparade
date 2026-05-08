// Level definitions for the Drone Parade game
// Grid is 6x6. Cells can be:
//   'S' = start, 'E' = end (checkpoint finish)
//   'F' = flag, 'B' = balloon, 'C' = checkpoint
//   '.' = empty road, 'X' = blocked/building

// direction: 0=up, 1=right, 2=down, 3=left (drone starting direction)

const LEVELS = [
  {
    name: 'First Flight',
    hint: 'Use 3 Move Forward blocks to reach the flag!',
    startDir: 1, // facing right
    grid: [
      ['X', 'X', 'X', 'X', 'X', 'X'],
      ['X', 'X', 'X', 'X', 'X', 'X'],
      ['S', '.', '.', 'F', 'X', 'X'],
      ['X', 'X', 'X', 'X', 'X', 'X'],
      ['X', 'X', 'X', 'X', 'X', 'X'],
      ['X', 'X', 'X', 'X', 'X', 'X'],
    ],
    collectAll: ['F'],
    // Solution: just 3 forward blocks
    solution: [
      { type: 'move_forward' },
      { type: 'move_forward' },
      { type: 'move_forward' },
    ],
  },
  {
    name: 'Turn the Corner',
    hint: 'Move forward, then turn right, then move forward to the balloon!',
    startDir: 1,
    grid: [
      ['X', 'X', 'X', 'X', 'X', 'X'],
      ['X', 'X', '.', 'X', 'X', 'X'],
      ['S', '.', '.', 'X', 'X', 'X'],
      ['X', 'X', 'B', 'X', 'X', 'X'],
      ['X', 'X', 'X', 'X', 'X', 'X'],
      ['X', 'X', 'X', 'X', 'X', 'X'],
    ],
    collectAll: ['B'],
    solution: [
      { type: 'move_forward' },
      { type: 'move_forward' },
      { type: 'turn_right' },
      { type: 'move_forward' },
    ],
  },
  {
    name: 'Parade Route',
    hint: 'Collect the flag and the balloon, then reach the checkpoint!',
    startDir: 2, // facing down
    grid: [
      ['X', 'S', 'X', 'X', 'X', 'X'],
      ['X', '.', 'X', 'X', 'X', 'X'],
      ['X', 'F', '.', 'B', 'X', 'X'],
      ['X', 'X', 'X', '.', 'X', 'X'],
      ['X', 'X', 'X', 'C', 'X', 'X'],
      ['X', 'X', 'X', 'X', 'X', 'X'],
    ],
    collectAll: ['F', 'B', 'C'],
    solution: [
      { type: 'move_forward' },
      { type: 'move_forward' },
      { type: 'turn_left' },
      { type: 'move_forward' },
      { type: 'move_forward' },
      { type: 'turn_right' },
      { type: 'move_forward' },
      { type: 'move_forward' },
    ],
  },
  {
    name: 'Loop the Block',
    hint: 'Use a Repeat block to move forward 4 times!',
    startDir: 1,
    grid: [
      ['X', 'X', 'X', 'X', 'X', 'X'],
      ['X', 'X', 'X', 'X', 'X', 'X'],
      ['S', '.', '.', '.', 'F', 'X'],
      ['X', 'X', 'X', 'X', 'X', 'X'],
      ['X', 'X', 'X', 'X', 'X', 'X'],
      ['X', 'X', 'X', 'X', 'X', 'X'],
    ],
    collectAll: ['F'],
    // Demonstrate using a repeat loop
    solution: [
      { type: 'repeat_times', times: 4, children: [
        { type: 'move_forward' },
      ]},
    ],
  },
  {
    name: 'Zigzag Parade',
    hint: 'Navigate the zigzag path to collect all items!',
    startDir: 1,
    grid: [
      ['X', 'X', 'X', 'X', 'X', 'X'],
      ['S', '.', 'F', 'X', 'X', 'X'],
      ['X', 'X', '.', 'X', 'X', 'X'],
      ['X', 'X', '.', 'B', 'X', 'X'],
      ['X', 'X', 'X', '.', 'X', 'X'],
      ['X', 'X', 'X', 'C', 'X', 'X'],
    ],
    collectAll: ['F', 'B', 'C'],
    solution: [
      { type: 'move_forward' },
      { type: 'move_forward' },
      { type: 'turn_right' },
      { type: 'move_forward' },
      { type: 'move_forward' },
      { type: 'turn_left' },
      { type: 'move_forward' },
      { type: 'turn_right' },
      { type: 'move_forward' },
      { type: 'move_forward' },
    ],
  },
  {
    name: 'Grand Finale',
    hint: 'Plan your route carefully to collect everything!',
    startDir: 2,
    grid: [
      ['X', 'X', 'S', 'X', 'X', 'X'],
      ['X', 'X', '.', 'X', 'X', 'X'],
      ['X', 'F', '.', '.', 'B', 'X'],
      ['X', 'X', 'X', 'X', '.', 'X'],
      ['X', 'X', 'C', '.', '.', 'X'],
      ['X', 'X', 'X', 'X', 'X', 'X'],
    ],
    collectAll: ['F', 'B', 'C'],
    solution: [
      { type: 'move_forward' },
      { type: 'move_forward' },
      { type: 'turn_right' },
      { type: 'move_forward' },
      { type: 'turn_right' },
      { type: 'turn_right' },
      { type: 'move_forward' },
      { type: 'move_forward' },
      { type: 'move_forward' },
      { type: 'turn_right' },
      { type: 'move_forward' },
      { type: 'move_forward' },
      { type: 'turn_right' },
      { type: 'move_forward' },
      { type: 'move_forward' },
    ],
  },
];
