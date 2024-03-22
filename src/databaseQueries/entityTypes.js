/**
 * name : entityTypes.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : EntityTypes helper for DB interactions.
 */

// Dependencies 

/**
    * entityTypes
    * @class
*/



module.exports = class EntityTypes {
    /**
     * Solution details.
     * @method
     * @name entityTypesDocument
     * @param {Array} [filterData = "all"] - entityTypes filter query.
     * @param {Array} [fieldsArray = "all"] - projected fields.
     * @param {Array} [skipFields = "none"] - field not to include
     * @returns {Array} entityTypes details.
     */

    static entityTypesDocument(
        filterData = "all",
        fieldsArray = "all",
        skipFields = "none"
    ) {
        return new Promise(async (resolve, reject) => {
            try {
                let queryObject = (filterData != "all") ? filterData : {}
                let projection = {}

                if (fieldsArray != "all") {
                    fieldsArray.forEach(field => {
                        projection[field] = 1
                    })
                }

                if (skipFields !== "none") {
                    skipFields.forEach(field => {
                        projection[field] = 0
                    })
                }
                let entityTypesDoc =
                    await database.models.entityTypes.find(
                        queryObject,
                        projection
                    ).lean()

                return resolve(entityTypesDoc)

            } catch (error) {
                return reject(error)
            }
        })
    }

    /**
    * Update entityTypes document.
    * @method
    * @name updateEntityTypesDocument
    * @param {Object} query - query to find document
    * @param {Object} updateObject - fields to update
    * @returns {String} - message.
    */

    static updateEntityTypesDocument(query = {}, updateObject = {}) {
        return new Promise(async (resolve, reject) => {
            try {

                if (Object.keys(query).length == 0) {
                    throw new Error(messageConstants.apiResponses.UPDATE_QUERY_REQUIRED)
                }

                if (Object.keys(updateObject).length == 0) {
                    throw new Error(messageConstants.apiResponses.UPDATE_OBJECT_REQUIRED)
                }

                let updateResponse = await database.models.solutions.updateOne
                    (
                        query,
                        updateObject
                    )

                if (updateResponse.nModified == 0) {
                    throw new Error(CONSTANTS.apiResponses.FAILED_TO_UPDATE)
                }

                return resolve({
                    success: true,
                    message: CONSTANTS.apiResponses.UPDATED_DOCUMENT_SUCCESSFULLY,
                    data: true
                })

            } catch (error) {
                return resolve({
                    success: false,
                    message: error.message,
                    data: false
                })
            }
        })
    }
}