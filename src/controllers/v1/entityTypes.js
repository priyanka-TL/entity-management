/**
 * name : entityTypes.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : Entity Type related information.
 */

// Dependencies
const entityTypesHelper = require(MODULES_BASE_PATH + '/entityTypes/helper')
const csv = require('csvtojson')
const FileStream = require(PROJECT_ROOT_DIRECTORY + '/generics/file-stream')

/**
 * entityType
 * @class
 */

module.exports = class EntityTypes extends Abstract {
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
		super('entityTypes')
	}

	static get name() {
		return 'entityTypes'
	}

	/**
    * @api {get} /entity/api/v1/entityTypes/list List all entity types.
    * @apiVersion 1.0.0
    *  @apiName Entity Type list
    * @apiGroup Entity Types
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiSampleRequest /assessment/api/v1/entityTypes/list
    * @apiUse successBody
    * @apiUse errorBody
    * @returns {JSON} - List of all entity types.
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
	async list() {
		return new Promise(async (resolve, reject) => {
			try {
				// Call 'entityTypesHelper.list' to retrieve a list of entity types
				// 'all' parameter retrieves all entity types, and { name: 1 } specifies projection to include only 'name' field
				let result = await entityTypesHelper.list('all', { name: 1 })

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
	 * Find all the entity types.
	* @api {get} /entity/api/v1/entityTypes/find all entity types.
    * @apiVersion 1.0.0
    * @apiName find
    * @apiGroup Entity Types
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiSampleRequest /assessment/api/v1/entityTypes/find
    * @apiUse successBody
    * @apiUse errorBody
	 * @returns {JSON} - List of all entity types.
	 *   "result": [
        {
            "_id": "6613c1a761abff09406a7465",
            "name": "hub"
        },
        {
            "_id": "661e2747e3bf510d130250e1",
            "name": "hub"
        },
	 */
	async find(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Call 'entityTypesHelper.list' to find entity types based on provided query, projection, and skipFields
				let result = await entityTypesHelper.list(req.body.query, req.body.projection, req.body.skipFields)

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
	 *  create Entity Types.
	 * @api {get} /assessment/api/v1/entities/relatedEntities/create single API's
	 * @apiVersion 1.0.0
	 * @apiName create
	 * @apiGroup Entities
	 * @apiSampleRequest /assessment/api/v1/entityTypes/create
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @param {Object} req -request data.
	 * @param {Object} req.files.entityTypes -entityTypes data.
	 * @returns {CSV}  create single  entity Types data.
	 * 
	 * "result": {
        "name": "PRAJWAL",
        "registryDetails": {
            "name": "pawan"
        },
        "isObservable": true,
        "toBeMappedToParentEntities": true,
        "immediateChildrenEntityType": [
            "school",
            "collage"
        ]
    }
	 */

	async create(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Call 'entityTypesHelper.create' to create a new entity type
				let result = await entityTypesHelper.create(req.body, req.userDetails.userInformation)
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
	 * Update entityType information.
	 * @api {get} /assessment/api/v1/entities/relatedEntities/update single API's
	 * @apiVersion 1.0.0
	 * @apiName update
	 * @apiGroup Entities
	 * @apiSampleRequest /assessment/api/v1/entityTypes/update
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @param {Object} req - requested entityType data.
	 * @param {String} req.query.type - entityType type.
	 * @param {String} req.params._id - entityType id.
	 * @param {Object} req.body - entityType information that need to be updated.
	 * @returns {JSON} - Updated entityType information.
	 *  "result": {
        "profileForm": [],
        "profileFields": [],
        "types": [],
        "callResponseTypes": [],
        "isObservable": true,
        "immediateChildrenEntityType": [
            "collage"
        ],
        "createdBy": "SYSTEM",
        "updatedBy": "SYSTEM",
        "deleted": false,
        "_id": "661387f572fad002e57cce8f",
        "isDeleted": false,
        "name": "prajwal",
        "registryDetails": {
            "name": "bijapure"
        },
        "toBeMappedToParentEntities": true,
        "updatedAt": "2024-04-22T09:37:51.634Z",
        "createdAt": "2024-04-08T06:00:21.695Z",
        "__v": 0
    }
	 */

	update(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Call 'entityTypesHelper.update' to update an existing entity type
				let result = await entityTypesHelper.update(req.params._id, req.body, req.userDetails.userInformation)

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
	 * Bulk create Entity Types.
	 * @api {get} /assessment/api/v1/entities/relatedEntities/Create API by uploading CSV
	 * @apiVersion 1.0.0
	 * @apiName bulkCreate
	 * @apiGroup Entities
	 * @apiSampleRequest /assessment/api/v1/entityTypes/bulkCreate
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @apiParamExample {json} Response:
	 * @param {Object} req -request data.
	 * @param {Object} req.files.entityTypes -entityTypes data.
	 * @returns {CSV} Bulk create entity Types data.
	 */
	async bulkCreate(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Parse CSV data from uploaded file
				let entityTypesCSVData = await csv().fromString(req.files.entityTypes.data.toString())

				// Check if CSV data is valid and contains entity types
				if (!entityTypesCSVData || entityTypesCSVData.length < 1) {
					throw CONSTANTS.apiResponses.ENTITY_TYPE_NOT_CREATED
				}

				// Call 'entityTypesHelper.bulkCreate' to create multiple entity types from CSV data and user details
				const newEntityTypeData = await entityTypesHelper.bulkCreate(entityTypesCSVData, req.userDetails)

				// Check if entity types were created successfully
				if (newEntityTypeData.length > 0) {
					const fileName = `EntityType-Upload`
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
						newEntityTypeData.map(async (entityType) => {
							input.push(entityType)
						})
					)

					input.push(null)
				} else {
					throw CONSTANTS.apiResponses.PROJECT_FAILED
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
	 * Bulk update Entity Types.
	 * @api {get} /assessment/api/v1/entities/relatedEntities/update API by uploading CSV
	 * @apiVersion 1.0.0
	 * @apiName bulkUpdate
	 * @apiGroup Entities
	 * @apiSampleRequest /assessment/api/v1/entityTypes/bulkUpdate
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @apiParamExample {json} Response:
	 * @param {Object} req -request data.
	 * @param {Object} req.files.entityTypes -entityTypes data.
	 * @returns {CSV} Bulk update entity Types data.
	 */
	async bulkUpdate(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Parse CSV data from uploaded file
				let entityTypesCSVData = await csv().fromString(req.files.entityTypes.data.toString())

				// Check if CSV data is valid and contains entity types
				if (!entityTypesCSVData || entityTypesCSVData.length < 1) {
					throw CONSTANTS.apiResponses.ENTITY_TYPE_NOT_UPDATED
				}

				// Call 'entityTypesHelper.bulkUpdate' to update multiple entity types from CSV data and user details
				let newEntityTypeData = await entityTypesHelper.bulkUpdate(entityTypesCSVData, req.userDetails)

				// Check if entity types were updated successfully
				if (newEntityTypeData.length > 0) {
					const fileName = `EntityType-Upload`
					let fileStream = new FileStream(fileName)
					let input = fileStream.initStream()

					// Push each updated entity type into the file stream for processing
					;(async function () {
						await fileStream.getProcessorPromise()
						return resolve({
							isResponseAStream: true,
							fileNameWithPath: fileStream.fileNameWithPath(),
						})
					})()

					await Promise.all(
						newEntityTypeData.map(async (entityType) => {
							input.push(entityType)
						})
					)

					input.push(null)
				} else {
					throw CONSTANTS.apiResponses.ENTITY_TYPE_NOT_UPDATED
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
