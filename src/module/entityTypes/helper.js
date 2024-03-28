/**
 * name : helper.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : entities helper functionality.
 */

// Dependencies

const { v4: uuidv4 } = require('uuid')

// const entitiesHelper = require(MODULES_BASE_PATH + "/entities/helper")
const _ = require('lodash')
// const programUsersQueries = require(DB_QUERY_BASE_PATH + "/programUsers")

/**
 * UserProjectsHelper
 * @class
 */

module.exports = class UserProjectsHelper {
	static bulkCreate(entityTypesCSVData, userDetails) {
		return new Promise(async (resolve, reject) => {
			try {
				const entityTypesUploadedData = await Promise.all(
					entityTypesCSVData.map(async (entityType) => {
						try {
							entityType = gen.utils.valueParser(entityType)
							entityType.regsitryDetails = {}
							let removedKeys = []
							Object.keys(entityType).forEach(function (eachKey) {
								if (eachKey.startsWith('registry-')) {
									let newKey = eachKey.replace('registry-', '')
									entityType.regsitryDetails[newKey] = entityType[eachKey]
									removedKeys.push(entityType[eachKey])
								}
							})
							if (entityType.profileFields) {
								entityType.profileFields = entityType.profileFields.split(',') || []
							}

							if (
								entityType.immediateChildrenEntityType != '' &&
								entityType.immediateChildrenEntityType != undefined
							) {
								let entityTypeImmediateChildren = entityType.immediateChildrenEntityType.split(',')
								entityTypeImmediateChildren = _.uniq(entityTypeImmediateChildren)

								entityType.immediateChildrenEntityType = new Array()
								entityTypeImmediateChildren.forEach((immediateChildren) => {
									entityType.immediateChildrenEntityType.push(immediateChildren)
								})
							}

							if (entityType.isObservable) {
								entityType.isObservable = gen.utils.convertStringToBoolean(entityType.isObservable)
							}
							if (entityType.toBeMappedToParentEntities) {
								entityType.toBeMappedToParentEntities = gen.utils.convertStringToBoolean(
									entityType.toBeMappedToParentEntities
								)
							}

							if (removedKeys && removedKeys.length > 0) {
								for (var key in entityType) {
									for (var removedKey in removedKeys) {
										if (entityType.hasOwnProperty(removedKey)) {
											delete entityType[removedKey]
										}
									}
								}
							}
							let uniqId
							if (userDetails && userDetails.id) {
								uniqId = userDetails.id.toString()
							} else {
								uniqId = 'SYSTEM'
							}
							let newEntityType = await database.models.entityTypes.create(
								_.merge(
									{
										isDeleted: false,
										updatedBy: uniqId,
										createdBy: uniqId,
									},
									entityType
								)
							)

							delete entityType.regsitryDetails

							if (newEntityType._id) {
								entityType['_SYSTEM_ID'] = newEntityType._id
								entityType.status = 'Success'
							} else {
								entityType['_SYSTEM_ID'] = ''
								entityType.status = 'Failed'
							}
						} catch (error) {
							entityType['_SYSTEM_ID'] = ''
							entityType.status = error && error.message ? error.message : error
						}

						return entityType
					})
				)

				return resolve(entityTypesUploadedData)
			} catch (error) {
				return reject(error)
			}
		})
	}

	static bulkUpdate(entityTypesCSVData, userDetails) {
		return new Promise(async (resolve, reject) => {
			try {
				const entityTypesUploadedData = await Promise.all(
					entityTypesCSVData.map(async (entityType) => {
						try {
							entityType = gen.utils.valueParser(entityType)
							entityType.regsitryDetails = {}
							let removedKeys = []
							Object.keys(entityType).forEach(function (eachKey) {
								if (eachKey.startsWith('registry-')) {
									let newKey = eachKey.replace('registry-', '')
									entityType.regsitryDetails[newKey] = entityType[eachKey]
									removedKeys.push(entityType[eachKey])
								}
							})

							if (entityType.profileFields) {
								entityType.profileFields = entityType.profileFields.split(',') || []
							}

							if (entityType.immediateChildrenEntityType != '') {
								let entityTypeImmediateChildren = entityType.immediateChildrenEntityType.split(',')
								entityTypeImmediateChildren = _.uniq(entityTypeImmediateChildren)

								entityType.immediateChildrenEntityType = new Array()
								entityTypeImmediateChildren.forEach((immediateChildren) => {
									entityType.immediateChildrenEntityType.push(immediateChildren)
								})
							}

							if (entityType.isObservable) {
								entityType.isObservable = gen.utils.convertStringToBoolean(entityType.isObservable)
							}
							if (entityType.toBeMappedToParentEntities) {
								entityType.toBeMappedToParentEntities = gen.utils.convertStringToBoolean(
									entityType.toBeMappedToParentEntities
								)
							}

							if (removedKeys && removedKeys.length > 0) {
								for (var key in entityType) {
									for (var removedKey in removedKeys) {
										if (entityType.hasOwnProperty(removedKey)) {
											delete entityType[removedKey]
										}
									}
								}
							}
							let uniqId
							if (userDetails && userDetails.id) {
								uniqId = userDetails.id.toString()
							} else {
								uniqId = 'SYSTEM'
							}
							let updateEntityType = await database.models.entityTypes.findOneAndUpdate(
								{
									_id: ObjectId(entityType._SYSTEM_ID),
								},

								_.merge(
									{
										updatedBy: uniqId,
									},
									entityType
								)
							)

							delete entityType.regsitryDetails

							if (updateEntityType._id) {
								entityType['_SYSTEM_ID'] = updateEntityType._id
								entityType.status = 'Success'
							} else {
								entityType['_SYSTEM_ID'] = ''
								entityType.status = 'Failed'
							}
						} catch (error) {
							entityType['_SYSTEM_ID'] = ''
							entityType.status = error && error.message ? error.message : error
						}

						return entityType
					})
				)

				return resolve(entityTypesUploadedData)
			} catch (error) {
				return reject(error)
			}
		})
	}

	static list(queryParameter = 'all', projection = {}) {
		return new Promise(async (resolve, reject) => {
			try {
				if (queryParameter === 'all') {
					queryParameter = {}
				}

				let entityTypeData = await database.models.entityTypes.find(queryParameter, projection).lean()
                console.log(entityTypeData, "line no 216");
				return resolve(entityTypeData)
			} catch (error) {
				return reject(error)
			}
		})
	}
}
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
//                 ])

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
//                     })
//                 }
//             }

//             let result = await _projectInformation(projectDetails[0])

//             if (!result.success) {
//                 return resolve(result)
//             }

//             return resolve({
//                 success: true,
//                 message: CONSTANTS.apiResponses.PROJECT_DETAILS_FETCHED,
//                 data: result.data
//             })

//         } catch (error) {
//             return resolve({
//                 status:
//                     error.status ?
//                         error.status : HTTP_STATUS_CODE['internal_server_error'].status,
//                 success: false,
//                 message: error.message,
//                 data: []
//             })
//         }
//     })
// }
