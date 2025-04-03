const { Sequelize, DataTypes } = require("sequelize");
const connection = require("../db/dbConnection.js");
const Car = require("../models/car.js");

const CarItem = connection.define(
	"CarItem",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		car_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: Car,
				key: "id",
			},
		},
		 created_at: {
		 	type: DataTypes.DATE,
		 	defaultValue: Sequelize.NOW,
		 },
	},
	{
		tableName: "cars_items",
		timestamps: false,
		underscored: true,
	}
);

Car.hasMany(CarItem, { foreignKey: "car_id", as: "items" });
CarItem.belongsTo(Car, { foreignKey: "car_id" });

module.exports = CarItem;
