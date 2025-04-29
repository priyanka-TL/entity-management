/**
 * name : admin.js
 * author : Mallanagouda R Biradar
 * created-date : 24-Apr-2025
 * Description : Admin related information.
 */

// Dependencies
const adminHelper = require(MODULES_BASE_PATH + '/admin/helper')

module.exports = class Admin {
	static get name() {
		return 'admin'
	}

	/**
	 * Indexing specified keys in a model
	 * @method
	 * @name createIndex
	 * @param {Object} req - requested data.
	 * @param {String} req.params._id - collection name.
	 * @param {Array} req.body.keys - keys to be indexed.
	 * @returns {Object} success/failure message.
	 */

	async createIndex(req) {
		return new Promise(async (resolve, reject) => {
			try {
				// Extract the name of the collection from route params
				let collection = req.params._id
				// Extract the keys on which the index needs to be created from request body
				let keys = req.body.keys

				// Call helper function to create the index on the given collection with the provided keys
				const isIndexed = await adminHelper.createIndex(collection, keys)

				// Resolve the promise with the result (true/false or index details)
				return resolve(isIndexed)
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
