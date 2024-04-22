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
const entitiesQueries = require('../../databaseQueries/entities')

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
* @api {get} /entity/api/v1/entities/list List all entities
* @apiVersion 1.0.0
* @apiName Entities list
* @apiGroup Entities
* @apiHeader {String} X-authenticated-user-token Authenticity token
* @apiSampleRequest /entity/api/v1/entities/list
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
	 * Find all the entities.
	 * @method
	 * @name find
	 * @returns {JSON} - List of all entities.
	 */

	find(req) {
		return new Promise(async (resolve, reject) => {
			try {
				let entityData = await entitiesQueries.entityDocuments(req.body.query, req.body.projection)
				return resolve({
					success: true,
					message: CONSTANTS.apiResponses.ASSETS_FETCHED_SUCCESSFULLY,
					result: entityData,
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

	relatedEntities(req) {
		return new Promise(async (resolve, reject) => {
			try {
				let result = {}

				let relatedEntities = await entitiesHelper.relatedEntities(req.params._id)
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

	mappingUpload(req) {
		return new Promise(async (resolve, reject) => {
			try {
				let entityCSVData = await csv().fromString(req.files.entityMap.data.toString())

				let entityMappingUploadResponse = await entitiesHelper.processEntityMappingUploadData(entityCSVData)
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
	 * details of the entities.
	 * @method
	 * @name details
	 * @returns {JSON} - provide the details.
	 */

	details(req) {
		return new Promise(async (resolve, reject) => {
			try {
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
	 * @method
	 * @name update
	 * @param {Object} req - requested entity data.
	 * @param {String} req.query.type - entity type.
	 * @param {String} req.params._id - entity id.
	 * @param {Object} req.body - entity information that need to be updated.
	 * @returns {JSON} - Updated entity information.
	 */

	update(req) {
		return new Promise(async (resolve, reject) => {
			try {
				let result = await entitiesHelper.update(req.params._id, req.body)

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
	 * Add entities.
	 * @method
	 * @name add
	 * @param {Object} req - All requested Data.
	 * @param {Object} req.files - requested files.
	 * @returns {JSON} - Added entities information.
	 */

	add(req) {
		return new Promise(async (resolve, reject) => {
			try {
				let queryParams = {
					type: req.query.type,
					// programId: req.query.programId,
					//   solutionId: req.query.solutionId,
					parentEntityId: req.query.parentEntityId,
				}
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
	 * @method
	 * @name listByLocationIds
	 * @param {Object} req - requested data.
	 * @param {Object} req.body.locationIds - registry data.
	 * @returns {Object} -
	 */

	listByLocationIds(req) {
		return new Promise(async (resolve, reject) => {
			try {
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
	 * @method
	 * @name subEntitiesRoles
	 * @param {String} req.params._id - entityId.
	 * @returns {JSON} - Entities child hierarchy path
	 */

	subEntityListBasedOnRoleAndLocation(req) {
		return new Promise(async (resolve, reject) => {
			try {
				let currentMaximumCountOfRequiredEntities = 0
				let subEntityTypeListData = new Array()
				let data = req.userDetails.userInformation.entityTypes
				for (let roleCount = 0; roleCount < data.split(',').length; roleCount++) {
					const eachRole = data.split(',')[roleCount]
					const entityTypeMappingData = await entitiesHelper.subEntityListBasedOnRoleAndLocation(
						req.params._id,
						eachRole
					)

					if (
						entityTypeMappingData.result &&
						entityTypeMappingData.result.length > currentMaximumCountOfRequiredEntities
					) {
						currentMaximumCountOfRequiredEntities = entityTypeMappingData.result.length
						subEntityTypeListData = entityTypeMappingData
						subEntityTypeListData.result = entityTypeMappingData.result
					}
				}

				return resolve(subEntityTypeListData)
			} catch (error) {
				return reject({
					status: error.status || HTTP_STATUS_CODE['internal_server_error'].status,

					message: error.message || HTTP_STATUS_CODE['internal_server_error'].message,
				})
			}
		})
	}

	/**
	 * List of entities by entityType.
	 * @method
	 * @name listByEntityType
	 * @param {Object} req - requested data.
	 * @param {String} req.params._id - requested entity type.
	 * @returns {JSON} - Array of entities.
	 */
	
	listByEntityType(req, res) {
		return new Promise(async (resolve, reject) => {
			try {
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
	 * List entities.
	 * @method
	 * @name list
	 * @param {Object} req - requested entity information.
	 * @param {String} req.query.type - type of entity requested.
	 * @param {String} req.params._id - requested entity id.
	 * @param {Number} req.pageSize - total size of the page.
	 * @param {Number} req.pageNo - page number.
	 * @param {string} req.query.schoolTypes - comma seperated school types.
	 * @param {string} req.query.administrationTypes - comma seperated administration types.
	 * @returns {JSON} - Listed entity details.
	 */

	list(req) {
		return new Promise(async (resolve, reject) => {
			try {
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
	 * Bulk create entities.
	 * @method
	 * @name bulkCreate
	 * @param {Object} req - requested data.
	 * @param {String} req.query.type - requested entity type.
	 * @param {Object} req.userDetails - logged in user details.
	 * @param {Object} req.files.entities - entities data.
	 * @returns {CSV} - A CSV with name Entity-Upload is saved inside the folder
	 * public/reports/currentDate
	 */

	bulkCreate(req) {
		return new Promise(async (resolve, reject) => {
			try {
				let entityCSVData = await csv().fromString(req.files.entities.data.toString())
				let newEntityData = await entitiesHelper.bulkCreate(
					req.query.type,
					null,
					null,
					req.userDetails,
					entityCSVData
				)

				if (newEntityData.length > 0) {
					const fileName = `Entity-Upload`
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
	 * @method
	 * @name bulkUpdate
	 * @param {Object} req - requested data.
	 * @param {Object} req.userDetails - logged in user details.
	 * @param {Object} req.files.entities - entities data.
	 * @returns {CSV} - A CSV with name Entity-Upload is saved inside the folder
	 * public/reports/currentDate
	 */

	bulkUpdate(req) {
		return new Promise(async (resolve, reject) => {
			try {
				let entityCSVData = await csv().fromString(req.files.entities.data.toString())
				if (!entityCSVData || entityCSVData.length < 1) {
					throw CONSTANTS.apiResponses.ENTITY_TYPE_NOT_UPDATED
				}
				let newEntityData = await entitiesHelper.bulkUpdate(entityCSVData, req.userDetails)

				if (newEntityData.length > 0) {
					const fileName = `Entity-Upload`
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
