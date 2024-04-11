/**
 * name : entityTypes.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : Entity Type related information.
 */

// Dependencies
const entityTypesHelper = require(MODULES_BASE_PATH + '/entityTypes/helper')
const csv = require('csvtojson')
const { bulkAdd } = require('../../module/entityTypes/helper')
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
		console.log(req.body, 'line no 108')
		return new Promise(async (resolve, reject) => {
			try {
				let result = await entityTypesHelper.create(req.body, req.userDetails)
				return resolve({
					message: CONSTANTS.apiResponses.ENTITY_ADDED,
					result: result,
				})
			} catch (error) {
				console.log(error, 'line no 129')
				return reject({
					status: error.status || HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message || HTTP_STATUS_CODE.internal_server_error.message,
					errorObject: error,
				})
			}
		})
	}

	update(req) {
		console.log(req.params._id,"line no 138");
		console.log(req.body, "line no 139");
		return new Promise(async (resolve, reject) => {
		  try {
			let result = await entityTypesHelper.update( req.params._id, req.body);
	
			return resolve({
			  message: CONSTANTS.apiResponses.ENTITY_INFORMATION_UPDATE,
			  result: result
			});
	
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
					throw CONSTANTS.apiResponses.PROJECT_NOT_FOUND
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
					throw CONSTANTS.apiResponses.PROJECT_NOT_CREATED
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
					throw CONSTANTS.apiResponses.PROJECT_NOT_FOUND
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
					throw CONSTANTS.apiResponses.PROJECT_NOT_UPDATED
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
