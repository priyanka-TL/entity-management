/**
 * name : entityTypes.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : Entity Type related information.
 */

// Dependencies
const entityTypesHelper = require(MODULES_BASE_PATH + '/entityTypes/helper')
const csv = require('csvtojson')
const FileStream = require('../../generics/file-stream')

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

	list() {
		return new Promise(async (resolve, reject) => {
			try {
				let result = await entityTypesHelper.list('all', { name: 1 })

				return resolve({
					message: CONSTANTS.apiResponses.ENTITY_TYPES_FETCHED,
					result: result,
				})
			} catch (error) {
				return reject({
					status: error.status || httpStatusCode.internal_server_error.status,
					message: error.message || httpStatusCode.internal_server_error.message,
					errorObject: error,
				})
			}
		})
	}

	find(req) {
		return new Promise(async (resolve, reject) => {
			try {
				let result = await entityTypesHelper.list(req.body.query, req.body.projection, req.body.skipFields)

				return resolve({
					message: CONSTANTS.apiResponses.ENTITY_TYPES_FETCHED,
					result: result,
				})
			} catch (error) {
				return reject({
					status: error.status || httpStatusCode.internal_server_error.status,
					message: error.message || httpStatusCode.internal_server_error.message,
					errorObject: error,
				})
			}
		})
	}

	async bulkCreate(req) {
		console.log(req.files, 'line no 117')
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
					throw CONSTANTS.apiResponses.PROJECT_NOT_FOUND
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

	async bulkUpdate(req) {
		console.log(req.files, 'line no 132')
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
					throw CONSTANTS.apiResponses.PROJECT_NOT_FOUND
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
