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
		res.status(400).json({ error: "Failed to create car" });
	}
});

router.get("/", async (req, res) => {
	try {
		const cars = await Car.findAll({
			include: [
				{
					model: CarItem,
					as: "items",
				},
			],
		});
		res.status(200).json(cars);
	} catch (error) {
		console.error("Error when searching for cars:", error);
		res
			.status(500)
			.json({ error: "Failed to search cars", details: error.message });
	}
});

router.get("/:id", async (req, res) => {
	try {
		const { id } = req.params;

		const car = await Car.findByPk(id, {
			include: [
				{
					model: CarItem,
					as: "items",
				},
			],
		});

		if (!car) {
			return res.status(404).json({ error: "Car not found." });
		}

		res.status(200).json(car);
	} catch (error) {
		console.error("Error when searching for car", error);
		res
			.status(500)
			.json({ error: "Failed to search car", details: error.message });
	}
});

module.exports = router;
