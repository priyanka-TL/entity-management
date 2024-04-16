module.exports = class entities {
	/**
	 * Get Aggregate of Project documents.
	 * @method
	 * @name getAggregate
	 * @param {Object} [aggregateData] - aggregate Data.
	 * @returns {Array} - Project data.
	 */

	static getAggregate(aggregateData) {
		return new Promise(async (resolve, reject) => {
			try {
				let entityData = await database.models.entities.aggregate(aggregateData)
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
	 * Update project documents.
	 * @method
	 * @name findOneAndUpdate
	 * @param {Object} [filterQuery] - filtered Query.
	 * @param {Object} [updateData] - update data.
	 * @returns {Object} - Project data.
	 */

	static findOneAndUpdate(findQuery, UpdateObject, returnData = {}) {
		return new Promise(async (resolve, reject) => {
			try {
				let entityData = await database.models.entities.findOneAndUpdate(findQuery, UpdateObject, returnData)
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
	 * Create project documents.
	 * @method
	 * @name create
	 * @param {Object} [projectData] - project Data.
	 * @returns {Array} - Project data.
	 */

	static create(projectData) {
		return new Promise(async (resolve, reject) => {
			try {
				let entityData = await database.models.entities.create(projectData)
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
	 * update Many project categories documents.
	 * @method
	 * @name updateMany
	 * @param {Object} [filterQuery] - filtered Query.
	 * @param {Object} [updateData] - update data.
	 * @returns {Array} - Library project categories data.
	 */

	static updateMany(filterQuery, updateData) {
		return new Promise(async (resolve, reject) => {
			try {
				let updatedCategories = await database.models.entities.updateMany(filterQuery, updateData)

				return resolve(updatedCategories)
			} catch (error) {
				return reject({
					status: error.status || HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message || HTTP_STATUS_CODE.internal_server_error.message,
					errorObject: error,
				})
			}
		})
	}

	static findOne(filterData = 'all', fieldsArray = 'all', skipFields = 'none') {
		return new Promise(async (resolve, reject) => {
			try {
				let queryObject = filterData !== 'all' ? filterData : {}
				let projection = {}

				if (fieldsArray !== 'all') {
					if (typeof fieldsArray === 'object' && !Array.isArray(fieldsArray)) {
						// Convert fieldsArray object to projection object
						projection = fieldsArray
					} else if (Array.isArray(fieldsArray)) {
						fieldsArray.forEach((field) => {
							projection[field] = 1
						})
					}
				}

				if (skipFields !== 'none' && Array.isArray(skipFields)) {
					skipFields.forEach((field) => {
						projection[field] = 0
					})
				}

				let document = await database.models.entityTypes.findOne(queryObject, projection).lean()

				if (!document) {
					return reject({
						status: 404,
						message: 'Document not found',
					})
				}

				return resolve(document)
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
	 * Lists of projects document.
	 * @method
	 * @name projectDocument
	 * @param {Array} [filterData = "all"] - project filter query.
	 * @param {Array} [fieldsArray = "all"] - projected fields.
	 * @param {Array} [skipFields = "none"] - field not to include
	 * @returns {Array} Lists of projects.
	 */

	static entityDocuments(findQuery = 'all', fields = 'all', limitingValue = '', skippingValue = '', sortedData = '') {
		return new Promise(async (resolve, reject) => {
			console.log(limitingValue, 'line no 15333333333')
			try {
				let queryObject = {}

				if (findQuery != 'all') {
					queryObject = findQuery
				}
				let projectionObject = {}

				if (fields != 'all') {
					fields.forEach((element) => {
						projectionObject[element] = 1
					})
				}

				let entitiesDocuments

				if (sortedData !== '') {
					entitiesDocuments = await database.models.entities
						.find(queryObject, projectionObject)
						.sort(sortedData)
						.limit(limitingValue)
						.skip(skippingValue)
						.lean()
				} else {
					entitiesDocuments = await database.models.entities
						.find(queryObject, projectionObject)
						.limit(limitingValue)
						.skip(skippingValue)
						.lean()
				}
				return resolve(entitiesDocuments)
			} catch (error) {
				return reject({
					status: error.status || HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message || HTTP_STATUS_CODE.internal_server_error.message,
					errorObject: error,
				})
			}
		})
	}
}
