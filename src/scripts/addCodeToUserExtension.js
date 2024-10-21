/*
This Node.js script is designed to update existing records in the `userRoleExtension` collection of the database.
During the initial setup, some records may not have a `code` field. This script addresses that by checking for
records where the `code` field is missing and automatically generating a default `code` based on the `title` field.
It converts the title to a lowercase, underscore-separated string and updates the records accordingly. 
The script ensures that all user role extensions have a consistent `code`, which is necessary for application functionality.
*/

require('dotenv').config({ path: '../.env' })
//global.config = require('../config');
require('../config/globals')()
let environmentData = require('../envVariables')()

async function addDefaultRecords() {
	try {
		const queryObject = {
			code: { $exists: false },
		}

		const allUserRoleExtensionRecordrecords = await database.models.userRoleExtension.find(queryObject)

		for (let singleRecord of allUserRoleExtensionRecordrecords) {
			try {
				console.log('processing...')
				let title = singleRecord.title
				let code = convertString(title)

				let updateRecord = await database.models.userRoleExtension.update(
					{ _id: singleRecord._id }, // Query to match the record by ID
					{ $set: { code: code } } // Update operation to set 'code' field to 'output' variable
				)

				console.log(updateRecord, 'updateRecord')
			} catch (err) {
				console.log(err)
				continue
			}
		}

		console.log('Script ran successfully')
	} catch (error) {
		console.error('Error:', error)
		process.exit(1)
	}
}

addDefaultRecords()

function convertString(str) {
	return str.replace(/\s+/g, '_').toLowerCase()
}
