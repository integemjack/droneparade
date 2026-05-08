// Main application logic

(function () {
  const canvas = document.getElementById('paradeCanvas');
  const grid = new ParadeGrid(canvas);
  let currentLevel = 0;
  let workspace = null;

  // Initialize Blockly workspace
  function initBlockly() {
    workspace = Blockly.inject('blocklyDiv', {
      toolbox: document.getElementById('toolbox'),
      media: '../node_modules/blockly/media/',
      scrollbars: true,
      trashcan: true,
      zoom: {
        controls: true,
        startScale: 1.0,
        maxScale: 2,
        minScale: 0.5,
        scaleSpeed: 1.1,
      },
      grid: {
        spacing: 20,
        length: 3,
        colour: '#e0e0e0',
        snap: true,
      },
      renderer: 'zelos',
      theme: Blockly.Theme.defineTheme('parade', {
        base: Blockly.Themes.Classic,
        fontStyle: {
          family: 'Segoe UI, Helvetica Neue, Arial, sans-serif',
          weight: 'bold',
          size: 13,
        },
      }),
    });

    // Handle resize
    window.addEventListener('resize', () => {
      Blockly.svgResize(workspace);
    });
  }

  // Parse generated code into command list
  function parseCommands(code) {
    const commands = [];
    // Simple interpreter: extract function calls
    const lines = code.split('\n');
    const stack = []; // for loop handling

    function processLines(lines) {
      let i = 0;
      while (i < lines.length) {
        const line = lines[i].trim();
        if (line === 'moveForward();') {
          commands.push('forward');
        } else if (line === 'turnLeft();') {
          commands.push('left');
        } else if (line === 'turnRight();') {
          commands.push('right');
        } else if (line.startsWith('for ')) {
          // Extract repeat count
          const match = line.match(/i < (\d+)/);
          const times = match ? parseInt(match[1]) : 1;
          // Gather loop body
          const bodyLines = [];
          i++;
          let depth = 1;
          while (i < lines.length && depth > 0) {
            const l = lines[i].trim();
            if (l === '}') {
              depth--;
              if (depth === 0) break;
            }
            if (l.includes('{')) depth++;
            bodyLines.push(lines[i]);
            i++;
          }
          // Repeat body
          for (let t = 0; t < times; t++) {
            processLines(bodyLines);
          }
        }
        i++;
      }
    }

    processLines(lines);
    return commands;
  }

  // Load a level
  function loadLevel(idx) {
    if (idx < 0 || idx >= LEVELS.length) return;
    currentLevel = idx;
    const level = LEVELS[idx];
    grid.loadLevel(level);
    workspace.clear();
    document.getElementById('level-label').textContent = `Level ${idx + 1}: ${level.name}`;
    document.getElementById('stars').textContent = '⭐⭐⭐';
    hideMessage();
    showHint(level.hint);
  }

  // Show hint briefly
  function showHint(text) {
    const box = document.getElementById('message-box');
    box.textContent = '💡 ' + text;
    box.className = '';
    box.style.background = 'rgba(255,249,196,0.95)';
    box.style.color = '#5d4037';
    box.style.fontSize = '16px';
    setTimeout(() => {
      box.className = 'hidden';
    }, 4000);
  }

  function showMessage(text, color) {
    const box = document.getElementById('message-box');
    box.textContent = text;
    box.className = '';
    box.style.background = 'rgba(255,255,255,0.95)';
    box.style.color = color || '#333';
    box.style.fontSize = '22px';
  }

  function hideMessage() {
    document.getElementById('message-box').className = 'hidden';
  }

  // Build Blockly blocks from a solution definition
  // Returns an array of top-level blocks placed in the workspace
  function buildSolutionBlocks(solution) {
    const blocks = [];
    let yOffset = 30;

    function createBlock(item) {
      const block = workspace.newBlock(item.type);
      if (item.type === 'repeat_times' && item.times) {
        block.setFieldValue(String(item.times), 'TIMES');
      }
      block.initSvg();
      block.render();
      return block;
    }

    let prevBlock = null;
    for (const item of solution) {
      const block = createBlock(item);
      if (!prevBlock) {
        block.moveBy(30, yOffset);
      } else {
        prevBlock.nextConnection.connect(block.previousConnection);
      }

      if (item.children && item.children.length > 0) {
        let prevChild = null;
        for (const child of item.children) {
          const childBlock = createBlock(child);
          if (!prevChild) {
            block.getInput('DO').connection.connect(childBlock.previousConnection);
          } else {
            prevChild.nextConnection.connect(childBlock.previousConnection);
          }
          prevChild = childBlock;
        }
      }

      prevBlock = block;
      blocks.push(block);
    }
    return blocks;
  }

  // Animate placing blocks one by one, then auto-run
  async function runHelpDemo() {
    const level = LEVELS[currentLevel];
    if (!level.solution) return;

    // Reset everything
    grid.loadLevel(level);
    workspace.clear();
    hideMessage();

    showMessage('💡 Watch and learn...', '#7c4dff');

    const solution = level.solution;
    const createdBlocks = [];
    let prevBlock = null;

    for (let i = 0; i < solution.length; i++) {
      await new Promise(r => setTimeout(r, 500));

      const item = solution[i];
      const block = workspace.newBlock(item.type);
      if (item.type === 'repeat_times' && item.times) {
        block.setFieldValue(String(item.times), 'TIMES');
      }
      block.initSvg();
      block.render();

      if (!prevBlock) {
        block.moveBy(30, 30);
      } else {
        prevBlock.nextConnection.connect(block.previousConnection);
      }

      // If this block has children (loop body), add them with animation
      if (item.children && item.children.length > 0) {
        let prevChild = null;
        for (const child of item.children) {
          await new Promise(r => setTimeout(r, 400));
          const childBlock = workspace.newBlock(child.type);
          childBlock.initSvg();
          childBlock.render();
          if (!prevChild) {
            block.getInput('DO').connection.connect(childBlock.previousConnection);
          } else {
            prevChild.nextConnection.connect(childBlock.previousConnection);
          }
          prevChild = childBlock;
        }
      }

      prevBlock = block;
      createdBlocks.push(block);
    }

    // Brief pause before running
    await new Promise(r => setTimeout(r, 800));
    hideMessage();

    // Now auto-run the solution
    grid.loadLevel(level);
    const code = javascript.javascriptGenerator.workspaceToCode(workspace);
    const commands = parseCommands(code);

    document.getElementById('btn-help').disabled = true;
    document.getElementById('btn-run').disabled = true;
    const result = await grid.executeCommands(commands);
    document.getElementById('btn-help').disabled = false;
    document.getElementById('btn-run').disabled = false;

    if (result === 'win') {
      showMessage('🎉 That\'s how it\'s done! Now try it yourself!', '#2e7d32');
      // Clear blocks after 3 seconds so students can try themselves
      setTimeout(() => {
        workspace.clear();
        grid.loadLevel(level);
        hideMessage();
      }, 3000);
    }
  }

  // Help button
  document.getElementById('btn-help').addEventListener('click', async () => {
    if (grid.animating) return;
    await runHelpDemo();
  });

  // Run button
  document.getElementById('btn-run').addEventListener('click', async () => {
    if (grid.animating) return;
    hideMessage();

    // Reset grid to start position before running
    grid.loadLevel(LEVELS[currentLevel]);

    const code = javascript.javascriptGenerator.workspaceToCode(workspace);
    if (!code.trim()) {
      showMessage('🤔 Add some blocks first!', '#ef6c00');
      return;
    }

    const commands = parseCommands(code);
    if (commands.length === 0) {
      showMessage('🤔 Add some blocks first!', '#ef6c00');
      return;
    }

    // Disable run button during animation
    document.getElementById('btn-run').disabled = true;
    const result = await grid.executeCommands(commands);
    document.getElementById('btn-run').disabled = false;

    if (result === 'win') {
      showMessage('🎉 Amazing! You did it!', '#2e7d32');
      // Auto advance after delay
      setTimeout(() => {
        if (currentLevel < LEVELS.length - 1) {
          loadLevel(currentLevel + 1);
        } else {
          showMessage('🏆 You completed all levels! You\'re a coding star!', '#f57f17');
        }
      }, 2500);
    } else if (result === 'crash') {
      showMessage('💥 Oops! The drone hit a wall! Try again.', '#c62828');
    } else {
      showMessage('🤔 Almost! Collect all the items on the path.', '#ef6c00');
    }
  });

  // Reset button
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (grid.animating) return;
    grid.loadLevel(LEVELS[currentLevel]);
    workspace.clear();
    hideMessage();
  });

  // Level navigation
  document.getElementById('btn-prev-level').addEventListener('click', () => {
    if (grid.animating) return;
    if (currentLevel > 0) loadLevel(currentLevel - 1);
  });

  document.getElementById('btn-next-level').addEventListener('click', () => {
    if (grid.animating) return;
    if (currentLevel < LEVELS.length - 1) loadLevel(currentLevel + 1);
  });

  // Initialize
  initBlockly();
  loadLevel(0);
})();
