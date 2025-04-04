const express = require("express");
const router = express.Router();
const Car = require("../models/car.js");
const CarItem = require("../models/carItem.js");

const plateFormatValidator = (plate) => {
	if (!plate) return true;
	if (plate.length !== 8) return false;
	const parts = plate.split("-");
	if (parts.length !== 2) return false;
	const [letters, numbers] = parts;
	if (letters.length !== 3 || numbers.length !== 4) return false;
	if (!/^[A-Z]{3}$/.test(letters)) return false;
	if (!/^[0-9]$/.test(numbers[0])) return false;
	if (!/^[A-J0-9]$/.test(numbers[1])) return false;
	if (!/^[0-9]{2}$/.test(numbers.slice(2))) return false;
	return true;
};

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
		res.status(500).json({
			error: "an internal server error occurred",
			details: error.message,
		});
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
		res.status(500).json({
			error: ["an internal server error occurred"],
			details: error.message,
		});
	}
});

router.put("/:id/items", async (req, res) => {
	try {
		const { id } = req.params;
		const { items } = req.body;

		const car = Car.findByPk(id);

		if (!car) {
			return res.status(404).json({ errors: ["car not found"] });
		}

		await CarItem.destroy({ where: { car_id: id } });

		let carItems = [];
		if (items && items.length > 0) {
			carItems = await Promise.all(
				items.map((itemName) =>
					CarItem.create({
						name: itemName,
						car_id: id,
					})
				)
			);
		}

		const updatedCar = await Car.findByPk(id, {
			include: [
				{
					model: CarItem,
					as: "items",
				},
			],
		});

		res.status(204).json();
	} catch (error) {
		console.error("Error when searching for car", error);
		res.status(500).json({
			error: ["an internal server error occurred"],
			details: error.message,
		});
	}
});

router.patch("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const { brand, model, plate, year } = req.body;

		const car = await Car.findByPk(id);

		if (!car) {
			return res.status(404).json({ error: ["car not found"] });
		}

		const errors = [];

		const updateData = {};
		if (brand !== undefined && brand !== null && brand !== "") {
			updateData.brand = brand;
		}
		if (model !== undefined && brand !== null && brand !== "") {
			updateData.model = model;
		}
		if (plate !== undefined && plate !== null && plate !== "") {
			updateData.plate = plate;
		}
		if (year !== undefined && year !== null && year !== "") {
			updateData.year = year;
		}

		if (updateData.brand && !updateData.model) {
			errors.push("model must also be informed");
		}

		if (updateData.year < 2016 || updateData.year > 2026) {
			errors.push("year must be between 2016 and 2026");
		}

		if (updateData.plate && !plateFormatValidator(updateData.plate)) {
			errors.push("plate must be in the correct format ABC-1C34");
		}

		if (updateData.plate && updateData.plate !== car.plate) {
			const existingCar = await Car.findOne({
				where: { plate: updateData.plate },
			});
			if (existingCar) {
				errors.push("car already registered");
			}
		}

		if (errors.length > 0) {
			return res.status(409).json({ errors });
		}

		if (Object.keys(updateData).length === 0) {
			return res.status(204).json();
		}

		await car.update(updateData);

		res.status(204).json();
	} catch (error) {
		console.error("Error when searching for car", error);
		res.status(500).json({
			error: ["an internal server error occurred"],
			details: error.message,
		});
	}
});

router.delete("/:id", async (req, res) => {
	try {
		const { id } = req.params;

		const car = await Car.findByPk(id);

		if (!car) {
			return res.status(404).json({ error: "car not found" });
		}

		await CarItem.destroy({ where: { car_id: id } });

		await car.destroy();

		res.status(204).json();
	} catch (error) {
		console.error("Error when searching for car", error);
		res.status(500).json({
			error: ["an internal server error occurred"],
			details: error.message,
		});
	}
});

module.exports = router;
