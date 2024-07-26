/**
 * name : user.js
 * author : Mallanagouda R Biradar
 * Date : 16-July-2024
 * Description : All user functions.
 */

const request = require('request')
const userServiceUrl = process.env.USER_SERVICE_URL

/**
 * Retrieves user roles based on the provided filter data.
 * @param {Object} filterData - The filter data containing the entityTypeId.
 * @param {string} filterData.entityTypeId - The ID of the entity type to filter user roles.
 * @returns {Promise<Object>} A promise that resolves to the response containing the fetched user roles or an error object.
 */
const readUserRolesBasedOnEntityType = function (filterData) {
	return new Promise(async (resolve, reject) => {
		try {
			// Construct the URL for the user service
			let url = userServiceUrl + CONSTANTS.endpoints.USER_READ
			// Set the options for the HTTP GET request
			const options = {
				headers: {
					'content-type': 'application/json',
					internal_access_token: process.env.INTERNAL_ACCESS_TOKEN,
				},
				json: {
					entityTypeId: filterData,
				},
			}
			// Make the GET request to the user service
			request.get(url, options, userReadCallback)
			let result = {
				success: true,
			}
			// Callback function to handle the response from the user service.
			function userReadCallback(err, data) {
				if (err) {
					result.success = false
				} else {
					let response = data.body
					if (response.responseCode === HTTP_STATUS_CODE['ok'].code) {
						result = response.result
					} else {
						result.success = false
					}
				}
				return resolve(result)
			}
			// Set a timeout to handle potential server timeout scenarios
			setTimeout(function () {
				return resolve(
					(result = {
						success: false,
					})
				)
			}, CONSTANTS.common.SERVER_TIME_OUT)
		} catch (error) {
			return reject(error)
		}
	})
}

module.exports = {
	readUserRolesBasedOnEntityType: readUserRolesBasedOnEntityType,
}
