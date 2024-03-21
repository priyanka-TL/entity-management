/**
 * name : helper.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : entities helper functionality.
 */

// Dependencies


const { v4: uuidv4 } = require('uuid');

// const entitiesHelper = require(MODULES_BASE_PATH + "/entities/helper");
const _ = require("lodash");
// const programUsersQueries = require(DB_QUERY_BASE_PATH + "/programUsers");

/**
    * UserProjectsHelper
    * @class
*/

module.exports = class UserProjectsHelper {

    // /**
    //  * Project details.
    //  * @method
    //  * @name details 
    //  * @param {String} projectId - project id.
    //  * @returns {Object} 
    // */

    // static details(projectId, userId,userRoleInformation = {}) {
    //     return new Promise(async (resolve, reject) => {
    //         try {

    //             const projectDetails = await projectQueries.projectDocument({
    //                 _id: projectId,
    //                 userId: userId
    //             }, "all",
    //                 [
    //                     "taskReport",
    //                     "projectTemplateId",
    //                     "projectTemplateExternalId",
    //                     "userId",
    //                     "createdBy",
    //                     "updatedBy",
    //                     "createdAt",
    //                     "updatedAt",
    //                     "userRoleInformation",
    //                     "__v"
    //                 ]);

    //             if (!projectDetails.length > 0) {

    //                 throw {
    //                     status: HTTP_STATUS_CODE["bad_request"].status,
    //                     message: CONSTANTS.apiResponses.PROJECT_NOT_FOUND
    //                 }
    //             }

    //             if (Object.keys(userRoleInformation).length > 0) {

    //                 if (!projectDetails[0].userRoleInformation || !Object.keys(projectDetails[0].userRoleInformation).length > 0) {
    //                     await projectQueries.findOneAndUpdate({
    //                         _id: projectId
    //                     },{
    //                         $set: {userRoleInformation: userRoleInformation}
    //                     });
    //                 }
    //             }

    //             let result = await _projectInformation(projectDetails[0]);

    //             if (!result.success) {
    //                 return resolve(result);
    //             }


    //             return resolve({
    //                 success: true,
    //                 message: CONSTANTS.apiResponses.PROJECT_DETAILS_FETCHED,
    //                 data: result.data
    //             });

    //         } catch (error) {
    //             return resolve({
    //                 status:
    //                     error.status ?
    //                         error.status : HTTP_STATUS_CODE['internal_server_error'].status,
    //                 success: false,
    //                 message: error.message,
    //                 data: []
    //             });
    //         }
    //     })
    // }

};




