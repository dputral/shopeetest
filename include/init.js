const config = require('./config')
var util = require('util');
var mysql = require('mysql2')
// var pool = mysql.createPool({
	// host: process.env.DATABASE_HOST,
	// user: process.env.MYSQL_USER,
	// password: process.env.MYSQL_PASSWORD,
	// database: process.env.MYSQL_DATABASE,
	// multipleStatements: true
// })

var pool = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'test',
	multipleStatements: true
})

pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.');
        }
    }

    if (connection) connection.release()
    return
})

pool.aquery = util.promisify(pool.query)
module.exports = { pool : pool,config : config }