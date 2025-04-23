/**
 * name : userRoleExtension.js
 * author : Mallanagouda R Biradar
 * created-date : 30-july-2024
 * Description : user role controller function.
 */

// Dependencies
const userRoleExtensionHelper = require(MODULES_BASE_PATH + '/userRoleExtension/helper')

/**
 * userRoleExtension
 * @class
 */

module.exports = class userRoleExtension extends Abstract {
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
		super('userRoleExtension')
	}

	static get name() {
		return 'userRoleExtension'
	}

	/**
	 *  create user role.
	 * @api {POST} /v1/userRoleExtension/create API's
	 * @apiVersion 1.0.0
	 * @apiName create
	 * @apiGroup userRoleExtension
	 * @apiSampleRequest /v1/userRoleExtension/create
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @param {Object} req - The request object containing the request body and user details.
     * @param {Object} req.body - The data for creating a new user role extension.
     * @param {Object} req.userDetails - The details of the user making the request.
     * @returns {Promise<Object>} - A promise that resolves with the result of the creation or rejects with an error.
	 * 
	 * {
    "message": "USER_ROLE_INFORMATION_CREATED",
    "status": 200,
    "result": {
        "status": "ACTIVE",
        "createdBy": "SYSTEM",
        "updatedBy": "SYSTEM",
        "_id": "66a8dfc44efa6ccce9113db5",
        "deleted": false,
        "userRoleId": 13,
        "title": "EducationMinister",
        "entityTypes": [
            {
                "_id": "66a8dfc44efa6ccce9113db6",
                "entityType": "state",
                "entityTypeId": "5f32d8228e0dc8312404056e"
            }
        ],
        "updatedAt": "2024-07-30T12:42:44.381Z",
        "createdAt": "2024-07-30T12:42:44.381Z",
        "__v": 0
    }
    }
	*/
	create(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Call the helper function to create a new user role extension document
				let result = await userRoleExtensionHelper.create(req.body)

				// Resolve the promise with the result of the creation operation
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
	 * Update user role information.
	 * @api {POST} /v1/userRoleExtension/update single user role
	 * @apiVersion 1.0.0
	 * @apiName update
	 * @apiGroup userRoleExtension
	 * @apiHeader {String} X-authenticated-user-token Authenticity token
	 * @apiSampleRequest /v1/userRoleExtension/update/663364443c990eaa179e289e
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @param {Object} req - The request object containing the request parameters and body.
     * @param {Object} req.params - The request parameters.
     * @param {string} req.params._id - The ID of the user role extension to update.
     * @param {Object} req.body - The data for updating the user role extension.
     * @returns {Promise<Object>} - A promise that resolves with the result of the update or rejects with an error.
	 * 
	 *  
	{
    "message": "USER_ROLE_UPDATED",
    "status": 200,
    "result": {
        "status": "ACTIVE",
        "createdBy": "SYSTEM",
        "updatedBy": "SYSTEM",
        "deleted": false,
        "_id": "66a8cd21ea22bf3e86e2939b",
        "userRoleId": 1,
        "title": "BEO",
        "entityTypes": [
            {
                "_id": "66a8cd21ea22bf3e86e2939c",
                "entityTypeId": "5f32d8228e0dc8312404056e",
                "entityType": "state"
            }
        ],
        "updatedAt": "2024-07-30T12:00:03.303Z",
        "createdAt": "2024-07-30T11:23:13.062Z",
        "__v": 0
    }
    }
	*/
	update(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Call the helper function to update the user role extension document
				let result = await userRoleExtensionHelper.update(req.params._id, req.body)

				// Resolve the promise with the result of the update operation
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
	 * Find all the user role based on the projection.
	 * @api {POST} /v1/userRoleExtension/find all the API based on projection
	 * @apiVersion 1.0.0
	 * @apiName find
	 * @apiGroup userRoleExtension
	 * @apiSampleRequest {
		{
        "query": {
        "entityTypes.entityTypeId": {
            "$in": [
                "5f32d8228e0dc8312404056b",
                "5f32d8228e0dc8312404056c",
                "5f32d8228e0dc83124040567",
                "5f32d8228e0dc8312404056e"
            ]
        }
    },
    "projection": [
        "_id", "title"
    ]
    }
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @apiParamExample {json} Response:
	 * @returns {JSON} - List of all user roles.
	 *  {
    "message": "ASSETS_FETCHED_SUCCESSFULLY",
    "status": 200,
    "result": [
        {
            "_id": "66a8df494efa6ccce9113da6",
            "title": "headmaster"
        },
        {
            "_id": "66a8df824efa6ccce9113dac",
            "title": "BEO"
        },
        {
            "_id": "66a8df654efa6ccce9113da9",
            "title": "AMO"
        },
        {
            "_id": "66a8dfc44efa6ccce9113db5",
            "title": "EducationMinister"
        }
    ]
    }
	 */
	find(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Call the helper function to find the user role extensions
				let userData = await userRoleExtensionHelper.find(req.body.query, req.body.projection)
				// Resolve the promise with the found user role extensions
				return resolve(userData)
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
	 * Delete user role information.
	 * @api {DELETE} /v1/userRoleExtension/delete single user role
	 * @apiVersion 1.0.0
	 * @apiName delete
	 * @apiGroup userRoleExtension
	 * @apiHeader {String} X-authenticated-user-token Authenticity token
	 * @apiSampleRequest /v1/userRoleExtension/delete/663364443c990eaa179e289e
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @param {Object} req - The request object containing the request body.
     * @param {Object} req.body - The request body.
     * @param {Object} req.body.query - The query object to filter user role extensions.
     * @param {Array} req.body.projection - The projection array to specify which fields to include in the result.
     * @returns {Promise<Object>} - A promise that resolves with the user data or rejects with an error.
	 * 
	 *  
	{
    "message": "USER_ROLE_DELETED",
    "status": 200
     }
	*/
	delete(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Call the helper function to delete the user role extension by ID
				let userData = await userRoleExtensionHelper.delete(req.params._id)
				// Resolve the promise with the result of the deletion
				return resolve(userData)
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
