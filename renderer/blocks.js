// Custom Blockly blocks for drone movement

Blockly.defineBlocksWithJsonArray([
  // Move Forward
  {
    type: 'move_forward',
    message0: '🚁 Move Forward',
    previousStatement: null,
    nextStatement: null,
    colour: '#4C97FF',
    tooltip: 'Move the drone one step forward',
  },
  // Turn Left
  {
    type: 'turn_left',
    message0: '⬅️ Turn Left',
    previousStatement: null,
    nextStatement: null,
    colour: '#9966FF',
    tooltip: 'Turn the drone to the left',
  },
  // Turn Right
  {
    type: 'turn_right',
    message0: '➡️ Turn Right',
    previousStatement: null,
    nextStatement: null,
    colour: '#CF63CF',
    tooltip: 'Turn the drone to the right',
  },
  // Repeat N times
  {
    type: 'repeat_times',
    message0: '🔁 Repeat %1 times',
    args0: [
      {
        type: 'field_number',
        name: 'TIMES',
        value: 2,
        min: 1,
        max: 10,
      },
    ],
    message1: 'do %1',
    args1: [
      {
        type: 'input_statement',
        name: 'DO',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#FF8C1A',
    tooltip: 'Repeat the blocks inside a number of times',
  },
]);

// JavaScript generators
javascript.javascriptGenerator.forBlock['move_forward'] = function (block) {
  return 'moveForward();\n';
};

javascript.javascriptGenerator.forBlock['turn_left'] = function (block) {
  return 'turnLeft();\n';
};

javascript.javascriptGenerator.forBlock['turn_right'] = function (block) {
  return 'turnRight();\n';
};

javascript.javascriptGenerator.forBlock['repeat_times'] = function (block) {
  const times = block.getFieldValue('TIMES');
  const branch = javascript.javascriptGenerator.statementToCode(block, 'DO');
  return `for (var i = 0; i < ${times}; i++) {\n${branch}}\n`;
};
