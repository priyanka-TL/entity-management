/**
 * name : app.js.
 * author : Aman Karki.
 * created-date : 13-July-2020.
 * Description : Root file.
 */

require('module-alias/register')
require('dotenv').config()
// express
const express = require('express')
const app = express()
const { elevateLog } = require('elevate-logger')
const logger = elevateLog.init()
const fileUpload = require('express-fileupload')
const fs = require('fs')

// Health check
require('./healthCheck')(app)

// Setup application config, establish DB connections, and set global constants.
require('@config/connections')
require('@config/globals')()

const environmentData = require('./envVariables.js')()

if (!environmentData.success) {
	logger.error('Server could not start . Not all environment variable is provided', {
		triggerNotification: true,
	})
	process.exit()
}
// Check if all environment variables are provided.

// Required modules
const bodyParser = require('body-parser')
const cors = require('cors')
const path = require('path')
const expressValidator = require('express-validator')

// Enable CORS
app.use(cors())
app.use(expressValidator())

// Middleware for handling file uploads
app.use(fileUpload())
app.use(bodyParser.json({ limit: '50MB' }))
app.use(bodyParser.urlencoded({ limit: '50MB', extended: false }))

app.use(express.static('public'))

// API Documentation
app.get(process.env.API_DOC_URL, function (req, res) {
	res.sendFile(path.resolve('./api-doc/index.html'))
})

// Debugging middleware
app.all('*', (req, res, next) => {
	console.log({ 'Debugging Entity Service': true })
	console.log('<------------Request log starts here------------------>')
	console.log('Request URL: ', req.url)
	console.log('Request Headers: ', JSON.stringify(req.headers))
	console.log('Request Body: ', JSON.stringify(req.body))
	//   console.log("Request Files: ", req.files)
	console.log('<---------------Request log ends here------------------>')
	next()
})

// Router module
const router = require('@routes')

// Add routing
router(app)

// Listen on the specified port
const server = app.listen(process.env.APPLICATION_PORT, () => {
	console.log('Environment : ' + process.env.APPLICATION_ENV)
	console.log('Application is running on the port : ' + process.env.APPLICATION_PORT)
})

server.timeout = 2000000

module.exports = app
