const setupPhase = document.getElementById('setup-phase');
const startGameButton = document.getElementById('start-game');
const container = document.querySelector('.container');

let players = [];
let currentNight = 1;
let currentDay = 1;
let alivePlayers = [];
let immunePlayers = new Set(); // Track immune players
let doctorLastVisit = null; // Track the last player visited by the Doctor

// Initialize the game
startGameButton.addEventListener('click', () => {
  players = Array.from({ length: 10 }, (_, i) => ({
    role: i + 1,
    name: document.getElementById(`player${i + 1}`).value,
    alive: true,
  }));
  alivePlayers = [...players];
  immunePlayers.clear(); // Reset immune players
  doctorLastVisit = null; // Reset Doctor's last visit
  setupPhase.classList.add('hidden');
  renderNightPhase();
});

// Render the night phase
function renderNightPhase() {
  // Reset immune players at the start of each night
  immunePlayers.clear();

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
              ${player.role === 1 ? `
                <select class="role-guess">
                  <option value="none">Guess Role</option>
                  ${Array.from({ length: 9 }, (_, i) => `<option value="${i + 2}">Role ${i + 2}</option>`).join('')}
                </select>
              ` : ''}
              ${player.role === 5 ? `
                <select class="doctor-visit">
                  <option value="none">No one</option>
                  ${alivePlayers
                    .map((p, i) => ({ index: i, player: p })) // Map to include original index
                    .filter(({ player }) => player.role !== doctorLastVisit) // Exclude last visited player
                    .map(({ index, player }) => `<option value="${player.role}">${player.name}</option>`)
                    .join('')}
                </select>
              ` : ''}
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

  // Highlight potential deaths and immunity
  const highlightPotentialDeaths = () => {
    const attackSelects = nightTable.querySelectorAll('.attack-select');
    const roleGuesses = nightTable.querySelectorAll('.role-guess');
    const doctorVisits = nightTable.querySelectorAll('.doctor-visit');
    const potentialDeaths = new Set();
    const immuneCandidates = new Set();

    // First pass: Check for Role 1's special action
    alivePlayers.forEach((player, index) => {
      if (player.role === 1) {
        const attackIndex = attackSelects[index].value;
        const guessedRole = roleGuesses[index]?.value;
        if (attackIndex !== 'none' && guessedRole !== 'none') {
          const target = alivePlayers[attackIndex];
          if (target.role === parseInt(guessedRole)) {
            potentialDeaths.add(Number(attackIndex)); // Target dies
            immuneCandidates.add(Number(index)); // Role 1 becomes immune for this round
          }
        }
      }
    });

    // Second pass: Check for Role 5's special action
    doctorVisits.forEach((select, index) => {
      const visitRole = select.value;
      if (visitRole !== 'none') {
        const visitIndex = alivePlayers.findIndex(p => p.role === Number(visitRole));
        if (visitIndex !== -1) {
          immuneCandidates.add(Number(visitIndex)); // Visited player becomes immune
        }
      }
    });

    // Third pass: Check for regular attacks
    attackSelects.forEach((select, attackerIndex) => {
      const targetIndex = select.value;
      if (targetIndex !== 'none' && !immuneCandidates.has(Number(attackerIndex))) {
        const attacker = alivePlayers[attackerIndex];
        const target = alivePlayers[targetIndex];
        if (attacker.role > target.role && !immunePlayers.has(Number(targetIndex))) {
          potentialDeaths.add(Number(targetIndex));
        }
      }
    });

    // Highlight rows
    nightTable.querySelectorAll('tbody tr').forEach((row, index) => {
      if (potentialDeaths.has(Number(index)) && !immuneCandidates.has(Number(index))) {
        row.classList.add('dead');
      } else if (immuneCandidates.has(Number(index)) || immunePlayers.has(Number(index))) {
        row.classList.add('immune');
      } else {
        row.classList.remove('dead', 'immune');
      }
    });
  };

  // Add event listeners for highlighting potential deaths and immunity
  nightTable.addEventListener('change', highlightPotentialDeaths);

  confirmNightButton.addEventListener('click', () => {
    confirmNightButton.disabled = true;
    const attackSelects = nightTable.querySelectorAll('.attack-select');
    const roleGuesses = nightTable.querySelectorAll('.role-guess');
    const doctorVisits = nightTable.querySelectorAll('.doctor-visit');
    const optionalInputs = nightTable.querySelectorAll('input[type="text"]');

    // Lock selects and inputs
    attackSelects.forEach(select => (select.disabled = true));
    roleGuesses.forEach(select => (select.disabled = true));
    doctorVisits.forEach(select => (select.disabled = true));
    optionalInputs.forEach(input => (input.disabled = true));

    const attacks = Array.from(attackSelects).map(select => select.value);
    const deaths = new Set();
    const newImmunePlayers = new Set();

    // First pass: Process Role 1's special action
    alivePlayers.forEach((player, index) => {
      if (player.role === 1) {
        const attackIndex = attacks[index];
        const guessedRole = roleGuesses[index]?.value;
        if (attackIndex !== 'none' && guessedRole !== 'none') {
          const target = alivePlayers[attackIndex];
          if (target.role === parseInt(guessedRole)) {
            if (!immunePlayers.has(Number(attackIndex))) { // Ensure target is not immune
              deaths.add(Number(attackIndex)); // Target dies
            }
            newImmunePlayers.add(Number(index)); // Role 1 becomes immune for this round
          }
        }
      }
    });

    // Second pass: Process Role 5's special action
    doctorVisits.forEach((select, index) => {
      const visitRole = select.value;
      if (visitRole !== 'none') {
        const visitIndex = alivePlayers.findIndex(p => p.role === Number(visitRole));
        if (visitIndex !== -1) {
          newImmunePlayers.add(Number(visitIndex)); // Visited player becomes immune
          doctorLastVisit = Number(visitRole); // Update Doctor's last visit (using role, not index)
        }
      }
    });

    // Third pass: Process regular attacks
    attacks.forEach((attackIndex, attackerIndex) => {
      if (attackIndex !== 'none' && !newImmunePlayers.has(Number(attackerIndex))) {
        const attacker = alivePlayers[attackerIndex];
        const target = alivePlayers[attackIndex];
        if (attacker.role > target.role && !immunePlayers.has(Number(attackIndex))) {
          deaths.add(Number(attackIndex));
        }
      }
    });

    // Update immune players for this round
    immunePlayers = new Set([...newImmunePlayers]); // Reset immunity to only new immune players

    // Generate the log (excluding immune players)
    const deadPlayers = Array.from(deaths)
      .filter(index => !immunePlayers.has(Number(index))) // Exclude immune players
      .map(index => alivePlayers[index].name);
    const nightLog = document.getElementById(`night-log-${currentNight}`);
    nightLog.textContent = `Players who died: ${deadPlayers.join(', ') || 'None'}`;

    // Remove dead players (excluding immune players)
    alivePlayers = alivePlayers.filter((_, index) => !deaths.has(Number(index)) || immunePlayers.has(Number(index)));

    // Check if the game is over
    const roleSum = alivePlayers.reduce((sum, player) => sum + player.role, 0);
    if (roleSum <= 10) {
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
    const roleSum = alivePlayers.reduce((sum, player) => sum + player.role, 0);
    if (roleSum <= 10) {
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