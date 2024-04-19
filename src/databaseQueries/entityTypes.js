/**
 * name : .js
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

                if (fieldsArray !== 'all') {
					if (typeof fieldsArray === 'object' && !Array.isArray(fieldsArray)) {
						projection = fieldsArray
					} else if (Array.isArray(fieldsArray)) {
						fieldsArray.forEach((field) => {
							projection[field] = 1
						})
					}
				}


				if (skipFields !== 'none') {
					skipFields.forEach((field) => {
						projection[field] = 0
					})
				}
				let entityTypesDoc = await database.models.entityTypes.find(queryObject, projection).lean()

				return resolve(entityTypesDoc)
			} catch (error) {
				return reject(error)
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
				let entityData = await database.models.entityTypes.create(entityTypeData)
				return resolve(entityData)
			} catch (error) {
				return reject({
					status: error.status || HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message || HTTP_STATUS_CODE.internal_server_error.message,
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
				let entityTypeData = await database.models.entityTypes.findOneAndUpdate(
					findQuery,
					updateObject,
					returnData
				)
				return resolve(entityTypeData)
			} catch (error) {
				return reject({
					status: error.status || HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message || HTTP_STATUS_CODE.internal_server_error.message,
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
				if (Object.keys(query).length == 0) {
					throw new Error(CONSTANTS.apiResponses.UPDATE_QUERY_REQUIRED)
				}

				if (Object.keys(updateObject).length == 0) {
					throw new Error(CONSTANTS.apiResponses.UPDATE_OBJECT_REQUIRED)
				}

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
					success: false,
					message: error.message,
					data: false,
				})
			}
		})
	}
}
