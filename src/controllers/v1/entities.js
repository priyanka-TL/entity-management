/**
 * name : entities.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : Entity Type related information.
 */

// Dependencies
const entitiesHelper = require(MODULES_BASE_PATH + '/entities/helper')
const csv = require('csvtojson')
const FileStream = require(PROJECT_ROOT_DIRECTORY + '/generics/file-stream')
const entitiesQueries = require(DB_QUERY_BASE_PATH + '/entities')

/**
 * entities
 * @class
 */

module.exports = class Entities extends Abstract {
	/**
	 * @apiDefine errorBody
	 * @apiError {String} status 4XX,5XX
	 * @apiError {String} message Error
	 */

	/**
	 * @apiDefine successBody
	 *  @apiSuccess {String} status 200
	 * @apiSuccess {String} result Data
	 */

	constructor() {
		super('entities')
	}

	static get name() {
		return 'entities'
	}

	/**
	 * Find all the entities based on the projection.
	 * @api {POST} /v1/entities/find all the API based on projection
	 * @apiVersion 1.0.0
	 * @apiName find
	 * @apiGroup Entities
	 * @apiSampleRequest {
		"query" : {
			"metaInformation.externalId" : "PBS"
		},

		"projection": [
			"_id"
		]
		}
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @apiParamExample {json} Response:
	 * @returns {JSON} - List of all entities.
	 *  "result": [
		{
			"_id": "6613b8142c7d9408449474bf"
		},
		{
			"_id": "6613b8f32c7d9408449474c2"
		}
	]
	 */

	find(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Calls the 'find' function from 'entitiesHelper' to retrieve entity data
				let entityData = await entitiesHelper.find(req.body.query, req.body.projection)
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
      * @api {get} v1/entities/relatedEntities/:entityId Get Related Entities
      * @apiVersion 1.0.0
      * @apiName Get Related Entities
      * @apiGroup Entities
      * @apiSampleRequest v1/entities/relatedEntities/5c0bbab881bdbe330655da7f
      * @apiUse successBody
      * @apiUse errorBody
      * @apiParamExample {json} Response:
	 "result": {
		"relatedEntities": [
			{
				"_id": "5f33c3d85f637784791cd830",
				"entityTypeId": "5f32d8228e0dc8312404056e",
				"entityType": "state",
				"metaInformation": {
					"externalId": "MH",
					"name": "Maharashtra"
				}
			},
			{
				"_id": "5fbf3f8c3e9df47967eed916",
				"entityTypeId": "5f32d8228e0dc8312404056e",
				"entityType": "state",
				"metaInformation": {
					"externalId": "993067ca-8499-4ef5-9325-560d3b3e5de9",
					"name": "Himachal Pradesh"
				}
			}
		]
	**/
	relatedEntities(req) {
		return new Promise(async (resolve, reject) => {
			try {
				let result = {}
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
				let entityDocument = await entitiesQueries.entityDocuments({ _id: req.params._id }, projection)

				if (entityDocument.length < 1) {
					throw {
						status: HTTP_STATUS_CODE.not_found.status,
						message: CONSTANTS.apiResponses.ENTITY_NOT_FOUND,
					}
				}

				let relatedEntities = await entitiesHelper.relatedEntities(
					entityDocument[0]._id,
					entityDocument[0].entityTypeId,
					entityDocument[0].entityType,
					projection
				)
				_.merge(result, entityDocument[0])
				result['relatedEntities'] = relatedEntities.length > 0 ? relatedEntities : []

				return resolve({
					message: CONSTANTS.apiResponses.ENTITY_FETCHED,
					result: result,
				})
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
	 * Find all the entities based on the projection.
	 * @api {GET} /v1/entities/entityListBasedOnEntityType?entityType=state all the API based on projection
	 * @apiVersion 1.0.0
	 * @apiName entityListBasedOnEntityType
	 * @apiGroup Entities
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @apiParamExample {json} Response:
	 * @returns {JSON} - List of all entities.
	 *  {
    "message": "ASSETS_FETCHED_SUCCESSFULLY",
    "status": 200,
    "result": [
        {
            "_id": "665d8df5c6892808846230e7",
            "name": "goa"
        },
        {
            "_id": "665d96cdc6892808846230f1",
            "name": "Arunachal Pradesh"
        }
    ]
	}
	 */

	entityListBasedOnEntityType(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Call helper function to fetch entity data based on entity type
				let entityData = await entitiesHelper.entityListBasedOnEntityType(
					req.query.entityType,
					req.pageNo,
					req.pageSize,
					req?.query?.paginate?.toLowerCase() == 'true' ? true : false
				)
				return resolve(entityData)
			} catch (error) {
				return reject({
					// Handle any errors that occur during the fetch operation
					status: error.status || HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message || HTTP_STATUS_CODE.internal_server_error.message,
					errorObject: error,
				})
			}
		})
	}

	/**
	  * @api {post} v1/entities/mappingUpload
	  * @apiVersion 1.0.0
	  * @apiName mappingUpload
	  * @apiGroup Entities
	  * @apiParam {File} entityMap Mandatory entity mapping file of type CSV.
	  * @apiUse successBody
	  * @apiUse errorBody
      * @param {Array} req.files.entityMap - Array of entityMap data.         
     * @returns {JSON} - Message of successfully updated.
     * 
     * {
		"message": "ENTITY_INFORMATION_UPDATE",
		"status": 200,
		"result": {
			"success": true,
			"message": "ENTITY_INFORMATION_UPDATE"
		}
	 }
    */

	mappingUpload(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Parse CSV data from the uploaded file in the request body
				let entityCSVData = await csv().fromString(req.files.entityMap.data.toString())

				// Process the entity mapping upload data using 'entitiesHelper.processEntityMappingUploadData'
				let entityMappingUploadResponse = await entitiesHelper.processEntityMappingUploadData(entityCSVData)

				// Check if the entity mapping upload was successful
				if (!entityMappingUploadResponse.success) {
					throw new Error(CONSTANTS.apiResponses.SOMETHING_WENT_WRONG)
				}

				return resolve({
					message: CONSTANTS.apiResponses.ENTITY_INFORMATION_UPDATE,
					result: entityMappingUploadResponse,
				})
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
	 * Handles the request to fetch targeted roles based on the provided entity IDs in the request parameters.
	  * @api {GET} v1/entities/targetedRoles/5f33c3d85f637784791cd831
	  * @apiVersion 1.0.0
	  * @apiName targetedRoles
	  * @apiGroup Entities
	  * @apiUse successBody
	  * @apiUse errorBody
	 * @param {Object} req - The request object containing parameters and user details.
	 * @param {Object} req.params - The request parameters.
	 * @param {string} req.params._id - The entity ID to filter roles.
	 * @returns {Promise<Object>} A promise that resolves to the response containing the fetched roles or an error object.
	 * * @returns {JSON} - Message of successfully response.
     * 
     * {
    "message": "ROLES_FETCHED_SUCCESSFULLY",
    "status": 200,
    "result": [
        {
            "_id": "66a8df494efa6ccce9113da6",
            "userRoleId": 10,
            "title": "headmaster",
            "userType": 1
        },
        {
            "_id": "66a8df824efa6ccce9113dac",
            "userRoleId": 12,
            "title": "BEO",
            "userType": 1
        },
        {
            "_id": "66a8df654efa6ccce9113da9",
            "userRoleId": 11,
            "title": "AMO",
            "userType": 1
        },
        {
            "_id": "66a8dfc44efa6ccce9113db5",
            "userRoleId": 13,
            "title": "EducationMinister",
            "userType": 1
        }
    ],
    "count": 5
    }
    */
	targetedRoles(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Calls the 'targetedRoles' function from 'entitiesHelper' to retrieve entity data
				let userRoleDetails = await entitiesHelper.targetedRoles(
					req.params._id,
					req.pageNo,
					req.pageSize,
					req?.query?.paginate?.toLowerCase() == 'true' ? true : false
				)
				// Resolves the promise with the retrieved entity data
				return resolve(userRoleDetails)
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
	 * details of the entities.
	 * @api {get} v1/entities/details provide the details 
	 * @apiVersion 1.0.0
	 * @apiName details
	 * @apiGroup Entities
	 * @apiHeader {String} X-authenticated-user-token Authenticity token
	 * @apiSampleRequest v1/entities/details/663339bc0cb19f01c459853b
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @returns {JSON} - provide the details.
	 * 
	 "result": [
		{
			"_id": "5f33c3d85f637784791cd830",
			"childHierarchyPath": [
				"district",
				"beat",
				"cluster",
				"school"
			],
			"allowedRoles": [
				"rahul",
				"prajwal"
			],
			"deleted": false,
			"entityTypeId": "5f32d8228e0dc8312404056e",
			"entityType": "state",
			"metaInformation": {
				"externalId": "MH",
				"name": "Maharashtra",
				"region": "West",
				"capital": "Mumbai"
			},
			"updatedBy": "124fdade-aaa2-4587-9dcd-3c7cf15c7147",
			"createdBy": "2b655fd1-201d-4d2a-a1b7-9048a25c0afa",
			"updatedAt": "2021-01-18T06:51:31.086Z",
			"createdAt": "2020-08-12T10:26:32.038Z",
			"__v": 0,
			"groups": {
				"district": [
					"5f33c56fb451f58478b36996"
				],
				"beat": [
					"5f33cb24c1352f84a29f547c",
					"5f33cb24c1352f84a29f547d"
				],
				"cluster": [
					"5f33cb07ce438a849b4a17f6",
					"5f33cb07ce438a849b4a17f7"
				],
				"school": [
					"5f33caebb451f58478b36998",
					"5f33caebb451f58478b36999",
					"5f833e5c87ae180cb64aeff0"
				]
			},
			"registryDetails": {
				"locationId": "db331a8c-b9e2-45f8-b3c0-7ec1e826b6df",
				"code": "db331a8c-b9e2-45f8-b3c0-7ec1e826b6df"
			}
		}
	 ]
	*/

	details(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Prepare parameters for 'entitiesHelper.details' based on request data
				let result = await entitiesHelper.details(
					req.params._id ? req.params._id : '',
					req.body ? req.body : {}
				)

				return resolve(result)
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
	 * Update entity information.
	 * @api {POST} /v1/entities/update single entities
	 * @apiVersion 1.0.0
	 * @apiName update
	 * @apiGroup Entities
	 * @apiHeader {String} X-authenticated-user-token Authenticity token
	 * @apiSampleRequest /v1/entities/update/663364443c990eaa179e289e
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @param {Object} req - requested entity data.
	 * @param {String} req.query.type - entity type.
	 * @param {String} req.params._id - entity id.
	 * @param {Object} req.body - entity information that need to be updated.
	 * @returns {JSON} - Updated entity information.
	 * 
	 *  
	"result": {
		"metaInformation": {
		"externalId": "entity123",
		"name": "rahul"
		},
		"childHierarchyPath": [],
		"allowedRoles": [
		"rahul",
		"prajwal"
		],
		"createdBy": "user123",
		"updatedBy": "user123",
		"deleted": false,
		"_id": "6613ddfa44b91a0d1a58bb32",
		"entityTypeId": "661384681797bc00de520555",
		"entityType": "rahul",
		"updatedAt": "2024-04-22T09:04:12.292Z",
		"createdAt": "2024-04-08T12:07:22.369Z",
		"__v": 0
	 }
	*/

	update(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Call 'entitiesHelper.update' to perform the entity update operation
				let result = await entitiesHelper.update(req.params._id, req.body)

				return resolve(result)
			} catch (error) {
				return reject({
					status: error.status || HTTP_STATUS_CODE.bad_request.status,
					message: error.message || HTTP_STATUS_CODE.bad_request.message,
					errorObject: error,
				})
			}
		})
	}

	/**
	 * Add entities.
	 * @api {POST} /entity/api/v1/entities/create single entities
	 * @apiVersion 1.0.0
	 * @apiName add
	 * @apiGroup Entities
	 * @apiHeader {String} X-authenticated-user-token Authenticity token
	 * @apiSampleRequest /entity/api/v1/entities/add
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @param {Object} req - All requested Data.
	 * @param {Object} req.files - requested files.
	 * @returns {JSON} - Added entities information.
	 * 
	 *   "result": [
		{
			"childHierarchyPath": [],
			"allowedRoles": [],
			"createdBy": "SYSTEM",
			"updatedBy": "SYSTEM",
			"_id": "662627c923a1b004a5cc4d65",
			"deleted": false,
			"entityTypeId": "627a13928ce12806f5803f57",
			"entityType": "block",
			"metaInformation": {
				"externalId": "entity123"
			},
			"updatedAt": "2024-04-22T09:03:05.921Z",
			"createdAt": "2024-04-22T09:03:05.921Z",
			"__v": 0
		}
	 ]
	*/

	add(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Prepare query parameters for adding the entity
				let queryParams = {
					type: req.query.type,
					// programId: req.query.programId,
					//   solutionId: req.query.solutionId,
					parentEntityId: req.query.parentEntityId,
				}
				// Call 'entitiesHelper.add' to perform the entity addition operation
				let result = await entitiesHelper.add(queryParams, req.body, req.userDetails)

				return resolve({
					message: CONSTANTS.apiResponses.ENTITY_ADDED,
					result: result,
				})
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
	 * List of entities by location ids.
	 * @api {get} v1/entities/list List all entities based locationIds
	 * @apiVersion 1.0.0
	 * @apiName listByLocationIds
	 * @apiGroup Entities
	 * @apiHeader {String} X-authenticated-user-token Authenticity token
	 * @apiSampleRequest v1/entities/listByLocationIds
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @param {Object} req - requested data.
	 * @param {Object} req.body.locationIds - registry data.
	 * @returns {Object} -
	 * 
	 *   "result": [
		{
			"_id": "5f33c3d85f637784791cd830",
			"entityTypeId": "5f32d8228e0dc8312404056e",
			"entityType": "state",
			"metaInformation": {
				"externalId": "MH",
				"name": "Maharashtra",
				"region": "West",
				"capital": "Mumbai"
			},
			"registryDetails": {
				"locationId": "db331a8c-b9e2-45f8-b3c0-7ec1e826b6df",
				"code": "db331a8c-b9e2-45f8-b3c0-7ec1e826b6df"
			}
		}
     ]
	*/

	listByLocationIds(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Call 'entitiesHelper.listByLocationIds' to retrieve entities based on location IDs
				let entitiesData = await entitiesHelper.listByLocationIds(req.body.locationIds)

				entitiesData.result = entitiesData.data

				return resolve(entitiesData)
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
	 * Entities child hierarchy path
	 * @api {get} v1/entities/subEntityListBasedOnRoleAndLocation List all entities based on Location and Role
	 * @apiVersion 1.0.0
	 * @apiName subEntityListBasedOnRoleAndLocation
	 * @apiGroup Entities
	 * @apiHeader {String} X-authenticated-user-token Authenticity token
	 * @apiSampleRequest v1/entities/subEntityListBasedOnRoleAndLocation
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @param {String} req.params._id - entityId.
	 * @returns {JSON} - Entities child hierarchy path
	 * 
	 * 
	"result": [
		{
			"_id": "5f33c3d85f637784791cd830",
			"childHierarchyPath": [
				"district",
				"beat",
				"cluster",
				"school"
			]
		},
		{
			"_id": "627a13928ce12806f5803f57",
			"childHierarchyPath": [
				"district",
				"beat",
				"cluster",
				"school"
			]
		} 
	 ]

	*/

	subEntityListBasedOnRoleAndLocation(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Call 'entitiesHelper.subEntityListBasedOnRoleAndLocation' to retrieve sub-entity list
				const entityTypeMappingData = await entitiesHelper.subEntityListBasedOnRoleAndLocation(req.params._id)
				return resolve(entityTypeMappingData)
			} catch (error) {
				return reject({
					status: error.status || HTTP_STATUS_CODE['internal_server_error'].status,
					message: error.message || HTTP_STATUS_CODE['internal_server_error'].message,
				})
			}
		})
	}

	/**
	* @api {get} v1/entities/listByEntityType all entities based on EntityType
	* @apiVersion 1.0.0
	* @apiName listByEntityType
	* @apiGroup Entities
	* @apiHeader {String} X-authenticated-user-token Authenticity token
	* @apiSampleRequest v1/entities/listByEntityType
	* @apiUse successBody
	* @apiUse errorBody
	* @param {Object} req - requested data.
	* @param {String} req.params._id - requested entity type.
	* @returns {JSON} - Array of entities.

	"result": [
			{
				"externalId": "PBS",
				"name": "Punjab",
				"locationId": "",
				"_id": "6613b8142c7d9408449474bf"
			},
			{
				"externalId": "PBS",
				"name": "Punjab",
				"locationId": "",
				"_id": "6613b8f32c7d9408449474c2"
			},
		]
    */

	listByEntityType(req, res) {
		return new Promise(async (resolve, reject) => {
			try {
				// Call 'entitiesHelper.listEntitiesByType' to retrieve entities based on the request
				const result = await entitiesHelper.listEntitiesByType(req)

				return resolve(result)
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
	* @api {get} v1/entities/list List all entities
	* @apiVersion 1.0.0
	* @apiName Entities list
	* @apiGroup Entities
	* @apiHeader {String} X-authenticated-user-token Authenticity token
	* @apiSampleRequest /v1/entities/list
	* @apiUse successBody
	* @apiUse errorBody
	* @param {String} req.query.type - type of entity requested.
	* @param {String} req.params._id - requested entity id.
	* @param {Number} req.pageSize - total size of the page.
	* @param {Number} req.pageNo - page number.
	* @param {string} req.query.schoolTypes - comma seperated school types.
	* @param {string} req.query.administrationTypes - comma seperated administration types.
	* @apiParamExample {json} Response:
	* "result": [
	{
		"_id": "5ce23d633c330302e720e661",
		"name": "teacher"
	},
	{
		"_id": "5ce23d633c330302e720e663",
		"name": "schoolLeader"
	}
	]
    */

	list(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Call 'entitiesHelper.list' to retrieve entities based on provided parameters
				let result = await entitiesHelper.list(
					req.query.type,
					req.params._id,
					req.pageSize,
					req.pageSize * (req.pageNo - 1),
					req.schoolTypes,
					req.administrationTypes
				)

				return resolve(result)
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
     * @api {GET} v1/entities/subEntityList/663339bc0cb19f01c459853b?type=school&search=&page=1&limit=100
     * Get sub entity list for the given entity. 
     * @apiVersion 1.0.0
     * @apiGroup Entities
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiSampleRequest v1/entities/subEntityList/663339bc0cb19f01c459853b?type=school&search=&page=1&limit=100
     * @apiUse successBody
     * @apiUse errorBody
     * @apiParamExample {json} Response:
     * {
    "status": 200,
    "result": {
        "data": [
            {
                "_id": "627a13928ce12806f5803f57",
                "entityType": "school",
                "externalId": "entity123",
                "label": "undefined - entity123",
                "value": "627a13928ce12806f5803f57"
            }
        ],
        "count": 1
    }
    }

    /**
      * Get the immediate entities .
      * @method
      * @name subEntityList
      * @param  {Request} req request body.
      * @param {String} req.params._id - entityId
      * @returns {JSON} Returns list of immediate entities
     */

	subEntityList(req) {
		return new Promise(async (resolve, reject) => {
			// Check if required parameters (_id or entities) are missing
			if (!(req.params._id || req.body.entities)) {
				return resolve({
					status: HTTP_STATUS_CODE.bad_request.status,
					message: constants.apiResponses.ENTITY_ID_OR_LOCATION_ID_NOT_FOUND,
				})
			}

			try {
				// Call 'entitiesHelper.subEntityList' to retrieve sub-entities based on the request parameters
				let entityDocuments = await entitiesHelper.subEntityList(
					req.body.entities ? req.body.entities : '',
					req.params._id ? req.params._id : '',
					req.query.type ? req.query.type : '',
					req.searchText,
					req.pageSize,
					req.pageNo
				)
				return resolve(entityDocuments)
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
     * @api {GET} /v1/entities/listByIds
     * Get sub entity list for the given entity. 
     * @apiVersion 1.0.0
     * @apiGroup Entities
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiSampleRequest{
		"entities": [
			"5f33c3d85f637784791cd830"
		],
		"fields": [
			"entityType"
		]
	}
     * @apiUse successBody
     * @apiUse errorBody
     * @apiParamExample {json} Response:

    /**
     * List of entities.
     * @method
     * @name listByIds
	 * @param {Object} req - requested data.
	 * @param {String} req.params._id - requested entity type.         
	 * @returns {JSON} - Array of entities.
	*/

	listByIds(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Call 'entitiesHelper.listByEntityIds' to retrieve entities based on provided entity IDs and fields
				const entities = await entitiesHelper.listByEntityIds(req.body.entities, req.body.fields)
				return resolve(entities)
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
	 * Bulk create entities.
	 * @api {POST}v1/entities/relatedEntities/Create API by uploading CSV
	 * @apiVersion 1.0.0
	 * @apiName bulkCreate
	 * @apiGroup Entities
	 * @apiSampleRequest /v1/entities/bulkCreate
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @apiParamExample {json} Response:
	 * @param {Object} req - requested data.
	 * @param {String} req.query.type - requested entity type.
	 * @param {Object} req.userDetails - logged in user details.
	 * @param {Object} req.files.entities - entities data.
	 * @returns {CSV} - A CSV with name Entity-Upload is saved inside the folder
	 * public/reports/currentDate
	 *
	 */

	bulkCreate(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Parse CSV data from uploaded file
				let entityCSVData = await csv().fromString(req.files.entities.data.toString())

				// Call 'entitiesHelper.bulkCreate' to create entities from parsed CSV data
				let newEntityData = await entitiesHelper.bulkCreate(
					req.query.type,
					null,
					null,
					req.userDetails,
					entityCSVData
				)

				// Check if new entities were created successfully
				if (newEntityData.length > 0) {
					const fileName = `Entity-Upload`
					let fileStream = new FileStream(fileName)
					let input = fileStream.initStream()

					// Use Promise to handle stream processing and resolve with file details
					;(async function () {
						await fileStream.getProcessorPromise()
						return resolve({
							isResponseAStream: true,
							fileNameWithPath: fileStream.fileNameWithPath(),
						})
					})()

					// Push each new entity into the file stream for processing
					await Promise.all(
						newEntityData.map(async (newEntity) => {
							input.push(newEntity)
						})
					)

					input.push(null)
				} else {
					throw CONSTANTS.apiResponses.SOMETHING_WENT_WRONG
				}
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
	 * Bulk update entities.
	 * @api {POST} v1/entities/relatedEntities/Update API by uploading CSV
	 * @apiVersion 1.0.0
	 * @apiName bulkUpdate
	 * @apiGroup Entities
	 * @apiSampleRequest v1/entities/bulkUpdate
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @apiParamExample {json} Response:
	 * @param {Object} req - requested data.
	 * @param {Object} req.userDetails - logged in user details.
	 * @param {Object} req.files.entities - entities data.
	 * @returns {CSV} - A CSV with name Entity-Upload is saved inside the folder
	 * public/reports/currentDate
	 *
	 */

	bulkUpdate(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Parse CSV data from uploaded file
				let entityCSVData = await csv().fromString(req.files.entities.data.toString())

				// Check if CSV data is valid and contains entities
				if (!entityCSVData || entityCSVData.length < 1) {
					throw CONSTANTS.apiResponses.ENTITY_TYPE_NOT_UPDATED
				}

				// Call 'entitiesHelper.bulkUpdate' to update entities based on CSV data and user details
				let newEntityData = await entitiesHelper.bulkUpdate(entityCSVData, req.userDetails)

				// Check if entities were updated successfully
				if (newEntityData.length > 0) {
					const fileName = `Entity-Upload`
					let fileStream = new FileStream(fileName)
					let input = fileStream.initStream()

					// Use Promise to handle stream processing and resolve with file details
					;(async function () {
						await fileStream.getProcessorPromise()
						return resolve({
							isResponseAStream: true,
							fileNameWithPath: fileStream.fileNameWithPath(),
						})
					})()

					await Promise.all(
						newEntityData.map(async (newEntity) => {
							input.push(newEntity)
						})
					)

					input.push(null)
				} else {
					throw new Error(CONSTANTS.apiResponses.SOMETHING_WENT_WRONG)
				}
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
