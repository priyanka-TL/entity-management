/**
 * name : helper.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : entities helper functionality.
 */

// Dependencies
const entityTypeQueries = require(DB_QUERY_BASE_PATH + '/entityTypes')

// const entitiesHelper = require(MODULES_BASE_PATH + "/entities/helper")
// const programUsersQueries = require(DB_QUERY_BASE_PATH + "/programUsers")

/**
 * UserProjectsHelper
 * @class
 */

module.exports = class UserProjectsHelper {
	/**
	 * Bulk create entity Type.
	 * @method
	 * @name bulkCreate
	 * @param {Object} userDetails - logged in user details.
	 * @param {Array}  entityTypesCSVData - Array of entity data.
	 * @returns {JSON} - uploaded entity information.
	 */
	static bulkCreate(entityTypesCSVData, userDetails) {
		return new Promise(async (resolve, reject) => {
			try {
				const entityTypesUploadedData = await Promise.all(
					entityTypesCSVData.map(async (entityType) => {
						try {
							entityType = UTILS.valueParser(entityType)
							entityType['tenantId'] = userDetails.tenantAndOrgInfo.tenantId
							entityType['orgIds'] = CONSTANTS.common.ALL
							entityType.registryDetails = {}
							let removedKeys = []

							// Extract registry details and remove related keys from entityType
							Object.keys(entityType).forEach(function (eachKey) {
								if (eachKey.startsWith('registry-')) {
									let newKey = eachKey.replace('registry-', '')
									entityType.registryDetails[newKey] = entityType[eachKey]
									removedKeys.push(entityType[eachKey])
								}
								removedKeys.forEach((key) => delete entityType[key])
							})
							if (entityType.profileFields) {
								entityType.profileFields = entityType.profileFields.split(',') || []
							}

							// Process immediateChildrenEntityType to ensure uniqueness
							if (
								entityType.immediateChildrenEntityType != '' &&
								entityType.immediateChildrenEntityType != undefined
							) {
								let entityTypeImmediateChildren = entityType.immediateChildrenEntityType.split(',')
								entityTypeImmediateChildren = _.uniq(entityTypeImmediateChildren)

								entityType.immediateChildrenEntityType = new Array()
								entityTypeImmediateChildren.forEach((immediateChildren) => {
									entityType.immediateChildrenEntityType.push(immediateChildren)
								})
							}

							if (entityType.isObservable) {
								entityType.isObservable = UTILS.convertStringToBoolean(entityType.isObservable)
							}
							if (entityType.toBeMappedToParentEntities) {
								entityType.toBeMappedToParentEntities = UTILS.convertStringToBoolean(
									entityType.toBeMappedToParentEntities
								)
							}

							if (removedKeys && removedKeys.length > 0) {
								for (var key in entityType) {
									for (var removedKey in removedKeys) {
										if (entityType.hasOwnProperty(removedKey)) {
											delete entityType[removedKey]
										}
									}
								}
							}

							// Set userId based on userDetails
							const userId =
								userDetails && userDetails.userInformation.userId
									? userDetails && userDetails.userInformation.userId
									: CONSTANTS.common.SYSTEM

							if (!entityType.name) {
								entityType['_SYSTEM_ID'] = ''
								entityType.status = CONSTANTS.apiResponses.ENTITY_TYPE_FAILED
								entityType.message = CONSTANTS.apiResponses.FIELD_MISSING
								return entityType
							}
							let newEntityType = await entityTypeQueries.create(
								_.merge(
									{
										isDeleted: false,
										updatedBy: userId,
										createdBy: userId,
									},
									entityType
								)
							)
							if (newEntityType._id) {
								entityType['_SYSTEM_ID'] = newEntityType._id
								entityType.status = CONSTANTS.apiResponses.SUCCESS
							} else {
								entityType['_SYSTEM_ID'] = ''
								entityType.status = CONSTANTS.apiResponses.FAILURE
							}
						} catch (error) {
							entityType['_SYSTEM_ID'] = ''
							entityType.status = CONSTANTS.apiResponses.FAILURE
							entityType.message = CONSTANTS.apiResponses.FAILURE
						}

						return entityType
					})
				)

				return resolve(entityTypesUploadedData)
			} catch (error) {
				return reject(error)
			}
		})
	}

	/**
	 * create single entity.
	 * @method
	 * @name create
	 * @param {Object} body - requested entity data.
	 * @param {Object} userDetails - Logged in user information.
	 * @returns {JSON} - create single entity.
	 */
	static create(body, userDetails) {
		return new Promise(async (resolve, reject) => {
			try {
				let entityType = body
				entityType['tenantId'] = userDetails.tenantAndOrgInfo.tenantId
				entityType['orgIds'] = CONSTANTS.common.ALL

				if (entityType.profileFields) {
					entityType.profileFields = entityType.profileFields.split(',') || []
				}

				// Ensure uniqueness of immediate children entity types
				if (
					entityType.immediateChildrenEntityType != '' &&
					entityType.immediateChildrenEntityType != undefined
				) {
					let entityTypeImmediateChildren = entityType.immediateChildrenEntityType.split(',')
					entityTypeImmediateChildren = _.uniq(entityTypeImmediateChildren)

					entityType.immediateChildrenEntityType = new Array()
					entityTypeImmediateChildren.forEach((immediateChildren) => {
						entityType.immediateChildrenEntityType.push(immediateChildren)
					})
				}

				// Convert string flags to boolean
				if (entityType.isObservable) {
					entityType.isObservable = UTILS.convertStringToBoolean(entityType.isObservable)
				}
				if (entityType.toBeMappedToParentEntities) {
					entityType.toBeMappedToParentEntities = UTILS.convertStringToBoolean(
						entityType.toBeMappedToParentEntities
					)
				}

				// Determine userId based on userDetails or default to SYSTEM
				const userId =
					userDetails && userDetails.userInformation.userId
						? userDetails.userInformation.userId
						: CONSTANTS.common.SYSTEM

				let newEntityType = await entityTypeQueries.create(
					_.merge(
						{
							isDeleted: false,
							updatedBy: userId,
							createdBy: userId,
						},
						entityType
					)
				)
				delete entityType.registryDetails

				if (newEntityType._id) {
					entityType.status = CONSTANTS.common.SUCCESS
					entityType._id = newEntityType._id
				} else {
					entityType.status = CONSTANTS.common.FAILURE
				}
				return resolve({
					message: CONSTANTS.apiResponses.ENTITY_INFORMATION_CREATED,
					result: entityType,
				})
			} catch (error) {
				return reject(error)
			}
		})
	}
	/**
	 * update single entityType.
	 * @method
	 * @name update
	 * @param {Object} entityTypeId - entity type id.
	 * @param {Object} bodyData - requested entity data.
	 * @param {Object} userDetails - Logged in user information.
	 * @returns {JSON} - update single entity.
	 *
	 */

	static update(entityTypeId, bodyData, userDetails) {
		return new Promise(async (resolve, reject) => {
			try {
				// avoid adding manupulative data
				delete bodyData.tenantId
				delete bodyData.orgIds

				let tenantId = userDetails.tenantAndOrgInfo.tenantId

				// Find and update the entity type by ID with the provided bodyData
				let entityInformation = await entityTypeQueries.findOneAndUpdate(
					{ _id: ObjectId(entityTypeId), tenantId: tenantId },
					bodyData,
					{ new: true }
				)

				if (!entityInformation) {
					return reject({ status: 404, message: CONSTANTS.apiResponses.ENTITYTYPE_NOT_FOUND })
				}

				resolve({
					success: true,
					message: CONSTANTS.apiResponses.ENTITY_UPDATATED,
					result: entityInformation,
				})
			} catch (error) {
				reject(error)
			}
		})
	}

	/**
	 * Bulk update entityType.
	 * @method
	 * @name bulkUpdate
	 * @param {Object} userDetails - logged in user details.
	 * @param {Array} entityTypesCSVData - Array of entity csv data to be updated.
	 * @returns {Array} - Array of updated entity data.
	 */

	static bulkUpdate(entityTypesCSVData, userDetails) {
		return new Promise(async (resolve, reject) => {
			try {
				let tenantId = userDetails.tenantAndOrgInfo.tenantId
				// Process each entity type in the provided array asynchronously
				const entityTypesUploadedData = await Promise.all(
					entityTypesCSVData.map(async (entityType) => {
						try {
							// Parse values in the entityType object
							entityType = UTILS.valueParser(entityType)
							entityType.registryDetails = {}
							let removedKeys = []
							Object.keys(entityType).forEach(function (eachKey) {
								if (eachKey.startsWith('registry-')) {
									let newKey = eachKey.replace('registry-', '')
									entityType.registryDetails[newKey] = entityType[eachKey]
									removedKeys.push(entityType[eachKey])
								}
							})

							if (entityType.profileFields) {
								entityType.profileFields = entityType.profileFields.split(',') || []
							}

							if (entityType.immediateChildrenEntityType != '') {
								let entityTypeImmediateChildren = entityType.immediateChildrenEntityType.split(',')
								entityTypeImmediateChildren = _.uniq(entityTypeImmediateChildren)

								entityType.immediateChildrenEntityType = new Array()
								entityTypeImmediateChildren.forEach((immediateChildren) => {
									entityType.immediateChildrenEntityType.push(immediateChildren)
								})
							}

							// Convert isObservable and toBeMappedToParentEntities to boolean if present
							if (entityType.isObservable) {
								entityType.isObservable = UTILS.convertStringToBoolean(entityType.isObservable)
							}
							if (entityType.toBeMappedToParentEntities) {
								entityType.toBeMappedToParentEntities = UTILS.convertStringToBoolean(
									entityType.toBeMappedToParentEntities
								)
							}

							// Remove keys collected in removedKeys
							if (removedKeys && removedKeys.length > 0) {
								for (var key in entityType) {
									for (var removedKey in removedKeys) {
										if (entityType.hasOwnProperty(removedKey)) {
											delete entityType[removedKey]
										}
									}
								}
							}

							// Get the userId from userDetails or default to SYSTEM
							const userId =
								userDetails && userDetails.userInformation.id
									? userDetails && userDetails.userInformation.id
									: CONSTANTS.common.SYSTEM

							if (!entityType.name) {
								entityType['_SYSTEM_ID'] = ''
								entityType.status = CONSTANTS.apiResponses.ENTITY_TYPE_FAILED
								entityType.message = CONSTANTS.apiResponses.FIELD_MISSING
								return entityType
							}
							// Find and update the entityType by _SYSTEM_ID with merged data
							let updateEntityType = await entityTypeQueries.findOneAndUpdate(
								{
									_id: ObjectId(entityType._SYSTEM_ID),
									tenantId: tenantId,
								},

								_.merge(
									{
										updatedBy: userId,
									},
									entityType
								)
							)

							delete entityType.registryDetails

							if (updateEntityType._id) {
								entityType['_SYSTEM_ID'] = updateEntityType._id
								entityType.status = CONSTANTS.common.SUCCESS
							} else {
								entityType['_SYSTEM_ID'] = ''
								entityType.status = CONSTANTS.common.FAILURE
							}
						} catch (error) {
							entityType['_SYSTEM_ID'] = ''
							entityType.status = CONSTANTS.apiResponses.FAILURE
							entityType.message = CONSTANTS.apiResponses.FAILURE
						}

						return entityType
					})
				)

				return resolve(entityTypesUploadedData)
			} catch (error) {
				return reject(error)
			}
		})
	}

	/**
	 * List enitity Type.
	 * @method
	 * @name list
	 * @param {Object} [query = {}] - query value if required.
	 * @param {Object} [projection = {}] - mongodb query project object
	 * @returns {JSON} - Details of entity.
	 */

	static list(query = {}, projection = {}) {
		return new Promise(async (resolve, reject) => {
			try {
				// Retrieve entity type data based on the provided query and projection
				let entityTypeData = await entityTypeQueries.entityTypesDocument(query, projection)
				return resolve({
					message: CONSTANTS.apiResponses.ENTITY_TYPES_FETCHED,
					result: entityTypeData,
				})
			} catch (error) {
				return reject(error)
			}
		})
	}
}
