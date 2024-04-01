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
					status: error.status || httpStatusCode.internal_server_error.status,
					message: error.message || httpStatusCode.internal_server_error.message,
					errorObject: error,
				})
			}
		})
	}

	static entitiesSchemaData() {
        return {
            "SCHEMA_ENTITY_OBJECT_ID" : "_id",
            "SCHEMA_ENTITY_TYPE_ID" : "entityTypeId",
            "SCHEMA_ENTITIES" : "entities",
            "SCHEMA_ENTITY_TYPE" : "entityType",
            "SCHEMA_ENTITY_GROUP" : "groups",
            "SCHEMA_METAINFORMATION" : "metaInformation",
            "SCHEMA_ENTITY_CREATED_BY" : "createdBy"
        }
    }

	static list(
		entityType,
		entityId,
		limitingValue = '',
		skippingValue = '',
		schoolTypes = '',
		administrationTypes = ''
	) {
		console.log(entityType, "line no 80");
		return new Promise(async (resolve, reject) => {
			try {
				let queryObject = { _id: ObjectId(entityId) }
				let projectObject = { [`groups.${entityType}`]: 1 }
				console.log(projectObject, "line no 85");
				let result = await database.models.entities.findOne(queryObject, projectObject).lean()
				console.log(result, "line no 87");
				if (!result) {
					return resolve({
						status: 200,
						message: CONSTANTS.apiResponses.ENTITY_NOT_FOUND,
					})
				}

				if (!result.groups || !result.groups[entityType]) {
					return resolve({
						status: httpStatusCode.bad_request.status,
						message: CONSTANTS.apiResponses.ENTITY_GROUPS_NOT_FOUND,
					})
				}

				let entityIds = result.groups[entityType]
				console.log(entityIds, "line no 103");
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
