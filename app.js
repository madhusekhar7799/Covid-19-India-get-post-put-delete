const express = require(express);
const {open} = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.join());

let database = null;

const intialiseDbAndServer = () => {
    try{
    database = await open({
        filename: databasePath,
        driver: sqlite3.Database,
    });
    app.listen(3000, () => 
        console.log("Server Running at http://localhost:3000/")
    );
};catch (error) {
    console.log(`DB ERROR: ${error.message}`);
    process.exit(1);
};

};

initializeDbAndServer();

const convertStateDbObjectToResponseObject = (dbObject) => {
    return {
        stateId = dbObject.state_id,
        stateName = dbObject.start_name,
        population = dbObject.population,
    };
};

const convertDistrictDbObjectToResponseObject = (dbObject) => {
    return {
        districtId = dbObject.district_id,
        districtName = dbObject.district_name,
        stateId = dbObject.state_id,
        cases = dbObject.cases,
        cured = dbObject.cured,
        active = dbObject.active,
        deaths = dbObject.deaths,
    };
};

app.get("/states/", async (request, response) => {
    const getStatesQuery =`
    SELECT 
    *
    FROM
    state;`;
    const stateArray = await database.all(getStatesQuery);
    response.send(stateArray.map((eachstate) => 
    convertStateDbObjectToResponseObject(eachstate)
    )
    );
});

app.get("/states/:stateId/", async (request, response) => {
    const {stateId} = request.params;
    const getStateQuery =`
    SELECT 
    *
    FROM
    state
    WHERE
    state_id = ${stateId};`;

    const state = await database.get(getStateQuery);
    response.send(convertStateDbObjectToResponseObject(state));
});

app.get("districts/:districtId", async (request, response) => {
    const {districtId} = request.params;
    const getDistrictQuery =`
    SELECT
    *
    FROM
    district
    WHERE
    district_id = ${districtId};`;

    const district = await database.get(getDistrictQuery);
    response.send(convertDistrictDbObjectToResponseObject(district));
});


app.post("/district/", async (request, response) => {
    const { stateId, districtName, cases, cured, active, deaths } = request.body;
    const postDistrictQuery =`
    INSERT INTO
    district (state_id, district_name, cases, cured, active, deaths)
    VALUES
    (${stateId},${districtName},${cases},${cured},${active},${deaths});`;
    await database.run(postDistrictQuery);
    response.send("District Successfully Added");
});

app.delete("/districts/:districtId", async (request, response) => {
    const deleteDirstrictQuery =`
    DELETE FROM
    district
    WHERE
    distrit_id = ${districtId};`;
    await database.run(deleteDirstrictQuery);
    response.send("Remove District");
});

app.put("/districts/:districtId/", async (request, response) => {
    const {districtId} = request.params;
    const {districtName, stateId, cases, cured, active, deaths} = request.body;
    const putDistrictQuery = `
    UPDATE
    district
    SET
    district_name = ${districtName},
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths};`;
    await database.run(putDistrictQuery);
    response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
    const {stateId} = request.params;
    const getStateStatusQuery =`
    SELECT
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM
    district
    WHERE
    state_id = ${stateId};`;
    const status = await database.get(getStateStatusQuery);
    response.send({
        totalCases: status[" SUM(cases)"];
        totalCured: status[" SUM(cured)"];
        totalActive: status["SUM(active)"];
        totalDeaths: status["SUM(deaths)"];
    });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id=${districtId};`;
  const state = await database.get(getStateNameQuery);
  response.send({ stateName: state.state_name });
});

module.exports = app;
