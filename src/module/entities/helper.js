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
const userRoleExtensionHelper = require(MODULES_BASE_PATH + '/userRoleExtension/helper')
const { ObjectId } = require('mongodb')
const { Parser } = require('json2csv')

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
	static async processEntityMappingUploadData(mappingData = []) {
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

			// Use batch processing to handle sub-entity addition
			let batchPromises = []
			mappingData.forEach(({ parentEntiyId, childEntityId }) => {
				if (parentEntiyId && childEntityId) {
					batchPromises.push(
						this.addSubEntityToParent(parentEntiyId, childEntityId).then(() => entities.push(childEntityId))
					)
				}
			})
			await Promise.all(batchPromises)

			// Batch update operation for entities
			if (Object.keys(this.entityMapProcessData.entityToUpdate).length > 0) {
				const updateOperations = Object.entries(this.entityMapProcessData.entityToUpdate).map(
					([entityIdToUpdate, groupUpdates]) => {
						let updateQuery = { $addToSet: {} }
						for (let groupToUpdate in groupUpdates) {
							updateQuery['$addToSet'][groupToUpdate] = {
								$each: groupUpdates[groupToUpdate],
							}
						}
						return entitiesQueries.updateMany({ _id: ObjectId(entityIdToUpdate) }, updateQuery)
					}
				)
				await Promise.all(updateOperations)
			}

			// Clear entityMapProcessData after processing
			this.entityMapProcessData = {}

			return {
				success: true,
				message: CONSTANTS.apiResponses.ENTITY_INFORMATION_UPDATE,
			}
		} catch (error) {
			throw error
		}
	}

	/**
	 * Processes entity data from CSV and generates mapping data in CSV format.
	 * Maps parent and child entity relationships based on the provided entity data.
	 * @method
	 * @name createMappingCsv
	 * @param {Array<Object>} entityCSVData - Array of objects parsed from the input CSV file.
	 * @returns {Promise<Object>} Resolves with an object containing:
	 */

	static async createMappingCsv(entityCSVData) {
		return new Promise(async (resolve, reject) => {
			try {
				const parentEntityIds = []
				const childEntityIds = []
				const resultData = []

				// Iterate over each row of the input CSV data
				for (const entityData of entityCSVData) {
					const entityIds = []
					const rowStatus = {}

					// Iterate through each key-value pair in the row
					for (const [key, value] of Object.entries(entityData)) {
						// Filter criteria to fetch entity documents based on entity type and external ID
						const filter = {
							'metaInformation.externalId': value,
						}

						const entityDocuments = await entitiesQueries.entityDocuments(filter, ['_id'])

						if (entityDocuments.length > 0) {
							// Add entity IDs to the temporary array
							for (const doc of entityDocuments) {
								entityIds.push(doc._id)
							}
							// Add success status for the entity type
							rowStatus[`${key}Status`] = CONSTANTS.apiResponses.ENTITY_FETCHED
						} else {
							// Add failure status if no matching entity is found
							rowStatus[`${key}Status`] = CONSTANTS.apiResponses.ENTITY_NOT_FOUND
						}
					}

					// Separate parent and child entity IDs
					if (entityIds.length > 1) {
						parentEntityIds.push(...entityIds.slice(0, -1))
						childEntityIds.push(...entityIds.slice(1))
					} else if (entityIds.length === 1) {
						parentEntityIds.push(entityIds[0])
					}

					// Add the status columns to the processed row
					resultData.push({ ...entityData, ...rowStatus })
				}

				// Create the content for the mapping CSV (parent-child relationships)
				let mappingCSVContent = 'parentEntiyId,childEntityId\n'
				const maxLength = Math.max(parentEntityIds.length, childEntityIds.length)

				// Add parent-child mappings to the CSV content
				for (let item = 0; item < maxLength; item++) {
					const parentId = parentEntityIds[item] || ''
					const childId = childEntityIds[item] || ''
					mappingCSVContent += `${parentId},${childId}\n`
				}

				// Convert the processed result data to CSV format
				const json2csvParser = new Parser()
				const resultCSVContent = json2csvParser.parse(resultData)

				// Convert CSV content to Base64
				const mappingCSV = Buffer.from(mappingCSVContent).toString('base64')
				const resultCSV = Buffer.from(resultCSVContent).toString('base64')

				resolve({
					mappingCSV,
					resultCSV,
					parentEntityIds,
					childEntityIds,
				})
			} catch (error) {
				return reject(error)
			}
		})
	}

	/**
	 * List of Entities
	 * @method
	 * @name listByEntityIds
	 * @param bodyData - Body data.
	 * @returns {Array} List of Entities.
	 */

	static listByEntityIds(entityIds = [], fields = []) {
		return new Promise(async (resolve, reject) => {
			try {
				// Call 'entitiesQueries.entityDocuments' to retrieve entities based on provided entity IDs and fields
				const entities = await entitiesQueries.entityDocuments(
					{
						_id: { $in: entityIds },
					},
					fields ? fields : []
				)

				return resolve({
					message: CONSTANTS.apiResponses.ENTITIES_FETCHED,
					result: entities,
				})
			} catch (error) {
				return reject(error)
			}
		})
	}

	/**
	 * Get immediate entities for requested Array.
	 * @method
	 * @name subEntityList
	 * @param {params} entities - array of entitity ids
	 * @param {params} entityId - single entitiy id
	 * @param {params} type - sub list entity type.
	 * @param {params} search - search entity data.
	 * @param {params} limit - page limit.
	 * @param {params} pageNo - page no.
	 * @returns {Array} - List of all sub list entities.
	 */

	static subEntityList(entities, entityId, type, search, limit, pageNo) {
		return new Promise(async (resolve, reject) => {
			try {
				let result = []
				let obj = {
					entityId: entityId,
					type: type,
					search: search,
					limit: limit,
					pageNo: pageNo,
				}
				// Retrieve sub-entities using 'this.subEntities' for a single entity
				if (entityId !== '') {
					result = await this.subEntities(obj)
				} else {
					// Retrieve sub-entities using 'this.subEntities' for multiple entities
					await Promise.all(
						entities.map(async (entity) => {
							obj['entityId'] = entity
							let entitiesDocument = await this.subEntities(obj)

							if (Array.isArray(entitiesDocument.data) && entitiesDocument.data.length > 0) {
								result = entitiesDocument
							}
						})
					)
				}

				// Modify data properties (e.g., 'label') of retrieved entities if necessary
				if (result.data && result.data.length > 0) {
					// fetch the entity ids to look for parent hierarchy
					const entityIds = _.map(result.data, (item) => ObjectId(item._id))
					// dynamically set the entityType to search inside the group
					const key = ['groups', type]
					// create filter for fetching the parent data using group
					let entityFilter = {}
					entityFilter[key.join('.')] = {
						$in: entityIds,
					}

					// Retrieve all the entity documents with the entity ids in their gropu
					const entityDocuments = await entitiesQueries.entityDocuments(entityFilter, [
						'entityType',
						'metaInformation.name',
						'childHierarchyPath',
						key.join('.'),
					])
					// find out the state of the passed entityId
					const stateEntity = entityDocuments.find((entity) => entity.entityType == 'state')
					// fetch the child hierarchy path of the state
					const stateChildHierarchy = stateEntity.childHierarchyPath
					let upperLevelsOfType = type != 'state' ? ['state'] : [] // add state as default if type != state
					// fetch all the upper levels of the type from state hierarchy
					upperLevelsOfType = [
						...upperLevelsOfType,
						...stateChildHierarchy.slice(0, stateChildHierarchy.indexOf(type)),
					]
					result.data = result.data.map((data) => {
						let cloneData = { ...data }
						cloneData[cloneData.entityType] = cloneData.name
						// if we have upper levels to fetch
						if (upperLevelsOfType.length > 0) {
							// iterate through the data fetched to fetch the parent entity names
							entityDocuments.forEach((eachEntity) => {
								eachEntity[key[0]][key[1]].forEach((eachEntityGroup) => {
									if (
										ObjectId(eachEntityGroup).equals(cloneData._id) &&
										upperLevelsOfType.includes(eachEntity.entityType)
									) {
										if (eachEntity?.entityType !== 'state') {
											cloneData[eachEntity?.entityType] = eachEntity?.metaInformation?.name
										}
									}
								})
							})
						}
						cloneData['label'] = cloneData.name
						cloneData['value'] = cloneData._id
						return cloneData
					})
				}

				resolve({
					message: CONSTANTS.apiResponses.ENTITIES_FETCHED,
					result: result,
				})
			} catch (error) {
				return reject(error)
			}
		})
	}

	/**
	 * Fetches targeted roles based on the provided entity IDs.
	 * @param {Array<string>} entityId - An array of entity IDs to filter roles.
	 * @name targetedRoles
	 * @param {params} pageSize - page pageSize.
	 * @param {params} pageNo - page no.
	 * @param {String} type - Entity type
	 * @returns {Promise<Object>} A promise that resolves to the response containing the fetched roles or an error object.
	 */
	static targetedRoles(entityId, pageNo = '', pageSize = '', paginate, type = '') {
		return new Promise(async (resolve, reject) => {
			try {
				// Construct the filter to retrieve entities based on provided entity IDs
				const filter = {
					_id: {
						$in: entityId,
					},
				}
				const projectionFields = ['childHierarchyPath', 'entityType']
				// Retrieve entityDetails based on provided entity IDs
				const entityDetails = await entitiesQueries.entityDocuments(filter, projectionFields)

				if (
					!entityDetails ||
					!entityDetails[0]?.childHierarchyPath ||
					entityDetails[0]?.childHierarchyPath.length < 0
				) {
					throw {
						status: HTTP_STATUS_CODE.not_found.status,
						message: CONSTANTS.apiResponses.ENTITY_NOT_FOUND,
					}
				}
				// Extract the childHierarchyPath and entityType
				const { childHierarchyPath, entityType } = entityDetails[0]

				// Append entityType to childHierarchyPath array
				const updatedChildHierarchyPaths = [entityType, ...childHierarchyPath]

				// Filter for higher entity types if a specific type is requested
				let filteredHierarchyPaths = updatedChildHierarchyPaths
				if (type) {
					const typeIndex = updatedChildHierarchyPaths.indexOf(type)
					if (typeIndex > -1) {
						// Include only higher types in the hierarchy
						filteredHierarchyPaths = updatedChildHierarchyPaths.slice(0, typeIndex + 1)
					}
				}

				// Construct the filter to retrieve entity type IDs based on child hierarchy paths
				const entityTypeFilter = {
					name: {
						$in: filteredHierarchyPaths,
					},
					isDeleted: false,
				}
				const entityTypeProjection = ['_id']
				// Retrieve entity type IDs based on child hierarchy paths
				const fetchEntityTypeId = await entityTypeQueries.entityTypesDocument(
					entityTypeFilter,
					entityTypeProjection
				)
				// Check if entity type IDs are retrieved successfully
				if (fetchEntityTypeId.length < 0) {
					throw {
						status: HTTP_STATUS_CODE.not_found.status,
						message: CONSTANTS.apiResponses.ENTITY_TYPE_DETAILS_NOT_FOUND,
					}
				}
				// Extract the _id fields from the fetched entity types to use as a filter for user roles
				const userRoleFilter = fetchEntityTypeId.map((entityType) => entityType._id)

				// Construct the filter for finding user roles based on entityTypeIds and status
				const userRoleExtensionFilter = {
					'entityTypes.entityTypeId': {
						$in: userRoleFilter,
					},
					status: CONSTANTS.common.ACTIVE_STATUS,
				}
				// Specify the fields to include in the result set
				const userRoleExtensionProjection = ['_id', 'title', 'code', 'userRoleId']

				// Fetch the user roles based on the filter and projection
				const fetchUserRoles = await userRoleExtensionHelper.find(
					userRoleExtensionFilter,
					userRoleExtensionProjection,
					pageSize,
					pageSize * (pageNo - 1),
					paginate
				)

				// Check if the fetchUserRoles operation was successful and returned data
				if (!fetchUserRoles.success || !fetchUserRoles.result || fetchUserRoles.result.length < 0) {
					throw {
						status: HTTP_STATUS_CODE.not_found.status,
						message: CONSTANTS.apiResponses.ROLES_NOT_FOUND,
					}
				}
				// Transforming the data
				const transformedData = fetchUserRoles.result.map((item) => {
					// For each item in the result array, create a new object with modified keys
					return {
						_id: item._id,
						value: item.userRoleId,
						label: item.title,
						code: item.code,
					}
				})
				return resolve({
					message: CONSTANTS.apiResponses.ROLES_FETCHED_SUCCESSFULLY,
					result: transformedData,
					count: fetchUserRoles.count,
				})
			} catch (error) {
				return reject(error)
			}
		})
	}

	/**
	 * Get either immediate entities or entity traversal based upon the type.
	 * @method
	 * @name subEntities
	 * @param {body} entitiesData
	 * @returns {Array} - List of all immediate entities or traversal data.
	 */

	static subEntities(entitiesData) {
		return new Promise(async (resolve, reject) => {
			try {
				let entitiesDocument

				if (entitiesData.type !== '') {
					// Perform entity traversal based on the specified type
					entitiesDocument = await this.entityTraversal(
						entitiesData.entityId,
						entitiesData.type,
						entitiesData.search,
						entitiesData.limit,
						entitiesData.pageNo
					)
				} else {
					// Retrieve immediate entities
					entitiesDocument = await this.immediateEntities(
						entitiesData.entityId,
						entitiesData.search,
						entitiesData.limit,
						entitiesData.pageNo
					)
				}

				return resolve(entitiesDocument)
			} catch (error) {
				return reject(error)
			}
		})
	}

	/**
	 * Get immediate entities.
	 * @method
	 * @name immediateEntities
	 * @param {Object} entityId
	 * @returns {Array} - List of all immediateEntities based on entityId.
	 */

	static immediateEntities(entityId, searchText = '', pageSize = '', pageNo = '') {
		return new Promise(async (resolve, reject) => {
			try {
				// Define projection fields for entity retrieval
				let projection = [CONSTANTS.common.ENTITYTYPE, CONSTANTS.common.GROUPS]
				// Retrieve entity documents based on entityId and projection fields
				let entitiesDocument = await entitiesQueries.entityDocuments(
					{
						_id: entityId,
					},
					projection
				)
				let immediateEntities = []
				// Process entity groups and retrieve immediate entity types
				if (
					entitiesDocument[0] &&
					entitiesDocument[0].groups &&
					Object.keys(entitiesDocument[0].groups).length > 0
				) {
					let getImmediateEntityTypes = await entityTypesHelper.entityTypesDocument(
						{
							name: entitiesDocument[0].entityType,
						},
						['immediateChildrenEntityType']
					)

					let immediateEntitiesIds
					// Identify immediate entity types and fetch associated entity IDs
					Object.keys(entitiesDocument[0].groups).forEach((entityGroup) => {
						if (
							getImmediateEntityTypes[0].immediateChildrenEntityType &&
							getImmediateEntityTypes[0].immediateChildrenEntityType.length > 0 &&
							getImmediateEntityTypes[0].immediateChildrenEntityType.includes(entityGroup)
						) {
							immediateEntitiesIds = entitiesDocument[0].groups[entityGroup]
						}
					})

					if (Array.isArray(immediateEntitiesIds) && immediateEntitiesIds.length > 0) {
						let searchImmediateData = await this.search(searchText, pageSize, pageNo, immediateEntitiesIds)

						immediateEntities = searchImmediateData[0]
					}
				}

				return resolve(immediateEntities)
			} catch (error) {
				return reject(error)
			}
		})
	}

	/**
	 * Get immediate entities.
	 * @method
	 * @name entityTraversal
	 * @param {Object} entityId
	 * @returns {Array} - List of all immediateEntities based on entityId.
	 */

	static entityTraversal(entityId, entityTraversalType = '', searchText = '', pageSize, pageNo) {
		return new Promise(async (resolve, reject) => {
			try {
				let entityTraversal = `groups.${entityTraversalType}`
				// Retrieve entity documents for entity traversal based on entityId, entity traversal type, search text, page size, and page number
				let entitiesDocument = await entitiesQueries.entityDocuments(
					{
						_id: entityId,
						groups: { $exists: true },
						[entityTraversal]: { $exists: true },
					},
					[entityTraversal]
				)
				// Return an empty array if no entities document is found
				if (!entitiesDocument[0]) {
					return resolve([])
				}
				let result = []
				// Process entity traversal data and retrieve entities based on search parameters
				if (entitiesDocument[0].groups[entityTraversalType].length > 0) {
					let entityTraversalData = await this.search(
						searchText,
						pageSize,
						pageNo,
						entitiesDocument[0].groups[entityTraversalType]
					)

					result = entityTraversalData[0]
				}
				return resolve(result)
			} catch (error) {
				return reject(error)
			}
		})
	}

	/**
	 * Search entity.
	 * @method
	 * @name search
	 * @param {String} searchText - Text to be search.
	 * @param {Number} pageSize - total page size.
	 * @param {Number} pageNo - Page no.
	 * @param {Array} [entityIds = false] - Array of entity ids.
	 */

	static search(searchText, pageSize, pageNo, entityIds = false) {
		return new Promise(async (resolve, reject) => {
			try {
				let queryObject = {}
				// Configure match criteria based on search text and entity IDs (if provided)
				queryObject['$match'] = {}

				if (entityIds && entityIds.length > 0) {
					queryObject['$match']['_id'] = {}
					queryObject['$match']['_id']['$in'] = entityIds
				}

				if (searchText !== '') {
					queryObject['$match']['$or'] = [
						{ 'metaInformation.name': new RegExp(searchText, 'i') },
						{ 'metaInformation.externalId': new RegExp('^' + searchText, 'm') },
						{ 'metaInformation.addressLine1': new RegExp(searchText, 'i') },
						{ 'metaInformation.addressLine2': new RegExp(searchText, 'i') },
					]
				}
				// Perform aggregation query to retrieve entity documents based on search criteria
				let entityDocuments = await entitiesQueries.getAggregate([
					queryObject,
					{
						$project: {
							name: '$metaInformation.name',
							externalId: '$metaInformation.externalId',
							addressLine1: '$metaInformation.addressLine1',
							addressLine2: '$metaInformation.addressLine2',
							entityType: 1,
						},
					},
					{
						$facet: {
							totalCount: [{ $count: 'count' }],
							data: [{ $skip: pageSize * (pageNo - 1) }, { $limit: pageSize }],
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
				return resolve(entityDocuments)
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
	 * @returns {JSON} - Success and message .
	 */

	static async addSubEntityToParent(parentEntityId, childEntityId) {
		try {
			// Find the child entity based on its ID
			const childEntity = await entitiesQueries.findOne(
				{ _id: ObjectId(childEntityId) },
				{ entityType: 1, groups: 1, childHierarchyPath: 1 }
			)

			if (!childEntity) {
				throw {
					status: HTTP_STATUS_CODE.not_found.status,
					message: CONSTANTS.apiResponses.DOCUMENT_NOT_FOUND,
				}
			}

			if (childEntity.entityType) {
				let parentEntityQueryObject = { _id: ObjectId(parentEntityId) }

				// Build the update query to add the child entity to the parent entity's groups
				let updateQuery = {
					$addToSet: {
						[`groups.${childEntity.entityType}`]: childEntity._id,
					},
				}

				// Add any existing child entity groups to the update query
				if (childEntity.groups) {
					for (const eachChildEntity in childEntity.groups) {
						if (childEntity.groups[eachChildEntity]?.length > 0) {
							updateQuery['$addToSet'][`groups.${eachChildEntity}`] = {
								$each: childEntity.groups[eachChildEntity],
							}
						}
					}
				}

				// Update childHierarchyPath in parent entity
				const childHierarchyPathToUpdate = [childEntity.entityType, ...(childEntity.childHierarchyPath || [])]

				updateQuery['$addToSet']['childHierarchyPath'] = { $each: childHierarchyPathToUpdate }

				// Optimize by fetching only required fields
				const projectedData = {
					_id: 1,
					entityType: 1,
					entityTypeId: 1,
					childHierarchyPath: 1,
				}

				// Perform update and fetch updated parent entity
				const updatedParentEntity = await entitiesQueries.findOneAndUpdate(
					parentEntityQueryObject,
					updateQuery,
					{ projection: projectedData, new: true }
				)

				// Process mapped parent entities in parallel
				await this.mappedParentEntities(updatedParentEntity, childEntity)
			}

			return
		} catch (error) {
			throw {
				status: error.status || HTTP_STATUS_CODE.internal_server_error.status,
				message: error.message || HTTP_STATUS_CODE.internal_server_error.message,
			}
		}
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
	static async mappedParentEntities(parentEntity, childEntity) {
		try {
			let updateParentHierarchy = false
			// Check if entityMapProcessData and entityTypeMap are defined
			if (this.entityMapProcessData?.entityTypeMap?.[parentEntity.entityType]) {
				updateParentHierarchy =
					this.entityMapProcessData.entityTypeMap[parentEntity.entityType].updateParentHierarchy
			} else {
				// Fetch update status from database if not in cache
				const checkParentEntitiesMappedValue = await entityTypeQueries.findOne(
					{ name: parentEntity.entityType },
					{ toBeMappedToParentEntities: 1 }
				)

				if (!checkParentEntitiesMappedValue) {
					throw {
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.DOCUMENT_NOT_FOUND,
					}
				}

				updateParentHierarchy = !!checkParentEntitiesMappedValue.toBeMappedToParentEntities

				// Cache the result in entityMapProcessData if available
				if (this.entityMapProcessData?.entityTypeMap) {
					this.entityMapProcessData.entityTypeMap[parentEntity.entityType] = {
						updateParentHierarchy,
					}
				}
			}

			if (updateParentHierarchy) {
				const relatedEntities = await this.relatedEntities(
					parentEntity._id,
					parentEntity.entityTypeId,
					parentEntity.entityType,
					['_id']
				)

				let childHierarchyPathToUpdate = [parentEntity.entityType, ...(parentEntity.childHierarchyPath || [])]

				if (relatedEntities.length > 0) {
					if (this.entityMapProcessData?.entityToUpdate) {
						relatedEntities.forEach((relatedEntity) => {
							const relatedEntityId = relatedEntity._id.toString()

							if (!this.entityMapProcessData.entityToUpdate[relatedEntityId]) {
								this.entityMapProcessData.entityToUpdate[relatedEntityId] = {}
							}

							const groupUpdatePath = `groups.${childEntity.entityType}`
							if (!this.entityMapProcessData.entityToUpdate[relatedEntityId][groupUpdatePath]) {
								this.entityMapProcessData.entityToUpdate[relatedEntityId][groupUpdatePath] = []
							}

							this.entityMapProcessData.entityToUpdate[relatedEntityId][groupUpdatePath].push(
								childEntity._id
							)
							this.entityMapProcessData.entityToUpdate[relatedEntityId]['childHierarchyPath'] =
								childHierarchyPathToUpdate
						})
					} else {
						const updateQuery = {
							$addToSet: {
								[`groups.${childEntity.entityType}`]: childEntity._id,
								childHierarchyPath: { $each: childHierarchyPathToUpdate },
							},
						}

						const allEntityIds = relatedEntities.map((entity) => entity._id)
						await entitiesQueries.updateMany({ _id: { $in: allEntityIds } }, updateQuery)
					}
				}
			}

			return
		} catch (error) {
			throw {
				status: error.status || HTTP_STATUS_CODE.internal_server_error.status,
				message: error.message || HTTP_STATUS_CODE.internal_server_error.message,
			}
		}
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

	static relatedEntities(entityId, entityTypeId, entityType, projection = 'all') {
		return new Promise(async (resolve, reject) => {
			try {
				// if (
				// 	this.entityMapProcessData &&
				// 	this.entityMapProcessData.relatedEntities &&
				// 	this.entityMapProcessData.relatedEntities[entityId.toString()]
				// ) {

				// 	return resolve(this.entityMapProcessData.relatedEntities[entityId.toString()])
				// }

				let relatedEntitiesQuery = {}

				if (entityTypeId && entityId && entityType) {
					relatedEntitiesQuery[`groups.${entityType}`] = entityId
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
	 * Fetches entity documents based on entity type.
	 * @method
	 * @name entityListBasedOnEntityType
	 * @param {string} type - Type of entity to fetch documents for.
	 * @param {string} pageNo - pageNo for pagination
	 * @param {string} pageSize - pageSize for pagination
	 * @returns {Promise<Object>} Promise that resolves with fetched documents or rejects with an error.
	 */

	static entityListBasedOnEntityType(type, pageNo, pageSize, paginate) {
		return new Promise(async (resolve, reject) => {
			try {
				// Fetch the list of entity types available
				const entityList = await entityTypeQueries.entityTypesDocument(
					{
						name: type,
					},
					['name']
				)
				// Check if entity list is empty
				if (!entityList.length > 0) {
					throw {
						status: HTTP_STATUS_CODE.not_found.status,
						message: CONSTANTS.apiResponses.ENTITYTYPE_NOT_FOUND,
					}
				}
				const projection = ['_id', 'metaInformation.name', 'metaInformation.externalId']
				// Fetch documents for the matching entity type
				let fetchList = await entitiesQueries.entityDocuments(
					{
						entityType: type,
					},
					projection,
					pageSize,
					pageSize * (pageNo - 1),
					'',
					paginate
				)
				const count = await entitiesQueries.countEntityDocuments({ entityType: type })

				// Check if fetchList list is empty
				if (count <= 0) {
					throw {
						status: HTTP_STATUS_CODE.not_found.status,
						message: CONSTANTS.apiResponses.ENTITY_NOT_FOUND,
					}
				}

				// Transform the fetched list to match the required result format
				const result = fetchList.map((entity) => ({
					_id: entity._id,
					name: entity.metaInformation.name,
					externalId: entity.metaInformation.externalId,
				}))

				return resolve({
					success: true,
					message: CONSTANTS.apiResponses.ASSETS_FETCHED_SUCCESSFULLY,
					result: result,
					count,
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

					let childHierarchyPath = []
					if (Array.isArray(singleEntity.childHierarchyPath)) {
						// Fetch the valid childHierarchyPath from the entityType DB
						let validEntityType = await entityTypeQueries.entityTypesDocument(
							{
								// Use the "$in" operator to check if any of the entityType names are present in the 'childHierarchyPath' array
								name: {
									$in: singleEntity.childHierarchyPath,
								},
							},
							// Specify to return only the 'name' field of matching documents

							{ name: 1 }
						)

						// Create a mapping of names to their original index in childHierarchyPath
						const validatedChildHierarchy = singleEntity.childHierarchyPath.filter((name) =>
							validEntityType.some((entityType) => entityType.name === name)
						)
						// Convert the names in 'validatedChildHierarchy' to strings and assign them to 'childHierarchyPath'
						childHierarchyPath = validatedChildHierarchy.map(String)
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
						// if (singleEntity.allowedRoles && singleEntity.allowedRoles.length > 0) {
						// 	entityCreation['allowedRoles'] = await allowedRoles(singleEntity.allowedRoles)
						// 	delete singleEntity.allowedRoles
						// }
						if (singleEntity.childHierarchyPath) {
							entityCreation['childHierarchyPath'] = JSON.parse(singleEntity['childHierarchyPath'])
						}
						// Populate metaInformation by omitting keys starting with '_'
						entityCreation['metaInformation'] = _.omitBy(singleEntity, (value, key) => {
							return _.startsWith(key, '_')
						})

						if (!entityCreation.metaInformation.name || !entityCreation.metaInformation.externalId) {
							entityCreation.status = CONSTANTS.apiResponses.ENTITIES_FAILED
							entityCreation.message = CONSTANTS.apiResponses.FIELD_MISSING
							return entityCreation
						}

						if (entityCreation.metaInformation.externalId) {
							const externalId = entityCreation.metaInformation.externalId

							entityCreation.registryDetails = {
								code: externalId,
								locationId: externalId,
							}
						}
						// if (solutionsData && singleEntity._solutionId && singleEntity._solutionId != '')
						// 	singleEntity['createdByProgramId'] = solutionsData[singleEntity._solutionId]['programId']
						let newEntity = await entitiesQueries.create(entityCreation)
						if (!newEntity._id) {
							return
						}

						singleEntity['_SYSTEM_ID'] = newEntity._id.toString()

						if (singleEntity._SYSTEM_ID) {
							singleEntity.status = CONSTANTS.apiResponses.SUCCESS
							singleEntity.message = CONSTANTS.apiResponses.SUCCESS
						}

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

						if (!updateData['metaInformation.name'] || !updateData['metaInformation.externalId']) {
							singleEntity.status = CONSTANTS.apiResponses.ENTITIES_FAILED
							singleEntity.message = CONSTANTS.apiResponses.FIELD_MISSING
							return singleEntity
						}

						if (Object.keys(updateData).length > 0) {
							let updateEntity = await entitiesQueries.findOneAndUpdate(
								{ _id: singleEntity['_SYSTEM_ID'] },
								{ $set: updateData },
								{ _id: 1 }
							)

							if (!updateEntity || !updateEntity._id) {
								singleEntity['status'] = CONSTANTS.apiResponses.ENTITY_NOT_FOUND
							} else {
								singleEntity['status'] = CONSTANTS.apiResponses.SUCCESS
								singleEntity['message'] = CONSTANTS.apiResponses.SUCCESS
							}
						} else {
							singleEntity['status'] = CONSTANTS.apiResponses.NO_INFORMATION_TO_UPDATE
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
					message: CONSTANTS.apiResponses.ENTITY_UPDATED,
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
