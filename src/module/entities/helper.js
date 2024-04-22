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
// const userProfileService = require("../../generics/");
const entitiesQueries = require(DB_QUERY_BASE_PATH + '/entities')
// const formService = require(PROJECT_ROOT_DIRECTORY + '/generics/services/form')
// const entitiesHelper = require(MODULES_BASE_PATH + "/entities/helper")
const _ = require('lodash')
// const programUsersQueries = require(DB_QUERY_BASE_PATH + "/programUsers")

/**
 * UserProjectsHelper
 * @class
 */

module.exports = class UserProjectsHelper {
	static processEntityMappingUploadData(mappingData = []) {
		return new Promise(async (resolve, reject) => {
			try {
				let entities = []

				if (mappingData.length < 1) {
					throw new Error(CONSTANTS.apiResponses.INVALID_MAPPING_DATA)
				}

				this.entityMapProcessData = {
					entityTypeMap: {},
					relatedEntities: {},
					entityToUpdate: {},
				}

				for (let indexToEntityMapData = 0; indexToEntityMapData < mappingData.length; indexToEntityMapData++) {
					if (
						mappingData[indexToEntityMapData].parentEntiyId != '' &&
						mappingData[indexToEntityMapData].childEntityId != ''
					) {
						await this.addSubEntityToParent(
							mappingData[indexToEntityMapData].parentEntiyId,
							mappingData[indexToEntityMapData].childEntityId
						)
						entities.push(mappingData[indexToEntityMapData].childEntityId)
					}
				}

				if (Object.keys(this.entityMapProcessData.entityToUpdate).length > 0) {
					await Promise.all(
						Object.keys(this.entityMapProcessData.entityToUpdate).map(async (entityIdToUpdate) => {
							let updateQuery = { $addToSet: {} }

							Object.keys(this.entityMapProcessData.entityToUpdate[entityIdToUpdate]).forEach(
								(groupToUpdate) => {
									updateQuery['$addToSet'][groupToUpdate] = {
										$each: this.entityMapProcessData.entityToUpdate[entityIdToUpdate][
											groupToUpdate
										],
									}
								}
							)

							await entitiesQueries.updateMany({ _id: ObjectId(entityIdToUpdate) }, updateQuery)
						})
					)
				}

				// await this.pushEntitiesToElasticSearch(entities);

				this.entityMapProcessData = {}

				return resolve({
					success: true,
					message: CONSTANTS.apiResponses.ENTITY_INFORMATION_UPDATE,
				})
			} catch (error) {
				return reject(error)
			}
		})
	}

	static addSubEntityToParent(parentEntityId, childEntityId, parentEntityProgramId = false) {
		return new Promise(async (resolve, reject) => {
			try {
				let childEntity = await entitiesQueries.findOne(
					{
						_id: ObjectId(childEntityId),
					},
					{
						entityType: 1,
						groups: 1,
						childHierarchyPath: 1,
					}
				)

				if (childEntity.entityType) {
					let parentEntityQueryObject = {
						_id: ObjectId(parentEntityId),
					}
					if (parentEntityProgramId) {
						parentEntityQueryObject['metaInformation.createdByProgramId'] = ObjectId(parentEntityProgramId)
					}
					let updateQuery = {}
					updateQuery['$addToSet'] = {}
					updateQuery['$addToSet'][`groups.${childEntity.entityType}`] = childEntity._id
					if (!_.isEmpty(childEntity.groups)) {
						Object.keys(childEntity.groups).forEach((eachChildEntity) => {
							if (childEntity.groups[eachChildEntity].length > 0) {
								updateQuery['$addToSet'][`groups.${eachChildEntity}`] = {}
								updateQuery['$addToSet'][`groups.${eachChildEntity}`]['$each'] =
									childEntity.groups[eachChildEntity]
							}
						})
					}

					let childHierarchyPathToUpdate = [childEntity.entityType]
					if (childEntity.childHierarchyPath && childEntity.childHierarchyPath.length > 0) {
						childHierarchyPathToUpdate = childHierarchyPathToUpdate.concat(childEntity.childHierarchyPath)
					}
					updateQuery['$addToSet'][`childHierarchyPath`] = {
						$each: childHierarchyPathToUpdate,
					}

					let projectedData = {
						_id: 1,
						entityType: 1,
						entityTypeId: 1,
						childHierarchyPath: 1,
					}

					let updatedParentEntity = await entitiesQueries.findOneAndUpdate(
						parentEntityQueryObject,
						updateQuery,
						{
							projection: projectedData,
							new: true,
						}
					)
					await this.mappedParentEntities(updatedParentEntity, childEntity)
				}

				return resolve()
			} catch (error) {
				return reject(error)
			}
		})
	}

	static mappedParentEntities(parentEntity, childEntity) {
		return new Promise(async (resolve, reject) => {
			try {
				let updateParentHierarchy = false

				if (this.entityMapProcessData) {
					if (
						this.entityMapProcessData.entityTypeMap &&
						this.entityMapProcessData.entityTypeMap[parentEntity.entityType]
					) {
						if (this.entityMapProcessData.entityTypeMap[parentEntity.entityType].updateParentHierarchy) {
							updateParentHierarchy = true
						}
					} else {
						let checkParentEntitiesMappedValue = await entitiesQueries.findOne(
							{
								entityType: parentEntity.entityType,
							},
							{
								toBeMappedToParentEntities: 1,
							}
						)

						if (checkParentEntitiesMappedValue.toBeMappedToParentEntities) {
							updateParentHierarchy = true
							entityDocuments
						}
						if (this.entityMapProcessData.entityTypeMap) {
							this.entityMapProcessData.entityTypeMap[parentEntity.entityType] = {
								updateParentHierarchy: checkParentEntitiesMappedValue.toBeMappedToParentEntities
									? true
									: false,
							}
						}
					}
				} else {
					let checkParentEntitiesMappedValue = await entitiesQueries
						.findOne(
							{
								name: parentEntity.entityType,
							},
							{
								toBeMappedToParentEntities: 1,
							}
						)
						.lean()

					if (checkParentEntitiesMappedValue.toBeMappedToParentEntities) {
						updateParentHierarchy = true
					}
				}

				if (updateParentHierarchy) {
					let relatedEntities = await this.relatedEntities(
						parentEntity._id,
						parentEntity.entityTypeId,
						parentEntity.entityType,
						['_id']
					)

					let childHierarchyPathToUpdate = [parentEntity.entityType]
					if (parentEntity.childHierarchyPath && parentEntity.childHierarchyPath.length > 0) {
						childHierarchyPathToUpdate = childHierarchyPathToUpdate.concat(parentEntity.childHierarchyPath)
					}
					if (relatedEntities.length > 0) {
						if (this.entityMapProcessData && this.entityMapProcessData.entityToUpdate) {
							relatedEntities.forEach((eachRelatedEntities) => {
								if (!this.entityMapProcessData.entityToUpdate[eachRelatedEntities._id.toString()]) {
									this.entityMapProcessData.entityToUpdate[eachRelatedEntities._id.toString()] = {}
								}
								if (
									!this.entityMapProcessData.entityToUpdate[eachRelatedEntities._id.toString()][
										`groups.${childEntity.entityType}`
									]
								) {
									this.entityMapProcessData.entityToUpdate[eachRelatedEntities._id.toString()][
										`groups.${childEntity.entityType}`
									] = new Array()
								}
								this.entityMapProcessData.entityToUpdate[eachRelatedEntities._id.toString()][
									`groups.${childEntity.entityType}`
								].push(childEntity._id)
								this.entityMapProcessData.entityToUpdate[eachRelatedEntities._id.toString()][
									`childHierarchyPath`
								] = childHierarchyPathToUpdate
							})
						} else {
							let updateQuery = {}
							updateQuery['$addToSet'] = {}
							updateQuery['$addToSet'][`groups.${childEntity.entityType}`] = childEntity._id

							let allEntities = []

							relatedEntities.forEach((eachRelatedEntities) => {
								allEntities.push(eachRelatedEntities._id)
							})

							updateQuery['$addToSet'][`childHierarchyPath`] = {
								$each: childHierarchyPathToUpdate,
							}
							await entitiesQueries.updateMany({ _id: { $in: allEntities } }, updateQuery)
						}
					}
				}

				return resolve()
			} catch (error) {
				return reject({
					status: error.status || HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message || HTTP_STATUS_CODE.internal_server_error.message,
				})
			}
		})
	}

	static relatedEntities(reqId) {
		return new Promise(async (resolve, reject) => {
			try {
				let projection = [
					'metaInformation.externalId',
					'metaInformation.name',
					'metaInformation.addressLine1',
					'metaInformation.addressLine2',
					'metaInformation.administration',
					'metaInformation.city',
					'metaInformation.country',
					'entityTypeId',
					'entityType',
				]
				let entityDocument = await entitiesQueries.entityDocuments({ _id: reqId }, projection)
				if (entityDocument.length < 1) {
					throw {
						status: HTTP_STATUS_CODE.not_found.status,
						message: CONSTANTS.apiResponses.ENTITY_NOT_FOUND,
					}
				}
				let entityId = entityDocument[0]._id
				let entityTypeId = entityDocument[0].entityTypeId
				let entityType = entityDocument[0].entityType
				// this.entityMapProcessData = {
				//     entityTypeMap : {},
				//     relatedEntities : {},
				//     entityToUpdate : {}
				// }
				// if (
				// 	this.entityMapProcessData &&
				// 	this.entityMapProcessData.relatedEntities &&
				// 	this.entityMapProcessData.relatedEntities[entityId.toString()]
				// ) {

				// 	return resolve(this.entityMapProcessData.relatedEntities[entityId.toString()])
				// }

				let relatedEntitiesQuery = {}

				if (entityTypeId && entityId && entityType) {
					relatedEntitiesQuery['entityTypeId'] = {}
					relatedEntitiesQuery['entityTypeId']['$ne'] = entityTypeId
				} else {
					throw {
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.MISSING_ENTITYID,
					}
				}
				let relatedEntitiesDocument = await entitiesQueries.entityDocuments(relatedEntitiesQuery, projection)
				relatedEntitiesDocument = relatedEntitiesDocument ? relatedEntitiesDocument : []
				// if (this.entityMapProcessData && this.entityMapProcessData.relatedEntities) {
				// 	this.entityMapProcessData.relatedEntities[entityId.toString()] = relatedEntitiesDocument
				// }

				return resolve(relatedEntitiesDocument)
			} catch (error) {
				return reject({
					status: error.status || HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message || HTTP_STATUS_CODE.internal_server_error.message,
				})
			}
		})
	}

	/**
	 * Sub entity type list.
	 * @method
	 * @name subEntityListBasedOnRoleAndLocation
	 * @param role - role code
	 * @param stateLocationId - state location id.
	 * @returns {Array} List of sub entity type.
	 */

	static subEntityListBasedOnRoleAndLocation(stateLocationId) {
		return new Promise(async (resolve, reject) => {
			try {
				// let rolesDocument = await userRolesHelper.roleDocuments({
				//     code : role
				// },["entityTypes.entityType"]);

				// if( !rolesDocument.length > 0 ) {
				//     throw {
				//         status : httpStatusCode["bad_request"].status,
				//         message: CONSTANTS.apiResponses.USER_ROLES_NOT_FOUND
				//     }
				// }

				let filterQuery = {
					'registryDetails.code': stateLocationId,
				}

				if (UTILS.checkValidUUID(stateLocationId)) {
					filterQuery = {
						'registryDetails.locationId': stateLocationId,
					}
				}

				const entityDocuments = await entitiesQueries.entityDocuments(filterQuery, ['childHierarchyPath'])

				if (!entityDocuments.length > 0) {
					return resolve({
						message: constants.apiResponses.ENTITY_NOT_FOUND,
						result: [],
					})
				}

				let result = []

				//  if( rolesDocument[0].entityTypes[0].entityType === constants.common.STATE_ENTITY_TYPE ) {
				//     result = entityDocuments[0].childHierarchyPath;
				//     result.unshift(constants.common.STATE_ENTITY_TYPE);
				//  } else {

				//     let targetedEntityType = "";

				//     rolesDocument[0].entityTypes.forEach(singleEntityType => {
				//        if( entityDocuments[0].childHierarchyPath.includes(singleEntityType.entityType) ) {
				//            targetedEntityType = singleEntityType.entityType;
				//        }
				//     });

				// let findTargetedEntityIndex =
				// entityDocuments[0].childHierarchyPath.findIndex(element => element === targetedEntityType);

				// if( findTargetedEntityIndex < 0 ) {
				//    throw {
				//        message : CONSTANTS.apiResponses.SUB_ENTITY_NOT_FOUND,
				//        result : []
				//    }
				// }

				// result = entityDocuments[0].childHierarchyPath.slice(findTargetedEntityIndex);

				return resolve({
					success: true,
					message: CONSTANTS.apiResponses.ENTITIES_CHILD_HIERACHY_PATH,
					result: entityDocuments,
				})
			} catch (error) {
				return reject(error)
			}
		})
	}
	/**
	 * update registry in entities.
	 * @method
	 * @name listByLocationIds
	 * @param {Object} locationIds - locationIds
	 * @returns {Object} entity Document
	 */

	static listByLocationIds(locationIds) {
		return new Promise(async (resolve, reject) => {
			try {
				let filterQuery = {
					$or: [
						{
							'registryDetails.code': { $in: locationIds },
						},
						{
							'registryDetails.locationId': { $in: locationIds },
						},
					],
				}
				let entities = await entitiesQueries.entityDocuments(filterQuery, [
					'metaInformation',
					'entityType',
					'entityTypeId',
					'registryDetails',
				])
				if (!entities.length > 0) {
					throw {
						message: CONSTANTS.apiResponses.ENTITIES_FETCHED,
					}
				}

				return resolve({
					success: true,
					message: CONSTANTS.apiResponses.ENTITY_FETCHED,
					data: entities,
				})
			} catch (error) {
				return resolve({
					success: false,
					message: error.message,
				})
			}
		})
	}

	/**
	 * Add entities.
	 * @method
	 * @name add
	 * @param {Object} queryParams - requested query data.
	 * @param {Object} data - requested entity data.
	 * @param {Object} userDetails - Logged in user information.
	 * @param {String} userDetails.id - Logged in user id.
	 * @returns {JSON} - Created entity information.
	 */

	static add(queryParams, data, userDetails) {
		return new Promise(async (resolve, reject) => {
			try {
				let entitiesDocument = await entitiesQueries.findOne({ entityType: queryParams.type }, { _id: 1 })
				if (!entitiesDocument) {
					throw CONSTANTS.apiResponses.ENTITY_NOT_FOUND
				}
				let entityDocuments = []
				let dataArray = Array.isArray(data) ? data : [data]

				for (let pointer = 0; pointer < dataArray.length; pointer++) {
					let singleEntity = dataArray[pointer]

					if (singleEntity.createdByProgramId) {
						singleEntity.createdByProgramId = ObjectId(singleEntity.createdByProgramId)
					}

					if (singleEntity.createdBySolutionId) {
						singleEntity.createdBySolutionId = ObjectId(singleEntity.solutionId)
					}

					let registryDetails = {}
					if (singleEntity.locationId) {
						registryDetails['locationId'] = singleEntity.locationId
						if (singleEntity.code) {
							registryDetails['code'] = singleEntity.code
						}

						registryDetails['lastUpdatedAt'] = new Date()
					}

					let entityDoc = {
						entityTypeId: entitiesDocument._id,
						entityType: queryParams.type,
						registryDetails: registryDetails,
						groups: {},
						metaInformation: _.omit(singleEntity, ['locationId', 'code']),
						updatedBy: userDetails.userId,
						createdBy: userDetails.userId,
						userId: userDetails.userId,
					}

					entityDocuments.push(entityDoc)
				}
				let entityData = await entitiesQueries.create(entityDocuments)

				let entities = []

				//update entity id in parent entity

				for (let eachEntityData = 0; eachEntityData < entityData.length; eachEntityData++) {
					if (queryParams.parentEntityId && queryParams.programId) {
						await this.addSubEntityToParent(
							queryParams.parentEntityId,
							entityData[eachEntityData]._id.toString(),
							queryParams.programId
						)
					}

					entities.push(entityData[eachEntityData]._id)
				}

				if (entityData.length != dataArray.length) {
					throw CONSTANTS.apiResponses.ENTITY_INFORMATION_NOT_INSERTED
				}

				// await this.pushEntitiesToElasticSearch(entities);

				return resolve(entityData)
			} catch (error) {
				return reject(error)
			}
		})
	}

	/**
	 * details of the entities.
	 * @method
	 * @name details
	 * @returns {JSON} - provide the details.
	 */

	static details(entityId, requestData = {}) {
		return new Promise(async (resolve, reject) => {
			try {
				// // let entityIdNum = parseInt(entityId)
				// let entityIdNum = entityId.replace(/"/, '');
				let entityIds = []
				let query = {}
				query['$or'] = []

				if (entityId) {
					entityIds.push(entityId)
				}
				if (requestData && requestData.entityIds) {
					entityIds.push(...requestData.entityIds)
				}
				if (entityIds.length == 0 && !requestData.locationIds && !requestData.codes) {
					throw {
						message: CONSTANTS.apiResponses.ENTITY_ID_OR_LOCATION_ID_NOT_FOUND,
					}
				}

				if (entityIds.length > 0) {
					query['$or'].push({
						_id: {
							$in: entityIds,
						},
					})
				}
				if (requestData && requestData.locationIds) {
					query['$or'].push({
						'registryDetails.locationId': {
							$in: requestData.locationIds,
						},
					})
				}

				if (requestData && requestData.codes) {
					query['$or'].push({
						'registryDetails.code': {
							$in: requestData.codes,
						},
					})
				}

				let entityDocument = await entitiesQueries.entityDocuments(query, 'all', 10)

				if (entityDocument && entityDocument.length == 0) {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.ENTITY_NOT_FOUND,
					})
				}

				resolve({
					message: CONSTANTS.apiResponses.ENTITY_INFORMATION_FETCHED,
					result: entityDocument,
				})
			} catch (error) {
				return reject(error)
			}
		})
	}

	/**
	 * Bulk create entities.
	 * @method
	 * @name bulkCreate
	 * @param {String} entityType - entity type.
	 * @param {String} programId - program external id.
	 * @param {String} solutionId - solution external id.
	 * @param {Object} userDetails - logged in user details.
	 * @param {String} userDetails.id - logged in user id.
	 * @param {Array}  entityCSVData - Array of entity data.
	 * @returns {JSON} - uploaded entity information.
	 */
	static bulkCreate(entityType, programId, solutionId, userDetails, entityCSVData) {
		return new Promise(async (resolve, reject) => {
			try {
				// let solutionsDocument = new Array()
				// if (programId && solutionId) {

				// 	solutionsDocument = await database.models.entityTypes
				// 		.find(
				// 			{
				// 				externalId: solutionId,
				// 				programExternalId: programId,
				// 			},
				// 			{
				// 				programId: 1,
				// 				externalId: 1,
				// 				subType: 1,
				// 				entityType: 1,
				// 				entityTypeId: 1,
				// 			}
				// 		)
				// 		.lean()
				// }

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
				// }
				let entitiesDocument = await entitiesQueries.findOne(
					// let entityTypeDocument = await database.models.entityTypes.findOne(
					{
						name: entityType,
					},
					{ _id: 1 }
				)
				if (!entitiesDocument) {
					throw CONSTANTS.apiResponses.INVALID_ENTITY_TYPE
				}

				const entityUploadedData = await Promise.all(
					entityCSVData.map(async (singleEntity) => {
						singleEntity = UTILS.valueParser(singleEntity)
						addTagsInEntities(singleEntity)
						const userId = userDetails && userDetails.id ? userDetails.id : CONSTANTS.common.SYSTEM
						let entityCreation = {
							entityTypeId: entitiesDocument._id,
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
							entityCreation.registryDetails['code'] =
								entityCreation.registryDetails['code'] || entityCreation.externalId
							entityCreation.registryDetails['locationId'] =
								entityCreation.registryDetails['locationId'] || entityCreation.locationId
							entityCreation.registryDetails['lastUpdatedAt'] = new Date()
						}

						// if (singleEntity.allowedRoles && singleEntity.allowedRoles.length > 0) {
						// 	entityCreation['allowedRoles'] = await allowedRoles(singleEntity.allowedRoles)
						// 	delete singleEntity.allowedRoles
						// }

						entityCreation['metaInformation'] = _.omitBy(singleEntity, (value, key) => {
							return _.startsWith(key, '_')
						})

						// if (solutionsData && singleEntity._solutionId && singleEntity._solutionId != '')
						// 	singleEntity['createdByProgramId'] = solutionsData[singleEntity._solutionId]['programId']
						let newEntity = await entitiesQueries.create(entityCreation)
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
					throw CONSTANTS.apiResponses.SOMETHING_WRONG_INSERTED_UPDATED
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

	/**
	 * Bulk update entities.
	 * @method
	 * @name bulkUpdate
	 * @param {Object} userDetails - logged in user details.
	 * @param {Array} entityCSVData - Array of entity csv data to be updated.
	 * @returns {Array} - Array of updated entity data.
	 */

	static bulkUpdate(entityCSVData) {
		return new Promise(async (resolve, reject) => {
			try {
				const entityUploadedData = await Promise.all(
					entityCSVData.map(async (singleEntity) => {
						singleEntity = UTILS.valueParser(singleEntity)
						addTagsInEntities(singleEntity)

						if (!singleEntity['_SYSTEM_ID'] || singleEntity['_SYSTEM_ID'] == '') {
							singleEntity['UPDATE_STATUS'] = CONSTANTS.apiResponses.INVALID_OR_MISSING_SYSTEM_ID
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
							entityCreation.registryDetails['code'] =
								entityCreation.registryDetails['code'] || entityCreation.externalId
							entityCreation.registryDetails['locationId'] =
								entityCreation.registryDetails['locationId'] || entityCreation.locationId
							updateData['registryDetails']['lastUpdatedAt'] = new Date()
						}

						// if (singleEntity.hasOwnProperty('allowedRoles')) {
						// 	updateData['allowedRoles'] = []
						// 	if (singleEntity.allowedRoles.length > 0) {
						// 		updateData['allowedRoles'] = await allowedRoles(singleEntity.allowedRoles)
						// 	}

						// 	delete singleEntity.allowedRoles
						// }

						let columnsToUpdate = _.omitBy(singleEntity, (value, key) => {
							return _.startsWith(key, '_')
						})

						Object.keys(columnsToUpdate).forEach((key) => {
							updateData[`metaInformation.${key}`] = columnsToUpdate[key]
						})

						if (Object.keys(updateData).length > 0) {
							let updateEntity = await entitiesQueries.findOneAndUpdate(
								{ _id: singleEntity['_SYSTEM_ID'] },
								{ $set: updateData },
								{ _id: 1 }
							)

							if (!updateEntity || !updateEntity._id) {
								singleEntity['UPDATE_STATUS'] = CONSTANTS.apiResponses.ENTITY_NOT_FOUND
							} else {
								singleEntity['UPDATE_STATUS'] = CONSTANTS.apiResponses.SUCCESS
							}
						} else {
							singleEntity['UPDATE_STATUS'] = CONSTANTS.apiResponses.NO_INFORMATION_TO_UPDATE
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

	/**
	 * Update entity information.
	 * @method
	 * @name update
	 * @param {String} entityId - entity id.
	 * @param {Object} data - entity information that need to be updated.
	 * @returns {JSON} - Updated entity information.
	 */

	static update(entityId, bodyData) {
		return new Promise(async (resolve, reject) => {
			try {
				let entityInformation = await entitiesQueries.findOneAndUpdate({ _id: ObjectId(entityId) }, bodyData, {
					new: true,
				})

				if (!entityInformation) {
					return reject({ status: 404, message: CONSTANTS.apiResponses.ENTITY_NOT_FOUND })
				}
				resolve({
					success: true,
					message: CONSTANTS.apiResponses.ASSETS_FETCHED_SUCCESSFULLY,
					result: entityInformation,
				})
				// resolve({ entityInformation, message: CONSTANTS.apiResponses.ENTITYTYPE_UPDATED })
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

	static listEntitiesByType(req) {
		return new Promise(async (resolve, reject) => {
			try {
				let schemaMetaInformation = this.entitiesSchemaData().SCHEMA_METAINFORMATION
				let projection = [
					schemaMetaInformation + '.externalId',
					schemaMetaInformation + '.name',
					'registryDetails.locationId',
				]

				let skippingValue = req.pageSize * (req.pageNo - 1)
				let entityDocuments = await entitiesQueries.entityDocuments(
					{
						entityTypeId: ObjectId(req.params._id),
					},
					projection,
					req.pageSize,
					skippingValue,
					{
						[schemaMetaInformation + '.name']: 1,
					}
				)
				if (entityDocuments.length < 1) {
					throw {
						status: HTTP_STATUS_CODE.not_found.status,
						message: CONSTANTS.apiResponses.ENTITY_NOT_FOUND,
					}
				}
				entityDocuments = entityDocuments.map((entityDocument) => {
					return {
						externalId: entityDocument.metaInformation.externalId,
						name: entityDocument.metaInformation.name,
						locationId:
							entityDocument.registryDetails && entityDocument.registryDetails.locationId
								? entityDocument.registryDetails.locationId
								: '',
						_id: entityDocument._id,
					}
				})
	
				resolve({
					success: true,
					message: CONSTANTS.apiResponses.ASSETS_FETCHED_SUCCESSFULLY,
					result: entityDocuments,
				});
			} catch (error) {
				reject({
					status: error.status || HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message || HTTP_STATUS_CODE.internal_server_error.message,
					errorObject: error,
				});
			}
		});
	}
	
	/**
	 * List entities.
	 * @method
	 * @name list
	 * @param {String} entityType - entity type.
	 * @param {String} entityId - requested entity id.
	 * @param {String} [limitingValue = ""] - Limiting value if required.
	 * @param {String} [skippingValue = ""] - Skipping value if required.
	 * @returns {JSON} - Details of entity.
	 */

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
				let result = await entitiesQueries.findOne(queryObject, projectObject)
				if (!result) {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.ENTITY_NOT_FOUND,
					})
				}

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
				let entityData = await entitiesQueries.getAggregate([
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

/**
 * Allowed roles in entities.
 * @method
 * @name allowedRoles
 * @param {Array} roles - Roles
 * @returns {Array} user roles
 */
// async function allowedRoles(roles) {
// 	return new Promise(async (resolve, reject) => {
// 		try {
// 			let userRoles = await userRolesHelper.list(
// 				{
// 					code: { $in: roles },
// 				},
// 				{
// 					code: 1,
// 				}
// 			)

// 			if (userRoles.length > 0) {
// 				userRoles = userRoles.map((userRole) => {
// 					return userRole.code
// 				})
// 			}

// 			return resolve(userRoles)
// 		} catch (error) {
// 			return reject(error)
// 		}
// 	})
// }

/**
 * Add tags in entity meta information.
 * @method
 * @name addTagsInEntities
 * @param {Object} entityMetaInformation - Meta information of the entity.
 * @returns {JSON} - entities metainformation consisting of scool types,administration types
 * and tags.
 */

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
