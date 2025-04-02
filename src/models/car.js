const { Sequelize, DataTypes } = require("sequelize");
const connection = require("../db/dbConnection.js");

const Car = connection.define(
	"Car",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		brand: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		model: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		plate: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false,
		},
		year: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		created_at: {
			type: DataTypes.DATE,
			defaultValue: Sequelize.NOW,
		},
	},
	{
		timestamps: false,
		underscored: true,
	}
);

module.exports = Car;
