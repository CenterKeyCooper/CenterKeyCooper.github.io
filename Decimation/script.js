const setupPhase = document.getElementById('setup-phase');
const startGameButton = document.getElementById('start-game');
const container = document.querySelector('.container');

let players = [];
let currentNight = 1;
let currentDay = 1;
let alivePlayers = [];
let immunePlayers = new Set();
let doctorLastVisit = null;
let role2State = { index: null, options: ['nothing', 'on-guard'], lastAction: null }; // Starts with on-guard option
let roleToIndexMap = new Map();

// Initialize the game
startGameButton.addEventListener('click', () => {
  players = Array.from({ length: 10 }, (_, i) => ({
    role: i + 1,
    name: document.getElementById(`player${i + 1}`).value,
    alive: true,
    extraLife: i === 6,
  }));
  alivePlayers = [...players];
  immunePlayers.clear();
  doctorLastVisit = null;
  roleToIndexMap.clear();
  alivePlayers.forEach((player, index) => roleToIndexMap.set(player.role, index));
  role2State = { 
    index: roleToIndexMap.get(2), 
    options: ['nothing', 'on-guard'], // Starts with on-guard option
    lastAction: null 
  };
  setupPhase.classList.add('hidden');
  renderNightPhase();
});

// Render the night phase
function renderNightPhase() {
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
            <td ${player.extraLife ? 'class="extra-life"' : ''}>${player.name}</td>
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
              ${player.role === 2 ? `
                <select class="role2-action">
                  ${role2State.options.map(option => `<option value="${option}">${option}</option>`).join('')}
                </select>
              ` : ''}
              ${player.role === 4 ? `
                <select class="role4-visit">
                  <option value="none">No one</option>
                  ${alivePlayers.map((p, i) => `<option value="${p.role}">${p.name}</option>`).join('')}
                </select>
              ` : ''}
              ${player.role === 5 ? `
                <select class="doctor-visit">
                  <option value="none">No one</option>
                  ${alivePlayers
                    .map((p, i) => ({ index: i, player: p }))
                    .filter(({ player }) => player.role !== doctorLastVisit)
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
    const role4Visits = nightTable.querySelectorAll('.role4-visit');
    const role2Actions = nightTable.querySelectorAll('.role2-action');
    const potentialDeaths = new Set();
    const immuneCandidates = new Set();

    // Process Role 1's special action
    alivePlayers.forEach((player, index) => {
      if (player.role === 1) {
        const attackIndex = attackSelects[index].value;
        const guessedRole = roleGuesses[index]?.value;
        if (attackIndex !== 'none' && guessedRole !== 'none') {
          const target = alivePlayers[attackIndex];
          if (target.role === parseInt(guessedRole)) {
            potentialDeaths.add(Number(attackIndex));
            immuneCandidates.add(Number(index));
          }
        }
      }
    });

    // Process Role 2's special action
    role2Actions.forEach((select, index) => {
      const action = select.value;
      if (action === 'on-guard' || action === 'on-armed-guard') {
        immuneCandidates.add(Number(role2State.index));
        if (action === 'on-armed-guard') {
          attackSelects.forEach((select, attackerIndex) => {
            if (select.value === role2State.index.toString() && !immuneCandidates.has(Number(attackerIndex))) {
              potentialDeaths.add(Number(attackerIndex));
            }
          });
          
          // Check Role 4 visits
          const role4Index = alivePlayers.findIndex(p => p.role === 4);
          if (role4Index !== -1) {
            const role4Select = nightTable.querySelector(`tr:nth-child(${role4Index + 1}) .role4-visit`);
            if (role4Select) {
              const visitRole = role4Select.value;
              if (visitRole !== 'none') {
                const visitIndex = alivePlayers.findIndex(p => p.role === Number(visitRole));
                if (visitIndex === role2State.index && !immuneCandidates.has(Number(role4Index))) {
                  potentialDeaths.add(Number(role4Index));
                }
              }
            }
          }
          
          // Check Role 5 visits
          const doctorIndex = alivePlayers.findIndex(p => p.role === 5);
          if (doctorIndex !== -1) {
            const doctorSelect = nightTable.querySelector(`tr:nth-child(${doctorIndex + 1}) .doctor-visit`);
            if (doctorSelect) {
              const visitRole = doctorSelect.value;
              if (visitRole !== 'none') {
                const visitIndex = alivePlayers.findIndex(p => p.role === Number(visitRole));
                if (visitIndex === role2State.index && !immuneCandidates.has(Number(doctorIndex))) {
                  potentialDeaths.add(Number(doctorIndex));
                }
              }
            }
          }
        }
      }
    });

    // Process Role 5's special action
    const doctorIndex = alivePlayers.findIndex(p => p.role === 5);
    if (doctorIndex !== -1) {
      const doctorSelect = nightTable.querySelector(`tr:nth-child(${doctorIndex + 1}) .doctor-visit`);
      if (doctorSelect) {
        const visitRole = doctorSelect.value;
        if (visitRole !== 'none') {
          const visitIndex = alivePlayers.findIndex(p => p.role === Number(visitRole));
          if (visitIndex !== -1) {
            immuneCandidates.add(Number(visitIndex));
          }
        }
      }
    }

    // Process regular attacks
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

  nightTable.addEventListener('change', highlightPotentialDeaths);

  confirmNightButton.addEventListener('click', () => {
    confirmNightButton.disabled = true;
    const attackSelects = nightTable.querySelectorAll('.attack-select');
    const roleGuesses = nightTable.querySelectorAll('.role-guess');
    const role2Actions = nightTable.querySelectorAll('.role2-action');
    const role4Visits = nightTable.querySelectorAll('.role4-visit');

    // Lock selects
    attackSelects.forEach(select => (select.disabled = true));
    roleGuesses.forEach(select => (select.disabled = true));
    role2Actions.forEach(select => (select.disabled = true));
    role4Visits.forEach(select => (select.disabled = true));

    const attacks = Array.from(attackSelects).map(select => select.value);
    const deaths = new Set();
    const newImmunePlayers = new Set();

    // Process Role 1's special action
    alivePlayers.forEach((player, index) => {
      if (player.role === 1) {
        const attackIndex = attacks[index];
        const guessedRole = roleGuesses[index]?.value;
        if (attackIndex !== 'none' && guessedRole !== 'none') {
          const target = alivePlayers[attackIndex];
          if (target.role === parseInt(guessedRole)) {
            if (!immunePlayers.has(Number(attackIndex))) {
              deaths.add(Number(attackIndex));
            }
            newImmunePlayers.add(Number(index));
          }
        }
      }
    });

    // Process Role 2's special action
    role2Actions.forEach((select, index) => {
      const action = select.value;
      if (action === 'on-guard' || action === 'on-armed-guard') {
        newImmunePlayers.add(Number(role2State.index));
        
        if (action === 'on-armed-guard') {
          // Check all attacks against Role 2
          attacks.forEach((attackIndex, attackerIndex) => {
            if (attackIndex === role2State.index.toString() && !newImmunePlayers.has(Number(attackerIndex))) {
              deaths.add(Number(attackerIndex));
            }
          });

          // Check Role 4 visits
          const role4Index = alivePlayers.findIndex(p => p.role === 4);
          if (role4Index !== -1) {
            const role4Select = nightTable.querySelector(`tr:nth-child(${role4Index + 1}) .role4-visit`);
            if (role4Select) {
              const visitRole = role4Select.value;
              if (visitRole !== 'none') {
                const visitIndex = alivePlayers.findIndex(p => p.role === Number(visitRole));
                if (visitIndex === role2State.index && !newImmunePlayers.has(Number(role4Index))) {
                  deaths.add(Number(role4Index));
                }
              }
            }
          }
          
          // Check Role 5 visits
          const doctorIndex = alivePlayers.findIndex(p => p.role === 5);
          if (doctorIndex !== -1) {
            const doctorSelect = nightTable.querySelector(`tr:nth-child(${doctorIndex + 1}) .doctor-visit`);
            if (doctorSelect) {
              const visitRole = doctorSelect.value;
              if (visitRole !== 'none') {
                const visitIndex = alivePlayers.findIndex(p => p.role === Number(visitRole));
                if (visitIndex === role2State.index && !newImmunePlayers.has(Number(doctorIndex))) {
                  deaths.add(Number(doctorIndex));
                }
              }
            }
          }
        }
        
        role2State.lastAction = action;
        role2State.options = ['nothing'];
      } else if (action === 'nothing') {
        if (role2State.options.length === 1) {
          role2State.options.push('on-guard');
        } else if (role2State.options.length === 2) {
          role2State.options.push('on-armed-guard');
        }
      }
    });

    // Process Role 5's special action
    const doctorIndex = alivePlayers.findIndex(p => p.role === 5);
    if (doctorIndex !== -1) {
      const doctorSelect = nightTable.querySelector(`tr:nth-child(${doctorIndex + 1}) .doctor-visit`);
      if (doctorSelect) {
        const visitRole = doctorSelect.value;
        if (visitRole !== 'none') {
          const visitIndex = alivePlayers.findIndex(p => p.role === Number(visitRole));
          if (visitIndex !== -1) {
            newImmunePlayers.add(Number(visitIndex));
            doctorLastVisit = Number(visitRole);
          }
        }
      }
    }

    // Process regular attacks
    attacks.forEach((attackIndex, attackerIndex) => {
      if (attackIndex !== 'none' && !newImmunePlayers.has(Number(attackerIndex))) {
        const attacker = alivePlayers[attackerIndex];
        const target = alivePlayers[attackIndex];
        if (attacker.role > target.role && !immunePlayers.has(Number(attackIndex))) {
          deaths.add(Number(attackIndex));
        }
      }
    });

    // Update immune players
    immunePlayers = new Set([...newImmunePlayers]);

    // Process deaths (including Role 7's extra life)
    const deadPlayers = Array.from(deaths)
      .filter(index => !immunePlayers.has(Number(index)))
      .map(index => {
        const player = alivePlayers[index];
        if (player.role === 7 && player.extraLife) {
          player.extraLife = false;
          return null;
        }
        return index;
      })
      .filter(index => index !== null);

    // Generate log
    const nightLog = document.getElementById(`night-log-${currentNight}`);
    nightLog.textContent = `Players who died: ${deadPlayers.map(index => alivePlayers[index].name).join(', ') || 'None'}`;

    // Remove dead players
    alivePlayers = alivePlayers.filter((_, index) => !deadPlayers.includes(index));

    // Update role-to-index map
    roleToIndexMap.clear();
    alivePlayers.forEach((player, index) => roleToIndexMap.set(player.role, index));
    role2State.index = roleToIndexMap.get(2);

    // Check game over
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

    // Scroll to next phase
    setTimeout(() => {
      renderDayPhase();
      document.getElementById(`day-${currentDay}`).scrollIntoView({ behavior: 'smooth' });
    }, 500);
  });
}

// Render the day phase (unchanged)
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
      const votedOutPlayer = alivePlayers[votedOutIndex];
      if (votedOutPlayer.role === 7 && votedOutPlayer.extraLife) {
        votedOutPlayer.extraLife = false;
        dayLog.textContent = `Player voted out: ${votedOutPlayer.name} (lost extra life)`;
      } else {
        alivePlayers.splice(votedOutIndex, 1);
        dayLog.textContent = `Player voted out: ${votedOutPlayer.name}`;
      }
    } else {
      dayLog.textContent = `Player voted out: No one`;
    }

    // Update role-to-index map
    roleToIndexMap.clear();
    alivePlayers.forEach((player, index) => roleToIndexMap.set(player.role, index));
    role2State.index = roleToIndexMap.get(2);

    // Check game over
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

    // Scroll to next phase
    setTimeout(() => {
      currentNight++;
      currentDay++;
      renderNightPhase();
      document.getElementById(`night-${currentNight}`).scrollIntoView({ behavior: 'smooth' });
    }, 500);
  });
}