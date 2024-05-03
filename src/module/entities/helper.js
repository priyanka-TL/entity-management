/**
 * name : helper.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : entities helper functionality.
 */

// Dependencies
const entityTypesHelper = require(MODULES_BASE_PATH + '/entityTypes/helper')
const entitiesQueries = require(DB_QUERY_BASE_PATH + '/entities')
const entityTypeQueries = require(DB_QUERY_BASE_PATH + '/entityTypes')
const _ = require('lodash')

/**
 * UserProjectsHelper
 * @class
 */

module.exports = class UserProjectsHelper {
	/**
	 * Mapping upload
	 * @method
	 * @name processEntityMappingUploadData
	 * @param {Array} [mappingData = []] - Array of entityMap data.
	 * @returns {JSON} - Success and message .
	 */
	static processEntityMappingUploadData(mappingData = []) {
		return new Promise(async (resolve, reject) => {
			try {
				let entities = []

				// Validate that mappingData is not empty
				if (mappingData.length < 1) {
					throw new Error(CONSTANTS.apiResponses.INVALID_MAPPING_DATA)
				}

				this.entityMapProcessData = {
					entityTypeMap: {},
					relatedEntities: {},
					entityToUpdate: {},
				}

				// Iterate over each mapping data entry
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

				// If there are entities to update
				if (Object.keys(this.entityMapProcessData.entityToUpdate).length > 0) {
					await Promise.all(
						Object.keys(this.entityMapProcessData.entityToUpdate).map(async (entityIdToUpdate) => {
							let updateQuery = { $addToSet: {} }

							// Construct update query based on stored changes
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

				// Clear entityMapProcessData after processing
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

	/**
	 * Add child entity inside parent entity groups.
	 * @method
	 * @name addSubEntityToParent
	 * @param {String} parentEntityId - parent entity id.
	 * @param {String} childEntityId - child entity id.
	 * @param {Boolean} [parentEntityProgramId = false] - Program id of parent entity.
	 * @returns {JSON} - Success and message .
	 */

	static addSubEntityToParent(parentEntityId, childEntityId, parentEntityProgramId = false) {
		return new Promise(async (resolve, reject) => {
			try {
				// Find the child entity based on its ID
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

					// Prepare update query to add childEntity to parent entity's groups
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

					// Update childHierarchyPath in parent entity to include childEntity's entityType
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

	/**
	 * Map parent entities
	 * @method
	 * @name mappedParentEntities
	 * @param {Object} parentEntity
	 * @param {String} parentEntity.entityType - entity type of the parent.
	 * @param {String} parentEntity._id - parentEntity id.
	 * @param {Object} childEntity
	 * @param {String} childEntity.entityType - entity type of the child.
	 * @param {String} childEntity._id - childEntity id.
	 */

	static mappedParentEntities(parentEntity, childEntity) {
		return new Promise(async (resolve, reject) => {
			try {
				let updateParentHierarchy = false

				// Check if entityMapProcessData is defined and entityTypeMap exists for the parent entity's entityType
				if (this.entityMapProcessData) {
					if (
						this.entityMapProcessData.entityTypeMap &&
						this.entityMapProcessData.entityTypeMap[parentEntity.entityType]
					) {
						if (this.entityMapProcessData.entityTypeMap[parentEntity.entityType].updateParentHierarchy) {
							updateParentHierarchy = true
						}
					} else {
						// If entityTypeMap is not defined or does not exist for the parent entity's entityType, check the database
						let checkParentEntitiesMappedValue = await entityTypeQueries.findOne(
							{
								name: parentEntity.entityType,
							},
							{
								toBeMappedToParentEntities: 1,
							}
						)

						// Update entityTypeMap with the updateParentHierarchy status
						if (checkParentEntitiesMappedValue.toBeMappedToParentEntities) {
							updateParentHierarchy = true
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
					let checkParentEntitiesMappedValue = await entityTypeQueries
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
					// Update related entities with childEntity's association
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

	/**
	 * All the related entities for the given entities.
	 * @method
	 * @name relatedEntities
	 * @param {String} entityId - entity id.
	 * @param {String} entityTypeId - entity type id.
	 * @param {String} entityType - entity type.
	 * @param {Array} [projection = "all"] - total fields to be projected.
	 * @returns {Array} - returns an array of related entities data.
	 */

	static relatedEntities(reqId) {
		return new Promise(async (resolve, reject) => {
			try {
				// Define projection fields to retrieve from the entity document
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

				// Retrieve entity document based on the provided request ID (reqId)
				let entityDocument = await entitiesQueries.entityDocuments({ _id: reqId }, projection)
				if (entityDocument.length < 1) {
					throw {
						status: HTTP_STATUS_CODE.not_found.status,
						message: CONSTANTS.apiResponses.ENTITY_NOT_FOUND,
					}
				}

				// Extract relevant information from the retrieved entity document
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

				// Retrieve related entities matching the query criteria
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

				// Check if stateLocationId is a valid UUID and update the filterQuery accordingly
				if (UTILS.checkValidUUID(stateLocationId)) {
					filterQuery = {
						'registryDetails.locationId': stateLocationId,
					}
				}

				// Retrieve entity documents based on the filterQuery
				const entityDocuments = await entitiesQueries.entityDocuments(filterQuery, ['childHierarchyPath'])

				if (!entityDocuments.length > 0) {
					throw {
						message: CONSTANTS.apiResponses.ENTITY_NOT_FOUND,
						result: [],
					}
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
				// Constructing the filter query to find entities based on locationIds
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

				// Retrieving entities that match the filter query
				let entities = await entitiesQueries.entityDocuments(filterQuery, [
					'metaInformation',
					'entityType',
					'entityTypeId',
					'registryDetails',
				])
				if (!entities.length > 0) {
					throw {
						message: CONSTANTS.apiResponses.ENTITY_NOT_FOUND,
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
					status: 400,
					message: error.message,
				})
			}
		})
	}

	/**
	 * find detils in entities.
	 * @method
	 * @name find
	 * @param {Object} bodyQuery - body data
	 * @param {Object} projection - projection to filter data
	 */

	static find(bodyQuery, projection) {
		return new Promise(async (resolve, reject) => {
			try {
				// Fetch entities based on the provided query and projection
				const result = await entitiesQueries.entityDocuments(bodyQuery, projection)

				if (result.length < 1) {
					throw {
						status: HTTP_STATUS_CODE.not_found.status,
						message: CONSTANTS.apiResponses.ENTITY_NOT_FOUND,
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
				// Find the entities document based on the entityType in queryParams
				let entityTypeDocument = await entityTypeQueries.findOne({ name: queryParams.type }, { _id: 1 })
				if (!entityTypeDocument) {
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

					// Prepare registryDetails based on singleEntity data
					let registryDetails = {}
					registryDetails['locationId'] = singleEntity.externalId
					registryDetails['code'] = singleEntity.externalId
					registryDetails['lastUpdatedAt'] = new Date()
					
					let childHierarchyPath = [];

					// Update childHierarchyPath if it exists and is an array
					if (Array.isArray(singleEntity.childHierarchyPath)) {
						childHierarchyPath = singleEntity.childHierarchyPath.map(String);
					}

					// Construct the entity document to be created
					let entityDoc = {
						entityTypeId: entityTypeDocument._id,
						childHierarchyPath: childHierarchyPath,
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

				// Prepare entityIds based on entityId and requestData
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

				// Fetch entity documents based on constructed query
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

				// Find the entity type document based on the provided entityType
				let entityTypeDocument = await entityTypeQueries.findOne(
					{
						name: entityType,
					},
					{ _id: 1 }
				)
				if (!entityTypeDocument) {
					throw CONSTANTS.apiResponses.INVALID_ENTITY_TYPE
				}

				// Process each entity in the entityCSVData array to create new entities
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

						// Extract registry details from singleEntity and populate entityCreation
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

						// Populate metaInformation by omitting keys starting with '_'
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

						// Check if '_SYSTEM_ID' is missing or invalid
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

				// Check for any undefined values in entityUploadedData array
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
				// Update the entity using findOneAndUpdate
				let entityInformation = await entitiesQueries.findOneAndUpdate({ _id: ObjectId(entityId) }, bodyData, {
					new: true,
				})

				// Check if entityInformation is null (not found)
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

	/**
	 * Default entities schema value.
	 * @method
	 * @name entitiesSchemaData
	 * @returns {JSON} List of entities schema.
	 */

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

	/**
	 * Default entities schema value.
	 * @method
	 * @name listEntitiesByType
	 * @returns {JSON} List of entities schema.
	 *  @param {Array} req - List of request
	 */

	static listEntitiesByType(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Retrieve the schema meta information key
				let schemaMetaInformation = this.entitiesSchemaData().SCHEMA_METAINFORMATION

				// Define projection for entity document fields to retrieve
				let projection = [
					schemaMetaInformation + '.externalId',
					schemaMetaInformation + '.name',
					'registryDetails.locationId',
				]

				// Calculate skipping value based on pagination parameters
				let skippingValue = req.pageSize * (req.pageNo - 1)

				// Query entities based on entity type ID
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

				// Map retrieved entity documents to desired format
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
				})
			} catch (error) {
				reject({
					status: error.status || HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message || HTTP_STATUS_CODE.internal_server_error.message,
					errorObject: error,
				})
			}
		})
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
				// Query for the specified entity type within the given entity type ID document
				let queryObject = { _id: ObjectId(entityTypeId) }
				let projectObject = { [`groups.${entityType}`]: 1 }
				let result = await entitiesQueries.findOne(queryObject, projectObject)
				if (!result) {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.ENTITY_NOT_FOUND,
					})
				}

				// Check if the specified entity group within the document is not found
				if (!result.groups || !result.groups[entityType]) {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.ENTITY_GROUPS_NOT_FOUND,
					})
				}

				// Extract entity IDs from the specified entity group
				let entityIds = result.groups[entityType]

				const entityTypesArray = await entityTypesHelper.list(
					{},
					{
						name: 1,
						immediateChildrenEntityType: 1,
					}
				)

				let enityTypeToImmediateChildrenEntityMap = {}

				// Build a map of entity types to their immediate child entity types
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

				// Execute aggregation pipeline to retrieve and process entity data
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
						// Calculate and add metadata to each entity
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
	// Convert and set school types to lowercase and assign them as tags
	if (entityMetaInformation.schoolTypes) {
		entityMetaInformation.schoolTypes = entityMetaInformation.schoolTypes.map((schoolType) =>
			schoolType.toLowerCase()
		)

		entityMetaInformation['tags'] = [...entityMetaInformation.schoolTypes]
	}

	// Convert and concatenate administration types with existing tags (if present)
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
