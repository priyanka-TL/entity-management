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
				let entityData = await entitiesHelper.entityDocuments(req.body.query, req.body.projection)

				return resolve({
					message: CONSTANTS.apiResponses.ENTITY_FETCHED,
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


	details(req) {
		console.log(req.query.type,"line no 89");
		console.log(req.params._id,"line no 90");
		return new Promise(async (resolve, reject) => {
	
		  try {
	
			let result = await entitiesHelper.details(
			  req.query.type, 
			  req.params._id
			);
	
			return resolve({
			  message: CONSTANTS.apiResponses.ENTITY_INFORMATION_FETCHED,
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
	

	async create(req) {
		return new Promise(async (resolve, reject) => {
			try {
				let result = await entitiesHelper.create(req.body, req.userDetails)
				return resolve({
					message: CONSTANTS.apiResponses.ENTITY_ADDED,
					result: result,
				})
			} catch (error) {
				console.log(error,"line no 130");
				return reject({
					status: error.status || HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message || HTTP_STATUS_CODE.internal_server_error.message,
					errorObject: error,
				})
			}
		})
	}


	update(req) {
		return new Promise(async (resolve, reject) => {
		  try {
			let result = await entitiesHelper.update( req.params._id, req.body);
	
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
	listByEntityType(req) {
		return new Promise(async (resolve, reject) => {
			try {
				let schemaMetaInformation = entitiesHelper.entitiesSchemaData().SCHEMA_METAINFORMATION
				let projection = [
					schemaMetaInformation + '.externalId',
					schemaMetaInformation + '.name',
					'registryDetails.locationId',
				]


				let skippingValue = req.pageSize * (req.pageNo - 1)
				let entityDocuments = await entitiesHelper.entityDocuments(
					{
						entityTypeId : ObjectId(req.params._id) ,
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

				return resolve({
					message: CONSTANTS.apiResponses.ENTITY_FETCHED,
					result: entityDocuments,
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

bulkUpdate(req) {
    return new Promise(async (resolve, reject) => {

      try {

        let entityCSVData = await csv().fromString(req.files.entityTypes.data.toString());
        
        let newEntityData = await entitiesHelper.bulkUpdate(
          req.userDetails, 
          entityCSVData
        );

        if (newEntityData.length > 0) {

          const fileName = `Entity-Upload`;
          let fileStream = new FileStream(fileName);
          let input = fileStream.initStream();

          (async function () {
            await fileStream.getProcessorPromise();
            return resolve({
              isResponseAStream: true,
              fileNameWithPath: fileStream.fileNameWithPath()
            });
          }());

          await Promise.all(newEntityData.map(async newEntity => {
            input.push(newEntity);
          }))

          input.push(null);

        } else {
          throw new Error(CONSTANTS.apiResponses.SOMETHING_WENT_WRONG);
        }

      } catch (error) {

        return reject({
          status: error.status || HTTP_STATUS_CODE.internal_server_error.status,
          message: error.message || HTTP_STATUS_CODE.internal_server_error.message,
          errorObject: error
        })

      }


    })
}
}
