const setupPhase = document.getElementById('setup-phase');
const startGameButton = document.getElementById('start-game');
const container = document.querySelector('.container');

let players = [];
let currentNight = 1;
let currentDay = 1;
let alivePlayers = [];

// Initialize the game
startGameButton.addEventListener('click', () => {
  players = Array.from({ length: 10 }, (_, i) => ({
    role: i + 1,
    name: document.getElementById(`player${i + 1}`).value,
    alive: true,
  }));
  alivePlayers = [...players];
  setupPhase.classList.add('hidden');
  renderNightPhase();
});

// Render the night phase
function renderNightPhase() {
  const nightSection = document.createElement('section');
  nightSection.id = `night-${currentNight}`;
  nightSection.innerHTML = `
    <h2>Night ${currentNight}</h2>
    <table id="night-table-${currentNight}">
      <thead>
        <tr>
          <th>Role</th>
          <th>Player</th>
          <th>Attack</th>
          <th>Optional Action</th>
        </tr>
      </thead>
      <tbody>
        ${alivePlayers.map((player, index) => `
          <tr>
            <td>Role ${player.role}</td>
            <td>${player.name}</td>
            <td>
              <select class="attack-select">
                <option value="none">No one</option>
                ${alivePlayers.map((p, i) => `<option value="${i}">${p.name}</option>`).join('')}
              </select>
            </td>
            <td>
              ${[1, 2, 4, 5, 8].includes(player.role) ? '<input type="text" placeholder="Optional action">' : 'None'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <button id="confirm-night-${currentNight}">Confirm Night ${currentNight}</button>
    <div class="log" id="night-log-${currentNight}"></div>
  `;
  container.appendChild(nightSection);

  const confirmNightButton = document.getElementById(`confirm-night-${currentNight}`);
  const nightTable = document.getElementById(`night-table-${currentNight}`);

  // Highlight potential deaths
  const highlightPotentialDeaths = () => {
    const attackSelects = nightTable.querySelectorAll('.attack-select');
    const potentialDeaths = new Set();

    attackSelects.forEach((select, attackerIndex) => {
      const targetIndex = select.value;
      if (targetIndex !== 'none') {
        const attacker = alivePlayers[attackerIndex];
        const target = alivePlayers[targetIndex];
        if (attacker.role > target.role) {
          potentialDeaths.add(targetIndex);
        }
      }
    });

    nightTable.querySelectorAll('tbody tr').forEach((row, index) => {
      if (potentialDeaths.has(index.toString())) {
        row.classList.add('dead');
      } else {
        row.classList.remove('dead');
      }
    });
  };

  // Add event listeners for highlighting potential deaths
  nightTable.addEventListener('change', highlightPotentialDeaths);

  confirmNightButton.addEventListener('click', () => {
    confirmNightButton.disabled = true;
    const attackSelects = nightTable.querySelectorAll('.attack-select');
    const optionalInputs = nightTable.querySelectorAll('input[type="text"]');

    // Lock selects and inputs
    attackSelects.forEach(select => (select.disabled = true));
    optionalInputs.forEach(input => (input.disabled = true));

    const attacks = Array.from(attackSelects).map(select => select.value);
    const deaths = new Set();

    attacks.forEach((attackIndex, attackerIndex) => {
      if (attackIndex !== 'none') {
        const attacker = alivePlayers[attackerIndex];
        const target = alivePlayers[attackIndex];
        if (attacker.role > target.role) {
          deaths.add(attackIndex);
        }
      }
    });

    // Remove dead players
    const deadPlayers = Array.from(deaths).map(index => alivePlayers[index].name);
    alivePlayers = alivePlayers.filter((_, index) => !deaths.has(index.toString()));
    const nightLog = document.getElementById(`night-log-${currentNight}`);
    nightLog.textContent = `Players who died: ${deadPlayers.join(', ') || 'None'}`;

    // Scroll to the next phase
    setTimeout(() => {
      renderDayPhase();
      document.getElementById(`day-${currentDay}`).scrollIntoView({ behavior: 'smooth' });
    }, 500);
  });
}

// Render the day phase
function renderDayPhase() {
  const daySection = document.createElement('section');
  daySection.id = `day-${currentDay}`;
  daySection.innerHTML = `
    <h2>Day ${currentDay}</h2>
    <p>Who was voted out?</p>
    <select id="voted-out-${currentDay}">
      <option value="none">No one</option>
      ${alivePlayers.map((player, index) => `<option value="${index}">${player.name}</option>`).join('')}
    </select>
    <button id="confirm-day-${currentDay}">Confirm Day ${currentDay}</button>
    <div class="log" id="day-log-${currentDay}"></div>
  `;
  container.appendChild(daySection);

  const confirmDayButton = document.getElementById(`confirm-day-${currentDay}`);
  const votedOutSelect = document.getElementById(`voted-out-${currentDay}`);

  confirmDayButton.addEventListener('click', () => {
    confirmDayButton.disabled = true;
    votedOutSelect.disabled = true;

    const votedOutIndex = votedOutSelect.value;
    const dayLog = document.getElementById(`day-log-${currentDay}`);

    if (votedOutIndex !== 'none') {
      const votedOutPlayer = alivePlayers[votedOutIndex].name;
      alivePlayers.splice(votedOutIndex, 1);
      dayLog.textContent = `Player voted out: ${votedOutPlayer}`;
    } else {
      dayLog.textContent = `Player voted out: No one`;
    }

    // Check if the game is over
    if (alivePlayers.length <= 1) {
      const gameOverSection = document.createElement('section');
      gameOverSection.innerHTML = `
        <h2>Game Over</h2>
        <p>The game has ended. The remaining players are:</p>
        <ul>
          ${alivePlayers.map(player => `<li>${player.name} (Role ${player.role})</li>`).join('')}
        </ul>
      `;
      container.appendChild(gameOverSection);
      gameOverSection.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Scroll to the next phase
    setTimeout(() => {
      currentNight++;
      currentDay++;
      renderNightPhase();
      document.getElementById(`night-${currentNight}`).scrollIntoView({ behavior: 'smooth' });
    }, 500);
  });
}