require("dotenv").config;
const cors       = require("cors");
const express    = require("express");
const connection = require("./src/db/dbConnection.js");
const routes     = require("./src/routes/carRoutes.js");

const port = process.env.PORT || 3000;
const app  = express();

app.use(express.json());
app.use(cors());
app.use("/api/v1/cars", routes);

async function serverInit() {
	try {
		await connection.authenticate();
		console.log("the database connection was successful!");
		app.listen(port, () => {
			console.log("the server is running on port: 3000");
		});
	} catch (error) {
		console.error("could not connect to the database", error);
	}
}

serverInit();
