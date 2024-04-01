// Function to parse CSV string to array of arrays
function parseCSV(csv) {
    return csv.trim().split('\n').map(row => row.split(','));
}

// Function to perform Instant Runoff Voting
function instantRunoff(ballots) {
    // Count initial votes
    let voteCount = {};

    console.log(voteCount, ballots.length);

    ballots.forEach(ballot => {
        const topCandidate = ballot[0];
        voteCount[topCandidate] = (voteCount[topCandidate] || 0) + 1;
    });

    const totalVotes = ballots.length;

    console.log(voteCount, ballots.length);

    // Function to check if any candidate has majority
    function hasMajority() {
        for (let candidate in voteCount) {
            if (voteCount[candidate] > totalVotes / 2) {
                return candidate;
            }
        }
        return false;
    }

    let round = 1;
    let eliminatedCandidates = [];

    while (true) {
        let majorityCandidate = hasMajority();
        if (majorityCandidate) {
            return `${majorityCandidate} wins with majority of votes!`;
        }

        // Find candidate with fewest votes
        let minVotes = Math.min(...Object.values(voteCount));
        let candidatesWithMinVotes = Object.keys(voteCount).filter(candidate => voteCount[candidate] === minVotes);

        // Eliminate candidate(s) with fewest votes
        eliminatedCandidates.push(...candidatesWithMinVotes);

        console.log(eliminatedCandidates);

        // Sort candidates by number of votes
        let sortedCandidates = Object.keys(voteCount).sort((a, b) => voteCount[b] - voteCount[a]);

        // Display round results
        let roundResults = `Round ${round++}: <br>`;
        sortedCandidates.forEach(candidate => {
            roundResults += `${candidate}: ${voteCount[candidate]} votes <br>`;
        });
        document.getElementById('round-results').innerHTML += `<p>${roundResults}</p>`;

        // Recalculate votes after eliminating candidates
        voteCount = {};
        ballots.forEach(ballot => {
            let i = 0;
            while (eliminatedCandidates.includes(ballot[i])) {
                i++;
            }
            voteCount[ballot[i]] = (voteCount[ballot[i]] || 0) + 1;
        });

        candidatesWithMinVotes.forEach(candidate => {
            document.getElementById('round-results').innerHTML += `<p>${candidate} eliminated due to fewest votes.</p>`;
        });

        // eliminatedCandidates = [];
        eliminatedCandidates.forEach(candidate => delete voteCount[candidate]);


        // Check for tie
        if (Object.keys(voteCount).length === 1) {
            return `${Object.keys(voteCount)[0]} wins by default!`;
        }
    }
}

function singleTransferableVote(ballots, numWinners) {
    // Implement STV logic here
    // This is just a placeholder for now
    return `Single Transferable Vote with ${numWinners} winners has not been implemented yet.`;
}

document.getElementById('run-voting').addEventListener('click', function() {
    const ballots = parseCSV(document.getElementById('ballot-input').value);
    const result = instantRunoff(ballots);
    document.getElementById('winner').innerText = result;
});

document.getElementById('run-stv').addEventListener('click', function() {
    const ballots = parseCSV(document.getElementById('ballot-input').value);
    const numWinners = parseInt(document.getElementById('num-winners').value);
    const result = singleTransferableVote(ballots, numWinners);
    document.getElementById('winner').innerText = result;
});
