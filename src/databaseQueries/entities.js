module.exports = class entities {
	/**
	 * Get Aggregate of entities documents.
	 * @method
	 * @name getAggregate
	 * @param {Object} [aggregateData] - aggregate Data.
	 * @returns {Array} - entities data.
	 */

	static getAggregate(aggregateData) {
		return new Promise(async (resolve, reject) => {
			try {
				// Use database model 'entities' to perform aggregation using the provided aggregateData
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
	 * Update entities documents.
	 * @method
	 * @name findOneAndUpdate
	 * @param {Object} [filterQuery] - filtered Query.
	 * @param {Object} [UpdateObject] - update data.
	 * @returns {Object} - entities data.
	 */

	static findOneAndUpdate(findQuery, UpdateObject, returnData = {}) {
		return new Promise(async (resolve, reject) => {
			try {
				// Use database model 'entities' to find and update a document based on the provided query and update object
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
	 * Create entities documents.
	 * @method
	 * @name create
	 * @param {Object} [entitiesData] - project Data.
	 * @returns {Array} - entities data.
	 */

	static create(entitiesData) {
		return new Promise(async (resolve, reject) => {
			try {
				// Use database model 'entities' to create new entities based on the provided data
				let entityData = await database.models.entities.create(entitiesData)
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
	 * update Many entities categories documents.
	 * @method
	 * @name updateMany
	 * @param {Object} [filterQuery] - filtered Query.
	 * @param {Object} [updateData] - update data.
	 * @returns {Array} - Library entities categories data.
	 */

	static updateMany(filterQuery, updateData) {
		return new Promise(async (resolve, reject) => {
			try {
				// Use database model 'entities' to update multiple documents based on the provided filter query and update data
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

	/**
	 * find entities documents.
	 * @method
	 * @name findOne
	 * @param {Object} [filterData] - project Data.
	 * @param {Object} [fieldsArray] - project Data.
	 * @returns {Array} - entities data.
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
				let document = await database.models.entities.findOne(queryObject, projection).lean()

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
	 * Implement find query for entity
	 * @method
	 * @name entityDocuments
	 * @param {Object} [findQuery = "all"] - filter query object if not provide
	 * it will load all the document.
	 * @param {Array} [fields = "all"] - All the projected field. If not provided
	 * returns all the field
	 * @param {Number} [limitingValue = ""] - total data to limit.
	 * @param {Number} [skippingValue = ""] - total data to skip.
	 * @returns {Array} - returns an array of entities data.
	 */

	static entityDocuments(
		findQuery = 'all',
		fields = '',
		limitingValue = '',
		skippingValue = '',
		sortedData = '',
		paginate = false
	) {
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
				let entitiesDocuments

				let query = database.models.entities.find(queryObject, projectionObject).lean()

				if (sortedData !== '') {
					query = query.sort(sortedData)
				}
				if (paginate && (limitingValue != '' || skippingValue != '')) {
					query = query.limit(limitingValue).skip(skippingValue)
				}
				entitiesDocuments = await query

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

	/**
	 * Implement count query for entity
	 * @method
	 * @name countEntityDocuments
	 * @param {Object} [findQuery = "all"] - filter query object if not provide
	 * @returns {Object} - returns count
	 */

	static countEntityDocuments(findQuery = 'all') {
		return new Promise(async (resolve, reject) => {
			try {
				let queryObject = {}

				// Set queryObject based on provided findQuery
				if (findQuery != 'all') {
					queryObject = findQuery
				}

				const count = await database.models.entities.find(queryObject).count()

				return resolve(count)
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
