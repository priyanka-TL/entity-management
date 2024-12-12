/**
 * name : userRoleExtension.js
 * author : Mallanagouda R Biradar
 * created-date : 21-Mar-2024
 * Description : userRoleExtension helper for DB interactions.
 */

module.exports = class userRoleExtension {
	/**
	 * Create a new user role extension.
	 * @param {Object} userData - The data of the user role extension to create.
	 * @returns {Promise<Object>} - A promise that resolves with the created user role extension or rejects with an error.
	 */
	static create(userData) {
		return new Promise(async (resolve, reject) => {
			try {
				let userRoleData = await database.models.userRoleExtension.create(userData)
				return resolve(userRoleData)
			} catch (error) {
				return reject({
					status: error.status || HTTP_STATUS_CODE.bad_request.status,
					message: error.message || HTTP_STATUS_CODE.bad_request.message,
					errorObject: error,
				})
			}
		})
	}

	/**
	 * Find a user role extension document and update it.
	 * @param {Object} findQuery - The query to find the user role extension document.
	 * @param {Object} UpdateObject - The data to update the user role extension document.
	 * @param {Object} [returnData={}] - Optional parameters for the update operation.
	 * @returns {Promise<Object>} - A promise that resolves with the updated user role extension document or rejects with an error.
	 */
	static findOneAndUpdate(findQuery, UpdateObject, returnData = {}) {
		return new Promise(async (resolve, reject) => {
			try {
				let userData = await database.models.userRoleExtension.findOneAndUpdate(
					findQuery,
					UpdateObject,
					returnData
				)
				return resolve(userData)
			} catch (error) {
				return reject({
					status: error.status || HTTP_STATUS_CODE.bad_request.status,
					message: error.message || HTTP_STATUS_CODE.bad_request.message,
					errorObject: error,
				})
			}
		})
	}

	/**
	 * Retrieve user role extension documents based on the provided query, projection, and other options.
	 * @param {Object|string} [findQuery='all'] - The query to find the user role extension documents or 'all' to retrieve all documents.
	 * @param {string[]} [fields=''] - The fields to include in the retrieved documents or 'all' to include all fields.
	 * @param {number} [limitingValue=''] - The maximum number of documents to retrieve.
	 * @param {number} [skippingValue=''] - The number of documents to skip before retrieving.
	 * @param {Object} [sortedData=''] - The sorting order for the retrieved documents.
	 * @returns {Promise<Object[]>} - A promise that resolves with the retrieved user role extension documents or rejects with an error.
	 */
	static userDocuments(findQuery = 'all', fields = '', limitingValue = '', skippingValue = '', sortedData = '') {
		return new Promise(async (resolve, reject) => {
			try {
				let queryObject = {}

				// Set queryObject based on provided findQuery
				if (findQuery != 'all') {
					queryObject = findQuery
				}
				let projectionObject = {}

				// Configure projectionObject to specify fields to include
				if (fields != 'all') {
					fields.forEach((element) => {
						projectionObject[element] = 1
					})
				}

				// Execute query with optional sorting, limiting, and skipping
				let userDocuments

				// Perform find operation with sorting, limiting, skipping, and return as plain JavaScript object
				if (sortedData !== '') {
					userDocuments = await database.models.userRoleExtension
						.find(queryObject, projectionObject)
						.sort(sortedData)
						.limit(limitingValue)
						.skip(skippingValue)
						.lean()
				} else {
					userDocuments = await database.models.userRoleExtension
						.find(queryObject, projectionObject)
						.limit(limitingValue)
						.skip(skippingValue)
						.lean()
				}
				return resolve(userDocuments)
			} catch (error) {
				return reject({
					status: error.status || HTTP_STATUS_CODE.bad_request.status,
					message: error.message || HTTP_STATUS_CODE.bad_request.message,
					errorObject: error,
				})
			}
		})
	}

	/**
	 * Find and delete a single user role extension document based on the provided query.
	 * @param {Object} findQuery - The query object to find the document to delete.
	 * @returns {Promise<Object|null>} - A promise that resolves with the deleted user role extension document if found, or `null` if no document was found.
	 * It rejects with an error if an issue occurs during the operation.
	 */
	static findOneAndDelete(findQuery) {
		return new Promise(async (resolve, reject) => {
			try {
				let userData = await database.models.userRoleExtension.findOneAndDelete(findQuery)
				return resolve(userData)
			} catch (error) {
				return reject({
					status: error.status || HTTP_STATUS_CODE.bad_request.status,
					message: error.message || HTTP_STATUS_CODE.bad_request.message,
					errorObject: error,
				})
			}
		})
	}
}
