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
* @apiName Entity Type list
* @apiGroup Entity Types
* @apiHeader {String} X-authenticated-user-token Authenticity token
* @apiSampleRequest /assessment/api/v1/entityTypes/list
* @apiUse successBody
* @apiUse errorBody
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

	/**
	 * List all the entity types.
	 * @method
	 * @name list
	 * @returns {JSON} - List of all entity types.
	 */

	async list() {
		return new Promise(async (resolve, reject) => {
			try {
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
	 * @method
	 * @name find
	 * @returns {JSON} - List of all entity types.
	 */
	async find(req) {
		return new Promise(async (resolve, reject) => {
			try {
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
	 * @method
	 * @name bulkCreate
	 * @param {Object} req -request data.
	 * @param {Object} req.files.entityTypes -entityTypes data.
	 * @returns {CSV}  create single  entity Types data.
	 */

	async create(req) {
		return new Promise(async (resolve, reject) => {
			try {
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
   * @method
   * @name update
   * @param {Object} req - requested entityType data.
   * @param {String} req.query.type - entityType type.
   * @param {String} req.params._id - entityType id.
   * @param {Object} req.body - entityType information that need to be updated.       
   * @returns {JSON} - Updated entityType information.
   */

	update(req) {
		return new Promise(async (resolve, reject) => {
		  try {
			let result = await entityTypesHelper.update( req.params._id, req.body,req.userDetails.userInformation);
	
			return resolve(result);
	
		  } catch (error) {
	
			return reject({
			  status: error.status || HTTP_STATUS_CODE.internal_server_error.status,
			  message: error.message || HTTP_STATUS_CODE.internal_server_error.message,
			  errorObject: error
			})
	
		  }
	
	
		})
	  }

	/**
	 * Bulk create Entity Types.
	 * @method
	 * @name bulkCreate
	 * @param {Object} req -request data.
	 * @param {Object} req.files.entityTypes -entityTypes data.
	 * @returns {CSV} Bulk create entity Types data.
	 */
	async bulkCreate(req) {
		return new Promise(async (resolve, reject) => {
			try {
				let entityTypesCSVData = await csv().fromString(req.files.entityTypes.data.toString())
				if (!entityTypesCSVData || entityTypesCSVData.length < 1) {
					throw CONSTANTS.apiResponses.ENTITY_TYPE_NOT_CREATED
				}
				const newEntityTypeData = await entityTypesHelper.bulkCreate(entityTypesCSVData, req.userDetails)

				if (newEntityTypeData.length > 0) {
					const fileName = `EntityType-Upload`
					let fileStream = new FileStream(fileName)
					let input = fileStream.initStream()

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
	 * @method
	 * @name bulkUpdate
	 * @param {Object} req -request data.
	 * @param {Object} req.files.entityTypes -entityTypes data.
	 * @returns {CSV} Bulk update entity Types data.
	 */
	async bulkUpdate(req) {
		return new Promise(async (resolve, reject) => {
			try {
				let entityTypesCSVData = await csv().fromString(req.files.entityTypes.data.toString())
				if (!entityTypesCSVData || entityTypesCSVData.length < 1) {
					throw CONSTANTS.apiResponses.ENTITY_TYPE_NOT_UPDATED
				}
				let newEntityTypeData = await entityTypesHelper.bulkUpdate(entityTypesCSVData, req.userDetails)

				if (newEntityTypeData.length > 0) {
					const fileName = `EntityType-Upload`
					let fileStream = new FileStream(fileName)
					let input = fileStream.initStream()

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
