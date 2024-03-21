/**
 * name : entities.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : Entity Type related information.
 */

// Dependencies
const entitiesHelper = require(MODULES_BASE_PATH + "/entities/helper");

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
   * List all the entities.
   * @method
   * @name list 
   * @returns {JSON} - List of all entities.
   */

  async list(req) {
    return new Promise(async (resolve, reject) => {
      try {

        let result = await entitiesHelper.list("all", { name: 1 });

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