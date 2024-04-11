/**
 * name : helper.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : entities helper functionality.
 */

// Dependencies
const entityTypesHelper = require(MODULES_BASE_PATH + '/entityTypes/helper')
// const elasticSearch = require(ROOT_PATH + "/generics/helpers/elasticSearch");
// const userRolesHelper = require(MODULES_BASE_PATH + "/userRoles/helper");
const FileStream = require('../../generics/file-stream')
// const userProfileService = require("../../generics/");

const { v4: uuidv4 } = require('uuid')

// const entitiesHelper = require(MODULES_BASE_PATH + "/entities/helper")
const _ = require('lodash')
// const programUsersQueries = require(DB_QUERY_BASE_PATH + "/programUsers")

/**
 * UserProjectsHelper
 * @class
 */

module.exports = class UserProjectsHelper {
	static entityDocuments(findQuery = 'all', fields = 'all', limitingValue = '', skippingValue = '', sortedData = '') {
		return new Promise(async (resolve, reject) => {
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

	static details(entityType, entityId) {
		console.log(entityId, entityType, 'line no 73')
		return new Promise(async (resolve, reject) => {
			try {
				let entityTypeDocument = await database.models.entityTypes
					.findOne(
						{
							name: entityType,
						},
						{ profileForm: 1 }
					)
					.lean()
				console.log(entityTypeDocument, 'line no 81')
				// console.log(profileForm, "line no 82");
				let entityForm = entityTypeDocument.profileForm
				console.log(entityForm, 'line no 85')
				if (!entityForm.length) {
					throw `No form data available for ${entityType} entity type.`
				}

				let entityInformation
				console.log(entityInformation, 'line no 91')
				if (entityId) {
					entityInformation = await database.models.entities
						.findOne({ _id: ObjectId(entityId) }, { metaInformation: 1 })
						.lean()
					console.log(metaInformation, 'line no 96')
					if (!entityInformation) {
						throw `No ${entityType} information found for given params.`
					}

					entityInformation = entityInformation.metaInformation
				}

				entityForm.forEach((eachField) => {
					eachField.value = entityInformation[eachField.field]
				})

				return resolve(entityForm)
			} catch (error) {
				console.log(error, 'lne no 109')
				return reject(error)
			}
		})
	}

	static bulkCreate(entityType, programId, solutionId, userDetails, entityCSVData) {
		return new Promise(async (resolve, reject) => {
			try {
				let solutionsDocument = new Array()
				if (programId && solutionId) {
					solutionsDocument = await database.models.solutions
						.find(
							{
								externalId: solutionId,
								programExternalId: programId,
							},
							{
								programId: 1,
								externalId: 1,
								subType: 1,
								entityType: 1,
								entityTypeId: 1,
							}
						)
						.lean()
				}

				// let solutionsData

				// if (solutionsDocument.length) {
				// 	solutionsData = solutionsDocument.reduce(
				// 		(ac, entities) => ({
				// 			...ac,
				// 			[entities.metaInformation.externalId]: {
				// 				subType: entities.subType,
				// 				solutionId: entities._id,
				// 				programId: entities.programId,
				// 				entityType: entities.entityType,
				// 				entityTypeId: entities.entityTypeId,
				// 				newEntities: new Array(),
				// 			},
				// 		}),
				// 		{}
				// 	)
				// 	console.log(solutionsData, 'line no 128')
				// }

				let entityTypeDocument = await database.models.entityTypes.findOne(
					{
						name: entityType,
					},
					{ _id: 1 }
				)
				if (!entityTypeDocument) {
					throw CONSTANTS.apiResponses.INVALID_ENTITY_TYPE
				}

				const entityUploadedData = await Promise.all(
					entityCSVData.map(async (singleEntity) => {
						singleEntity = UTILS.valueParser(singleEntity)
						addTagsInEntities(singleEntity)
						const userId = userDetails && userDetails.id ? userDetails.id : CONSTANTS.common.SYSTEM
						let entityCreation = {
							entityTypeId: entityTypeDocument._id,
							entityType: entityType,
							registryDetails: {},
							groups: {},
							updatedBy: userId,
							createdBy: userId,
						}

						Object.keys(singleEntity).forEach(function (key) {
							if (key.startsWith('registry-')) {
								let newKey = key.replace('registry-', '')
								entityCreation.registryDetails[newKey] = singleEntity[key]
							}
						})

						if (entityCreation.registryDetails && Object.keys(entityCreation.registryDetails).length > 0) {
							entityCreation.registryDetails['lastUpdatedAt'] = new Date()
						}

						if (singleEntity.allowedRoles && singleEntity.allowedRoles.length > 0) {
							entityCreation['allowedRoles'] = await allowedRoles(singleEntity.allowedRoles)
							delete singleEntity.allowedRoles
						}

						entityCreation['metaInformation'] = _.omitBy(singleEntity, (value, key) => {
							return _.startsWith(key, '_')
						})

						// if (solutionsData && singleEntity._solutionId && singleEntity._solutionId != '')
						// 	singleEntity['createdByProgramId'] = solutionsData[singleEntity._solutionId]['programId']

						let newEntity = await database.models.entities.create(entityCreation)

						if (!newEntity._id) {
							return
						}

						singleEntity['_SYSTEM_ID'] = newEntity._id.toString()

						// if (
						// 	solutionsData &&
						// 	singleEntity._solutionId &&
						// 	singleEntity._solutionId != '' &&
						// 	newEntity.entityType == solutionsData[singleEntity._solutionId]['entityType']
						// ) {
						// 	solutionsData[singleEntity._solutionId].newEntities.push(newEntity._id)
						// }

						// await this.pushEntitiesToElasticSearch([singleEntity["_SYSTEM_ID"]]);

						return singleEntity
					})
				)

				if (entityUploadedData.findIndex((entity) => entity === undefined) >= 0) {
					throw messageConstants.apiResponses.SOMETHING_WRONG_INSERTED_UPDATED
				}

				// solutionsData &&
				// 	(await Promise.all(
				// 		Object.keys(solutionsData).map(async (solutionExternalId) => {
				// 			if (solutionsData[solutionExternalId].newEntities.length > 0) {
				// 				await database.models.solutions.updateOne(
				// 					{ _id: solutionsData[solutionExternalId].solutionId },
				// 					{
				// 						$addToSet: {
				// 							entities: { $each: solutionsData[solutionExternalId].newEntities },
				// 						},
				// 					}
				// 				)
				// 			}
				// 		})
				// 	))

				return resolve(entityUploadedData)
			} catch (error) {
				return reject(error)
			}
		})
	}

	static bulkUpdate(userDetails, entityCSVData) {
		return new Promise(async (resolve, reject) => {
			try {
				const entityUploadedData = await Promise.all(
					entityCSVData.map(async (singleEntity) => {
						singleEntity = UTILS.valueParser(singleEntity)
						addTagsInEntities(singleEntity)

						if (!singleEntity['_SYSTEM_ID'] || singleEntity['_SYSTEM_ID'] == '') {
							singleEntity['UPDATE_STATUS'] = 'Invalid or missing _SYSTEM_ID'
							return singleEntity
						}

						let updateData = {}
						updateData.registryDetails = {}

						Object.keys(singleEntity).forEach(function (key) {
							if (key.startsWith('registry-')) {
								let newKey = key.replace('registry-', '')
								updateData['registryDetails'][newKey] = singleEntity[key]
							}
						})

						if (updateData.registryDetails && Object.keys(updateData.registryDetails).length > 0) {
							updateData['registryDetails']['lastUpdatedAt'] = new Date()
						}

						if (singleEntity.hasOwnProperty('allowedRoles')) {
							updateData['allowedRoles'] = []
							if (singleEntity.allowedRoles.length > 0) {
								updateData['allowedRoles'] = await allowedRoles(singleEntity.allowedRoles)
							}

							delete singleEntity.allowedRoles
						}

						let columnsToUpdate = _.omitBy(singleEntity, (value, key) => {
							return _.startsWith(key, '_')
						})

						Object.keys(columnsToUpdate).forEach((key) => {
							updateData[`metaInformation.${key}`] = columnsToUpdate[key]
						})

						if (Object.keys(updateData).length > 0) {
							let updateEntity = await database.models.entities.findOneAndUpdate(
								{ _id: singleEntity['_SYSTEM_ID'] },
								{ $set: updateData },
								{ _id: 1 }
							)

							if (!updateEntity || !updateEntity._id) {
								singleEntity['UPDATE_STATUS'] = 'Entity Not Updated'
							} else {
								singleEntity['UPDATE_STATUS'] = 'Success'
							}
						} else {
							singleEntity['UPDATE_STATUS'] = 'No information to update.'
						}
						return singleEntity
					})
				)

				if (entityUploadedData.findIndex((entity) => entity === undefined) >= 0) {
					throw CONSTANTS.apiResponses.SOMETHING_WRONG_INSERTED_UPDATED
				}

				return resolve(entityUploadedData)
			} catch (error) {
				return reject(error)
			}
		})
	}

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
					let findOper = await entityTypesHelper.list({ _id: new ObjectId(entityType.entityTypeId) })
					if (!entityType.entityType) {
						entityType.entityType = findOper.result[0].name
					}
					if (entityType.externalId && entityType.name) {
						entityType.metaInformation = {
							externalId: entityType.externalId,
							name: entityType.name,
						}
					}
					const userId = userDetails && userDetails.id ? userDetails.id : CONSTANTS.common.SYSTEM
					let newEntityType = await database.models.entities.create(
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
						entityType.status = CONSTANTS.apiResponses.SUCCESS
					} else {
						entityType.status = CONSTANTS.apiResponses.FAILURE
					}
				} catch (error) {
					entityType.status = error && error.message ? error.message : error
				}
				return resolve(entityType)
			} catch (error) {
				return reject(error)
			}
		})
	}

	static update(entityTypeId, bodyData) {
		return new Promise(async (resolve, reject) => {
			try {
				let entityInformation = await database.models.entities.findOneAndUpdate(
					{ _id: ObjectId(entityTypeId) },
					bodyData,
					{ new: true }
				)

				if (!entityInformation) {
					return reject({ status: 404, message: CONSTANTS.apiResponses.ENTITY_NOT_FOUND })
				}

				resolve(entityInformation)
			} catch (error) {
				reject(error)
			}
		})
	}

	static entitiesSchemaData() {
		return {
			SCHEMA_ENTITY_OBJECT_ID: '_id',
			SCHEMA_ENTITY_TYPE_ID: 'entityTypeId',
			SCHEMA_ENTITIES: 'entities',
			SCHEMA_ENTITY_TYPE: 'entityType',
			SCHEMA_ENTITY_GROUP: 'groups',
			SCHEMA_METAINFORMATION: 'metaInformation',
			SCHEMA_ENTITY_CREATED_BY: 'createdBy',
		}
	}

	static list(
		entityType,
		entityTypeId,
		limitingValue = '',
		skippingValue = '',
		schoolTypes = '',
		administrationTypes = ''
	) {
		return new Promise(async (resolve, reject) => {
			try {
				let queryObject = { _id: ObjectId(entityTypeId) }
				let projectObject = { [`groups.${entityType}`]: 1 }

				let result = await database.models.entities.findOne(queryObject, projectObject).lean()
				if (!result) {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.ENTITY_NOT_FOUND,
					})
				}
				console.log('------------')

				if (!result.groups || !result.groups[entityType]) {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.ENTITY_GROUPS_NOT_FOUND,
					})
				}
				let entityIds = result.groups[entityType]

				const entityTypesArray = await entityTypesHelper.list(
					{},
					{
						name: 1,
						immediateChildrenEntityType: 1,
					}
				)

				let enityTypeToImmediateChildrenEntityMap = {}

				if (entityTypesArray.length > 0) {
					entityTypesArray.forEach((entityType) => {
						enityTypeToImmediateChildrenEntityMap[entityType.name] =
							entityType.immediateChildrenEntityType && entityType.immediateChildrenEntityType.length > 0
								? entityType.immediateChildrenEntityType
								: []
					})
				}

				let filteredQuery = {
					$match: { _id: { $in: entityIds } },
				}

				let schoolOrAdministrationTypes = []

				if (schoolTypes !== '') {
					schoolOrAdministrationTypes = schoolOrAdministrationTypes.concat(schoolTypes.split(','))
				}

				if (administrationTypes !== '') {
					schoolOrAdministrationTypes = schoolOrAdministrationTypes.concat(administrationTypes.split(','))
				}

				if (schoolOrAdministrationTypes.length > 0) {
					schoolOrAdministrationTypes = schoolOrAdministrationTypes.map((schoolOrAdministrationType) =>
						schoolOrAdministrationType.toLowerCase()
					)

					filteredQuery['$match']['metaInformation.tags'] = { $in: schoolOrAdministrationTypes }
				}
				let entityData = await database.models.entities.aggregate([
					filteredQuery,
					{
						$project: {
							metaInformation: 1,
							groups: 1,
							entityType: 1,
							entityTypeId: 1,
						},
					},
					{
						$facet: {
							totalCount: [{ $count: 'count' }],
							data: [{ $skip: skippingValue }, { $limit: limitingValue }],
						},
					},
					{
						$project: {
							data: 1,
							count: {
								$arrayElemAt: ['$totalCount.count', 0],
							},
						},
					},
				])

				let count = 0
				result = []

				if (entityData[0].data.length > 0) {
					result = entityData[0].data.map((entity) => {
						entity.metaInformation.childrenCount = 0
						entity.metaInformation.entityType = entity.entityType
						entity.metaInformation.entityTypeId = entity.entityTypeId
						entity.metaInformation.subEntityGroups = new Array()

						entity.groups &&
							Array.isArray(enityTypeToImmediateChildrenEntityMap[entity.entityType]) &&
							enityTypeToImmediateChildrenEntityMap[entity.entityType].forEach(
								(immediateChildrenEntityType) => {
									if (entity.groups[immediateChildrenEntityType]) {
										entity.metaInformation.immediateSubEntityType = immediateChildrenEntityType
										entity.metaInformation.childrenCount =
											entity.groups[immediateChildrenEntityType].length
									}
								}
							)

						entity.groups &&
							Array.isArray(Object.keys(entity.groups)) &&
							Object.keys(entity.groups).forEach((subEntityType) => {
								entity.metaInformation.subEntityGroups.push(subEntityType)
							})
						return {
							_id: entity._id,
							entityId: entity._id,
							...entity.metaInformation,
						}
					})
					count = entityData[0].count
				}

				return resolve({
					message: CONSTANTS.apiResponses.ENTITY_INFORMATION_FETCHED,
					result: result,
					count: count,
				})
			} catch (error) {
				return reject(error)
			}
		})
	}
}

function addTagsInEntities(entityMetaInformation) {
	if (entityMetaInformation.schoolTypes) {
		entityMetaInformation.schoolTypes = entityMetaInformation.schoolTypes.map((schoolType) =>
			schoolType.toLowerCase()
		)

		entityMetaInformation['tags'] = [...entityMetaInformation.schoolTypes]
	}

	if (entityMetaInformation.administrationTypes) {
		entityMetaInformation.administrationTypes = entityMetaInformation.administrationTypes.map((schoolType) =>
			schoolType.toLowerCase()
		)

		if (entityMetaInformation.tags) {
			entityMetaInformation.tags = entityMetaInformation.tags.concat(entityMetaInformation.administrationTypes)
		} else {
			entityMetaInformation.tags = entityMetaInformation.administrationTypes
		}
	}
	return entityMetaInformation
}
