/**
 * name : EntityTypes.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : EntityTypes helper for DB interactions.
 */

// DependenciesentityTypes

/**
 * entityTypes
 * @class
 */

module.exports = class EntityTypes {
	/**
	 * entityTypesDocument details.
	 * @method
	 * @name entityTypesDocument
	 * @param {Array} [filterData = "all"] - entityTypes filter query.
	 * @param {Array} [fieldsArray = "all"] - projected fields.
	 * @param {Array} [skipFields = "none"] - field not to include
	 * @returns {Array} entityTypes details.
	 */

	static entityTypesDocument(filterData = 'all', fieldsArray = 'all', skipFields = 'none') {
		return new Promise(async (resolve, reject) => {
			try {
				let queryObject = filterData != 'all' ? filterData : {}
				let projection = {}

				// Configure projection based on provided fieldsArray
				if (fieldsArray !== 'all') {
					if (typeof fieldsArray === 'object' && !Array.isArray(fieldsArray)) {
						// If fieldsArray is an object, use it directly as projection
						projection = fieldsArray
					} else if (Array.isArray(fieldsArray)) {
						fieldsArray.forEach((field) => {
							projection[field] = 1
						})
					}
				}

				// Exclude specified fields from projection if skipFields is provided as an array
				if (skipFields !== 'none') {
					skipFields.forEach((field) => {
						projection[field] = 0
					})
				}

				// Find entity types documents based on queryObject and projection, and return as plain JavaScript objects
				let entityTypesDoc = await database.models.entityTypes.find(queryObject, projection).lean()

				return resolve(entityTypesDoc)
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
	 * Create entityTypes documents.
	 * @method
	 * @name create
	 * @param {Object} [projectData] - entityTypes Data.
	 * @returns {Array} - entityTypes data.
	 */

	static create(entityTypeData) {
		return new Promise(async (resolve, reject) => {
			try {
				// Use Mongoose's create method to insert a new document into the entityTypes collection
				let entityData = await database.models.entityTypes.create(entityTypeData)
				return resolve(entityData)
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
	 * find entityType documents.
	 * @method
	 * @name findOne
	 * @param {Object} [filterData] - project Data.
	 * @param {Object} [fieldsArray] - project Data.
	 * @returns {Array} - entityType data.
	 */

	static findOne(filterData = 'all', fieldsArray = 'all', skipFields = 'none') {
		return new Promise(async (resolve, reject) => {
			try {
				// Determine the query object based on the provided filterData
				let queryObject = filterData !== 'all' ? filterData : {}
				let projection = {}

				// Configure projection based on provided fieldsArray
				if (fieldsArray !== 'all') {
					if (typeof fieldsArray === 'object' && !Array.isArray(fieldsArray)) {
						projection = fieldsArray
					} else if (Array.isArray(fieldsArray)) {
						fieldsArray.forEach((field) => {
							projection[field] = 1
						})
					}
				}

				// Exclude specified fields from projection if skipFields is provided as an array
				if (skipFields !== 'none' && Array.isArray(skipFields)) {
					skipFields.forEach((field) => {
						projection[field] = 0
					})
				}

				// Find one document matching the queryObject with specified projection and return as plain JavaScript object
				let document = await database.models.entityTypes.findOne(queryObject, projection).lean()

				return resolve(document)
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
	 * Update entityTypes documents.
	 * @method
	 * @name findOneAndUpdate
	 * @param {Object} [filterQuery] - filtered Query.
	 * @param {Object} [updateData] - update data.
	 * @returns {Object} - entityTypes data.
	 */

	static findOneAndUpdate(findQuery, updateObject, returnData = {}) {
		return new Promise(async (resolve, reject) => {
			try {
				// Use Mongoose's findOneAndUpdate method to update a document based on the findQuery
				// The updateObject specifies the new values to set, and returnData controls the data to return after the update
				let entityTypeData = await database.models.entityTypes.findOneAndUpdate(
					findQuery,
					updateObject,
					returnData
				)
				return resolve(entityTypeData)
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
	 * Update entityTypes document.
	 * @method
	 * @name updateEntityTypesDocument
	 * @param {Object} query - query to find document
	 * @param {Object} updateObject - fields to update
	 * @returns {String} - message.
	 */

	static updateEntityTypesDocument(query = {}, updateObject = {}) {
		return new Promise(async (resolve, reject) => {
			try {
				// Check if the query object is empty
				if (Object.keys(query).length == 0) {
					throw new Error(CONSTANTS.apiResponses.UPDATE_QUERY_REQUIRED)
				}

				// Check if the updateObject is empty
				if (Object.keys(updateObject).length == 0) {
					throw new Error(CONSTANTS.apiResponses.UPDATE_OBJECT_REQUIRED)
				}

				// Use Mongoose's updateOne method to update a document based on the query and updateObject
				let updateResponse = await database.models.entityTypes.updateOne(query, updateObject)

				if (updateResponse.nModified == 0) {
					throw new Error(CONSTANTS.apiResponses.FAILED_TO_UPDATE)
				}

				return resolve({
					success: true,
					message: CONSTANTS.apiResponses.UPDATED_DOCUMENT_SUCCESSFULLY,
					data: true,
				})
			} catch (error) {
				return resolve({
					status: error.status || HTTP_STATUS_CODE.bad_request.status,
					message: error.message || HTTP_STATUS_CODE.bad_request.message,
					data: false,
				})
			}
		})
	}
}
