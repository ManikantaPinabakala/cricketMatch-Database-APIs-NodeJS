const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000/");
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

initializeDBAndServer();

const playerTableConversion = (data) => {
  return {
    playerId: data.player_id,
    playerName: data.player_name,
  };
};

const matchTableConversion = (data) => {
  return {
    matchId: data.match_id,
    match: data.match,
    year: data.year,
  };
};

const playerMatchTableConversion = (data) => {
  return {
    playerMatchId: data.player_match_id,
    playerId: data.player_id,
    matchId: data.match_id,
    score: data.score,
    fours: data.fours,
    sixes: data.sixes,
  };
};

// players API
// Returns a list of all the players in the player table

app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    select * from 
    player_details
    `;
  const playerInfo = await db.all(getPlayerQuery);
  response.send(
    playerInfo.map((eachPlayer) => {
      return playerTableConversion(eachPlayer);
    })
  );
});

// player API
//Returns a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetails = `
    select * from player_details
    where player_id = ${playerId};
    `;
  const playerInfo = await db.get(getPlayerDetails);
  response.send(playerTableConversion(playerInfo));
});

// Update details API
// Updates the details of a specific player based on the player ID

app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  console.log(playerId);
  console.log(playerName);
  const updateQuery = `
    update player_details
    set
        player_id = ${playerId},
        player_name = '${playerName}'
        where
        player_id = ${playerId};
    `;
  const playerInfo = await db.run(updateQuery);
  response.send("Player Details Updated");
});

// match details API
// Returns the match details of a specific match

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `
    select
       *
    from 
    match_Details
    where match_id = ${matchId};
    `;
  const matchInfo = await db.get(getMatchDetails);
  response.send(matchTableConversion(matchInfo));
});

// GET API 5
// Returns a list of all the matches of a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getDetailsQuery = `
    select * from 
    player_match_score natural join match_details 
    where 
    player_id = ${playerId};
    `;
  const getQuery = await db.all(getDetailsQuery);
  response.send(
    getQuery.map((eachMatch) => {
      return mathTableConversion(eachMatch);
    })
  );
});

// API 6
//Returns a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    select * from player_match_score natural join player_details
    where match_id = ${matchId};
    `;
  const matchQuery = await db.all(getMatchQuery);
  response.send(
    matchQuery.map((eachMatch) => {
      return playerTableConversion(eachMatch);
    })
  );
});

//API 7
//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScore = `
    select 
    player_id, 
    player_details.player_name as name,
    sum(score) as totalScore,
    sum(fours) as totalFours, 
    sum(sixes) as totalSixes
    from player_match_score natural join player_details
    where 
        player_id = ${playerId}
    `;
  const playerScores = await db.get(getPlayerScore);
  response.send({
    playerId: playerScores["player_id"],
    playerName: playerScores["name"],
    totalScore: playerScores["totalScore"],
    totalFours: playerScores["totalFours"],
    totalSixes: playerScores["totalSixes"],
  });
});

module.exports = app;
