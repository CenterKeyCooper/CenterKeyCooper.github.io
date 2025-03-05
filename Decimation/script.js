const setupPhase = document.getElementById('setup-phase');
const phasesContainer = document.getElementById('phases-container');
const resultsDiv = document.getElementById('results');
const resultsText = document.getElementById('results-text');
const startGameButton = document.getElementById('start-game');

let players = [];
let phases = [];
let currentPhaseIndex = 0;

// Initialize the game
startGameButton.addEventListener('click', () => {
  players = Array.from({ length: 10 }, (_, i) => ({
    role: i + 1,
    name: document.getElementById(`player${i + 1}`).value,
    alive: true,
  }));
  setupPhase.classList.add('hidden');
  addPhase('night', 1);
});

// Add a new phase (night or day)
function addPhase(type, number) {
  const phase = document.createElement('section');
  phase.id = `${type}-phase-${number}`;
  phase.classList.add('phase');
  phase.innerHTML = `
    <h2>${type === 'night' ? 'Night' : 'Day'} ${number}</h2>
    ${type === 'night' ? renderNightPhase(number) : renderDayPhase(number)}
    <button class="confirm-phase">Confirm ${type === 'night' ? 'Night' : 'Day'}</button>
  `;
  phasesContainer.appendChild(phase);
  phases.push({ type, number, phase });
  currentPhaseIndex = phases.length - 1;
  phase.scrollIntoView({ behavior: 'smooth' });

  // Highlight potential deaths in night phase
  if (type === 'night') {
    highlightPotentialDeaths(phase);
  }
}

// Render night phase
function renderNightPhase(number) {
  return `
    <table class="night-table">
      <thead>
        <tr>
          <th>Role</th>
          <th>Player</th>
          <th>Attack</th>
          <th>Optional Action</th>
        </tr>
      </thead>
      <tbody>
        ${players
          .filter((p) => p.alive)
          .map(
            (player, index) => `
          <tr>
            <td>Role ${player.role}</td>
            <td>${player.name}</td>
            <td>
              <select class="attack-select">
                <option value="none">No one</option>
                ${players
                  .filter((p) => p.alive)
                  .map(
                    (p, i) => `<option value="${i}">${p.name}</option>`
                  )
                  .join('')}
              </select>
            </td>
            <td>
              ${[1, 2, 4, 5, 8].includes(player.role)
                ? '<input type="text" placeholder="Optional action">'
                : 'None'}
            </td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;
}

// Render day phase
function renderDayPhase(number) {
  return `
    <p>Who was voted out?</p>
    <select class="voted-out-select">
      <option value="none">No one</option>
      ${players
        .filter((p) => p.alive)
        .map(
          (player, index) => `<option value="${index}">${player.name}</option>`
        )
        .join('')}
    </select>
  `;
}

// Highlight potential deaths in night phase
function highlightPotentialDeaths(phase) {
  const attackSelects = phase.querySelectorAll('.attack-select');
  const potentialDeaths = new Set();

  attackSelects.forEach((select, attackerIndex) => {
    const targetIndex = select.value;
    if (targetIndex !== 'none') {
      const attacker = players.filter((p) => p.alive)[attackerIndex];
      const target = players.filter((p) => p.alive)[targetIndex];
      if (attacker.role > target.role) {
        potentialDeaths.add(targetIndex);
      }
    }
  });

  phase.querySelectorAll('tbody tr').forEach((row, index) => {
    if (potentialDeaths.has(index.toString())) {
      row.classList.add('dead');
    } else {
      row.classList.remove('dead');
    }
  });
}

// Confirm phase actions
phasesContainer.addEventListener('click', (e) => {
  if (e.target.classList.contains('confirm-phase')) {
    const phase = phases[currentPhaseIndex];
    if (phase.type === 'night') {
      confirmNightPhase(phase.number);
    } else {
      confirmDayPhase(phase.number);
    }
  }
});

// Confirm night phase
function confirmNightPhase(number) {
  const phase = document.getElementById(`night-phase-${number}`);
  const attackSelects = phase.querySelectorAll('.attack-select');
  const deaths = new Set();

  attackSelects.forEach((select, attackerIndex) => {
    const targetIndex = select.value;
    if (targetIndex !== 'none') {
      const attacker = players.filter((p) => p.alive)[attackerIndex];
      const target = players.filter((p) => p.alive)[targetIndex];
      if (attacker.role > target.role) {
        deaths.add(targetIndex);
      }
    }
  });

  // Mark dead players
  const deadPlayers = [];
  deaths.forEach((index) => {
    const player = players.filter((p) => p.alive)[index];
    player.alive = false;
    deadPlayers.push(player.name);
  });

  // Announce results
  resultsText.textContent = `Players who died: ${deadPlayers.join(', ') || 'None'}`;
  resultsDiv.classList.remove('hidden');

  // Add day phase
  addPhase('day', number);
}

// Confirm day phase
function confirmDayPhase(number) {
  const phase = document.getElementById(`day-phase-${number}`);
  const votedOutIndex = phase.querySelector('.voted-out-select').value;
  let votedOutPlayer = null;

  if (votedOutIndex !== 'none') {
    votedOutPlayer = players.filter((p) => p.alive)[votedOutIndex];
    votedOutPlayer.alive = false;
  }

  // Announce results
  resultsText.textContent += `\nPlayer voted out: ${votedOutPlayer ? votedOutPlayer.name : 'No one'}`;
  resultsDiv.classList.remove('hidden');

  // Check game-over condition
  const aliveRoles = players.filter((p) => p.alive).map((p) => p.role);
  const sum = aliveRoles.reduce((a, b) => a + b, 0);
  if (sum <= 10) {
    resultsText.textContent += `\nGame Over! Remaining roles: ${aliveRoles.join(', ')}`;
  } else {
    // Add next night phase
    addPhase('night', number + 1);
  }
}

// Allow editing previous phases
phasesContainer.addEventListener('click', (e) => {
  if (e.target.classList.contains('edit-phase')) {
    const phase = phases.find((p) => p.phase === e.target.closest('.phase'));
    currentPhaseIndex = phases.indexOf(phase);
    resetFromPhase(currentPhaseIndex);
  }
});

// Reset from a specific phase
function resetFromPhase(index) {
  phases.slice(index + 1).forEach((phase) => phase.phase.remove());
  phases = phases.slice(0, index + 1);
  currentPhaseIndex = index;
}