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
	static bulkCreate(entityTypesCSVData, userDetails) {
		return new Promise(async (resolve, reject) => {
			try {
				const entityTypesUploadedData = await Promise.all(
					entityTypesCSVData.map(async (entityType) => {
						try {
							entityType = UTILS.valueParser(entityType)
							entityType.registryDetails = {}
							let removedKeys = []
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
							const userId =
								userDetails && userDetails.userInformation.id
									? userDetails && userDetails.userInformation.id
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
	 * @param {Object} data - requested entity data.
	 * @param {Object} userDetails - Logged in user information.
	 * @returns {JSON} - create single entity.
	 */
	static create(body, userDetails) {
		return new Promise(async (resolve, reject) => {
			try {
				let entityType = body

				try {
					if (entityType.profileFields) {
						entityType.profileFields = entityType.profileFields.split(',') || []
					}

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

					const userId =
						userDetails && userDetails.userInformation.id
							? userDetails.userInformation.id
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
					} else {
						entityType.status = CONSTANTS.common.FAILURE
					}
				} catch (error) {}
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
	 * update single entity.
	 * @method
	 * @name update
	 * @param {Object} data - requested entity data.
	 * @param {Object} userDetails - Logged in user information.
	 * @returns {JSON} - update single entity.
	 */

	static update(entityTypeId, bodyData) {
		return new Promise(async (resolve, reject) => {
			try {
				let entityInformation = await entityTypeQueries.findOneAndUpdate(
					{ _id: ObjectId(entityTypeId) },
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

	static bulkUpdate(entityTypesCSVData, userDetails) {
		return new Promise(async (resolve, reject) => {
			try {
				const entityTypesUploadedData = await Promise.all(
					entityTypesCSVData.map(async (entityType) => {
						try {
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
							const userId =
								userDetails && userDetails.userInformation.id
									? userDetails && userDetails.userInformation.id
									: CONSTANTS.common.SYSTEM
							let updateEntityType = await entityTypeQueries.findOneAndUpdate(
								{
									_id: ObjectId(entityType._SYSTEM_ID),
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

	static list(queryParameter = 'all', projection = {}) {
		return new Promise(async (resolve, reject) => {
			try {
				if (queryParameter === 'all') {
					queryParameter = {}
				}
				let entityTypeData = await entityTypeQueries.entityTypesDocument(queryParameter, projection)
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
