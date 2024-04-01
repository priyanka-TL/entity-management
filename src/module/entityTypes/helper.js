/**
 * name : helper.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : entities helper functionality.
 */

// Dependencies

const { v4: uuidv4 } = require('uuid')

// const entitiesHelper = require(MODULES_BASE_PATH + "/entities/helper")
const _ = require('lodash')
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
								userDetails && userDetails.id
									? userDetails && userDetails.id
									: CONSTANTS.apiResponses.SYSTEM
							let newEntityType = await database.models.entityTypes.create(
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
								entityType['_SYSTEM_ID'] = newEntityType._id
								entityType.status = CONSTANTS.apiResponses.SUCCESS
							} else {
								entityType['_SYSTEM_ID'] = ''
								entityType.status = 'Failed'
							}
						} catch (error) {
							entityType['_SYSTEM_ID'] = ''
							entityType.status = error && error.message ? error.message : error
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
								userDetails && userDetails.id
									? userDetails && userDetails.id
									: CONSTANTS.apiResponses.SYSTEM
							let updateEntityType = await database.models.entityTypes.findOneAndUpdate(
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
								entityType.status = CONSTANTS.apiResponses.SUCCESS
							} else {
								entityType['_SYSTEM_ID'] = ''
								entityType.status = 'Failed'
							}
						} catch (error) {
							entityType['_SYSTEM_ID'] = ''
							entityType.status = error && error.message ? error.message : error
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
		console.log(projection, "line no 206");
		return new Promise(async (resolve, reject) => {
			try {
				if (queryParameter === 'all') {
					queryParameter = {}
				}

				let entityTypeData = await database.models.entityTypes.find(queryParameter, projection).lean()
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
