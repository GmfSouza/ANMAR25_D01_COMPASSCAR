const express = require("express");
const router = express.Router();
const Car = require("../models/car.js");
const CarItem = require("../models/carItem.js");

router.post("/", async (req, res) => {
	try {
		const { brand, model, plate, year, items } = req.body;

		const car = await Car.create({
			brand,
			model,
			plate,
			year,
		});

		let carItems = [];
		if (items && items.length > 0) {
			carItems = await Promise.all(
				items.map((itemName) => 
					CarItem.create({
						name: itemName,
						car_id: car.id,
					})
				)
			);
		}

		res.status(201).json({
			...car.toJSON(),
			carItems: carItems.map((item) => item.toJSON()),
		});

	} catch (error) {

		console.error("Error creating car:", error);
		res.status(400).json({ error: "Failed to create car"});
	  }
});


router.get("/", (req, res) => {
	res.send("GET /api/v1/cars is running!");
});

module.exports = router;


