const express = require("express");
const router = express.Router();
const Car = require("../models/car.js");
const CarItem = require("../models/carItem.js");

const plateFormatValidator = (plate) => {
	if (!plate) return false;
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

const CarDataValidator = async (data) => {
	const errors = [];

	if (!data.brand) errors.push("brand is required");
	if (!data.model) errors.push("model is required");
	if (!data.year) errors.push("year is required");
	if (!data.plate) errors.push("plate is required");

	if ((data.year && data.year < 2016) || data.year > 2026) {
		errors.push("year must be between 2016 and 2026");
	}

	if (data.plate && !plateFormatValidator(data.plate)) {
		errors.push("plate must be in the correct format ABC-1C34");
	}

	if (data.plate) {
		const existingCar = await Car.findOne({ where: { plate: data.plate } });
		if (existingCar) {
			errors.push("car already registered");
		}
	}

	return errors;
};

const itemsValidator = (items) => {
	const errors = [];

	if (!Array.isArray(items) || items.length === 0) {
		errors.push("items is required");
	} else {
		if (items.length > 5) {
			errors.push("items must be a maximum of 5");
		}

		const singleItem = new Set(items);
		if (singleItem.size !== items.length) {
			errors.push("items cannot be repeated");
		}
	}

	return errors;
};

router.post("/", async (req, res) => {
	try {
		const { brand, model, plate, year } = req.body;

		const errors = await CarDataValidator({ brand, model, plate, year });
		if (errors.length > 0) {
			if (errors.includes("car already registered")) {
				return res.status(409).json({ errors });
			}
			return res.status(400).json({ errors });
		}

		const car = await Car.create({
			brand,
			model,
			plate,
			year,
		});

		res.status(201).json(car.toJSON());
	} catch (error) {
		console.error("Error creating car:", error);
		res.status(500).json({ errors: ["an internal server error occurred"] });
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
		console.error("Error when searching for cars", error);
		res.status(500).json({ errors: ["an internal server error occurred"] });
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
			return res.status(404).json({ errors: ["car not found"] });
		}

		const carData = car.toJSON();
		carData.items = carData.items.map(item => item.name);

		res.status(200).json(carData);
	} catch (error) {
		console.error("Error when searching for car:", error);
		res.status(500).json({ errors: ["an internal server error occurred"] });
	}
});

router.put("/:id/items", async (req, res) => {
	try {
		const { id } = req.params;
		const { items } = req.body;

		const car = await Car.findByPk(id);
		if (!car) {
			return res.status(404).json({ errors: ["car not found"] });
		}

		const errors = itemsValidator(items);
		if (errors.length > 0) {
			return res.status(400).json({ errors });
		}

		await CarItem.destroy({ where: { car_id: id } });

		await Promise.all(
			items.map((itemName) =>
				CarItem.create({
					name: itemName,
					car_id: id,
				})
			)
		);

		res.status(204).send();
	} catch (error) {
		console.error("Error updating car items:", error);
		res.status(500).json({ errors: ["an internal server error occurred"] });
	}
});

router.patch("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const { brand, model, plate, year } = req.body;

		const car = await Car.findByPk(id);

		if (!car) {
			return res.status(404).json({ errors: ["car not found"] });
		}

		const errors = [];

		const updateData = {};
		if (brand !== undefined && brand !== null && brand !== "") {
			updateData.brand = brand;
		}
		if (model !== undefined && model !== null && model !== "") {
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

		if (updateData.year && (updateData.year < 2016 || updateData.year > 2026)) {
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
			if (errors.includes("car already registered")) {
				return res.status(409).json({ errors });
			}
			return res.status(400).json({ errors });
		}

		if (Object.keys(updateData).length === 0) {
			return res.status(204).send();
		}

		await car.update(updateData);

		res.status(204).send();
	} catch (error) {
		console.error("Error updating car:", error);
		res.status(500).json({ errors: ["an internal server error occurred"] });
	}
});

router.delete("/:id", async (req, res) => {
	try {
		const { id } = req.params;

		const car = await Car.findByPk(id);

		if (!car) {
			return res.status(404).json({ errors: ["car not found"] });
		}

		await CarItem.destroy({ where: { car_id: id } });

		await car.destroy();

		res.status(204).send();
	} catch (error) {
		console.error("Error deleting car:", error);
		res.status(500).json({ errors: ["an internal server error occurred"] });
	}
});

module.exports = router;
