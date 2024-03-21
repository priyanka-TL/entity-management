/**
 * name : entityTypes.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : Entity Type related information.
 */

// Dependencies
const entityTypesHelper = require(MODULES_BASE_PATH + "/entityTypes/helper");

/**
   * entityType
   * @class
*/

module.exports = class entityTypes extends Abstract {

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
        super("entityTypes");
    }

    static get name() {
        return "entityTypes";
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

    async list(req) {
        return new Promise(async (resolve, reject) => {
            try {

                let result = await entityTypesHelper.list("all", { name: 1 });

                return resolve(result);

            } catch (error) {
                return reject({
                    status: error.status || HTTP_STATUS_CODE.internal_server_error.status,
                    message: error.message || HTTP_STATUS_CODE.internal_server_error.message,
                    errorObject: error
                });
            }
        })
    }
};