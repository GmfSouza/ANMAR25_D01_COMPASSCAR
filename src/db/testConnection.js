const Sequelize = require('sequelize')
const dbConfig = require ('../config/database.js')

const connection = new Sequelize(dbConfig)

try {
    connection.authenticate()
    console.log('Connection has been estabilished successfully')
} catch (error) {
    console.error('unable to connect to the database:', error)
}

module.exports = connection