/**
 * name : userRoleExtension.js
 * author : Mallanagouda R Biradar
 * created-date : 30-july-2024
 * Description : user role helper functionality.
 */

const { result } = require('lodash')

// Dependencies
const userRoleExtensionQueries = require(DB_QUERY_BASE_PATH + '/userRoleExtension')
const entityTypeQueries = require(DB_QUERY_BASE_PATH + '/entityTypes')

module.exports = class userRoleExtensionHelper {
	/**
	 * Create a new user role extension with the provided body data.
	 * @param {Object} body - The data to create the new user role extension.
	 * @returns {Promise<Object>} - A promise that resolves with the new user role extension data or rejects with an error.
	 */
	static create(body) {
		return new Promise(async (resolve, reject) => {
			try {
				// Using map to handle validation
				await Promise.all(
					body.entityTypes.map(async (entityTypeData) => {
						// Validate that both entityType and entityTypeId exist in the entityType DB
						let existingEntityType = await entityTypeQueries.findOne({
							name: entityTypeData.entityType,
							_id: ObjectId(entityTypeData.entityTypeId),
						})

						if (!existingEntityType) {
							// If any entityType is invalid, reject the request
							throw {
								status: HTTP_STATUS_CODE.bad_request.status,
								message: `EntityType '${entityTypeData.entityType}' with ID '${entityTypeData.entityTypeId}' does not exist.`,
							}
						}
					})
				)
				// Call the queries function to create a new user role extension with the provided body data
				let newUserRole = await userRoleExtensionQueries.create(body)

				return resolve({
					message: CONSTANTS.apiResponses.USER_ROLE_INFORMATION_CREATED,
					result: newUserRole,
				})
			} catch (error) {
				return reject(error)
			}
		})
	}

	/**
	 * Update a user role extension with the provided userRoleId and body data.
	 * @param {ObjectId} userRoleId - The ID of the user role extension to be updated.
	 * @param {Object} bodyData - The data to update the user role extension.
	 * @returns {Promise<Object>} - A promise that resolves with the updated user role extension data or rejects with an error.
	 */
	static update(userRoleId, bodyData) {
		return new Promise(async (resolve, reject) => {
			try {
				// Find and update the user role extension based on the provided userRoleId and bodyData
				let userInformation = await userRoleExtensionQueries.findOneAndUpdate(
					{ _id: ObjectId(userRoleId) },
					bodyData,
					{ new: true }
				)

				// If the user role extension is not found, reject the promise with a 404 status and an error message
				if (!userInformation) {
					return reject({ status: 404, message: CONSTANTS.apiResponses.ROLES_NOT_FOUND })
				}

				resolve({
					success: true,
					message: CONSTANTS.apiResponses.USER_ROLE_UPDATATED,
					result: userInformation,
				})
			} catch (error) {
				reject(error)
			}
		})
	}

	/**
	 * Find user role extensions based on the provided query and projection.
	 * @param {Object} bodyQuery - The query to filter user role extensions.
	 * @param {Array<String>} projection - The fields to include in the returned documents.
	 * @returns {Promise<Object>} - A promise that resolves with the found user role extensions or rejects with an error.
	 */
	static find(bodyQuery, projection) {
		return new Promise(async (resolve, reject) => {
			try {
				// Fetch user role extensions based on the provided query and projection
				const result = await userRoleExtensionQueries.userDocuments(bodyQuery, projection)
				// If no user role extensions are found, throw an error with a 404 status and an error message
				if (result.length < 1) {
					throw {
						status: HTTP_STATUS_CODE.not_found.status,
						message: CONSTANTS.apiResponses.ROLES_NOT_FOUND,
					}
				}
				return resolve({
					success: true,
					message: CONSTANTS.apiResponses.ASSETS_FETCHED_SUCCESSFULLY,
					result: result,
				})
			} catch (error) {
				return reject(error)
			}
		})
	}

	/**
	 * Delete a user role extension by its ID.
	 * @param {String} userRoleId - The ID of the user role extension to delete.
	 * @returns {Promise<Object>} - A promise that resolves with a success message or rejects with an error.
	 */
	static delete(userRoleId) {
		return new Promise(async (resolve, reject) => {
			try {
				// Find and delete the user role extension based on the provided user role ID
				let userInformation = await userRoleExtensionQueries.findOneAndDelete({ _id: ObjectId(userRoleId) })

				// If no user role extension is found, reject the promise with a 404 status and an error message
				if (!userInformation) {
					return reject({ status: 404, message: CONSTANTS.apiResponses.ROLES_NOT_FOUND })
				}

				resolve({
					success: true,
					message: CONSTANTS.apiResponses.USER_ROLE_DELETED,
				})
			} catch (error) {
				reject(error)
			}
		})
	}
}
