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
        // let majorityCandidate = hasMajority();
        // if (majorityCandidate) {
        //     return `${majorityCandidate} wins with majority of votes!`;
        // }

        // Find candidate with fewest votes
        let minVotes = Math.min(...Object.values(voteCount));
        let candidatesWithMinVotes = Object.keys(voteCount).filter(candidate => voteCount[candidate] === minVotes);

        // Eliminate candidate(s) with fewest votes
        eliminatedCandidates.push(...candidatesWithMinVotes);

        console.log(eliminatedCandidates);

        // Sort candidates by number of votes
        let sortedCandidates = Object.keys(voteCount).sort((a, b) => voteCount[b] - voteCount[a]);

        // Display round results
        let roundResults = `<strong>Round ${round++}: </strong><br>`;
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
        
        let majorityCandidate = hasMajority();
        if (majorityCandidate) {
            let roundResults = `<strong>Round ${round++}: </strong><br>`;
            sortedCandidates.forEach(candidate => {
                if(voteCount[candidate])
                    roundResults += `${candidate}: ${voteCount[candidate]} votes <br>`;
            });
            document.getElementById('round-results').innerHTML += `<p>${roundResults}</p>`;
            return `${majorityCandidate} wins with majority of votes!`;
        }

        // Check for tie
        if (Object.keys(voteCount).length === 1) {
            return `${Object.keys(voteCount)[0]} wins by default!`;
        }
    }
}

function eraseCandidate(candidate, ballots) {
    // Remove the candidate from every ballot
    ballots.forEach(ballot => {
        const index = ballot.indexOf(candidate);
        if (index !== -1) {
            ballot.splice(index, 1);
        }
    });
}

function singleTransferableVote(ballots, numWinners) {
    // Count initial votes
    let voteCount = {};

    ballots.forEach(ballot => {
        const topCandidate = ballot[0];
        voteCount[topCandidate] = (voteCount[topCandidate] || 0) + 1;
    });

    const totalVotes = ballots.length;
    const droopQuota = Math.floor(totalVotes / (numWinners + 1)) + 1;

    let round = 1;
    let eliminatedCandidates = [];

    while (true) {
        // Check if any candidate has reached or surpassed the Droop quota
        let electedCandidates = Object.keys(voteCount).filter(candidate => voteCount[candidate] >= droopQuota);
        if (electedCandidates.length >= numWinners) {
            return electedCandidates.slice(0, numWinners).join(", ") + " are elected!";
        }

        
        // Sort candidates by number of votes
        let sortedCandidates = Object.keys(voteCount).sort((a, b) => voteCount[b] - voteCount[a]);

        // Display round results
        let roundResults = `<strong>Round ${round++}: </strong><br>`;
        sortedCandidates.forEach(candidate => {
            roundResults += `${candidate}: ${voteCount[candidate]} votes <br>`;
        });
        document.getElementById('round-results').innerHTML += `<p>${roundResults}</p>`;

        newlyElectedCandidates = Object.keys(voteCount).filter(candidate => voteCount[candidate] > droopQuota);
        
        console.log(newlyElectedCandidates)

        // Check if any candidate has reached or surpassed the Droop quota after eliminating candidates
        electedCandidates = Object.keys(voteCount).filter(candidate => voteCount[candidate] >= droopQuota);
        if (electedCandidates.length >= numWinners) {
            return electedCandidates.slice(0, numWinners).join(", ") + " are elected!";
        }

        // Transfer surplus votes from elected candidates and recalculate votes after eliminating candidates
        newlyElectedCandidates.forEach(candidate => {
            if (voteCount[candidate] > droopQuota) {
                const surplus = voteCount[candidate] - droopQuota;
                ballots.forEach(ballot => {
                    if (ballot[0]) {
                        let i = 0;
                        while (eliminatedCandidates.includes(ballot[i]) && electedCandidates.includes(ballot[i])) {
                            i++;
                        }
                        const nextPreference = ballot[i + 1];
                        if (nextPreference) {
                            voteCount[nextPreference] = (voteCount[nextPreference] || 0) + (surplus / voteCount[candidate]);
                        }
                    }
                });
                voteCount[candidate] = droopQuota; // Reset the vote count for the elected candidate to the Droop quota
                document.getElementById('round-results').innerHTML += `<p>${candidate} is Elected</p>`;
            }
        });

        // Recalculate votes after eliminating candidates
        // voteCount = {};
        // ballots.forEach(ballot => {
        //     let i = 0;
        //     while (eliminatedCandidates.includes(ballot[i])) {
        //         i++;
        //     }
        //     voteCount[ballot[i]] = (voteCount[ballot[i]] || 0) + 1;
        // });
        // Find candidate(s) with fewest votes
        

        if(newlyElectedCandidates.length == 0){
            let minVotes = Math.min(...Object.values(voteCount));
            let candidatesWithMinVotes = Object.keys(voteCount).filter(candidate => voteCount[candidate] === minVotes);

            // Eliminate candidate(s) with fewest votes
            eliminatedCandidates.push(...candidatesWithMinVotes);

            // Remove winners from the pool
            eliminatedCandidates = eliminatedCandidates.filter(candidate => !electedCandidates.includes(candidate));


            candidatesWithMinVotes.forEach(candidate => {
                document.getElementById('round-results').innerHTML += `<p>${candidate} eliminated due to fewest votes.</p>`;
            });
            
            eliminatedCandidates.forEach(candidate => eraseCandidate(candidate, ballots));
            eliminatedCandidates.forEach(candidate => delete voteCount[candidate]);
        }

        console.log(electedCandidates);
        

        // Check if any candidate has reached or surpassed the Droop quota after transferring surplus votes
        electedCandidates = Object.keys(voteCount).filter(candidate => voteCount[candidate] >= droopQuota);
        console.log("Can", voteCount, electedCandidates);
        if (electedCandidates.length >= numWinners) {
            return electedCandidates.slice(0, numWinners).join(", ") + " are elected!";
        }

        // Check for tie
        if (Object.keys(voteCount).length <= numWinners) {
            return Object.keys(voteCount).join(", ") + " wins by default!";
        }
    }
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
