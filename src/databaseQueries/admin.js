/**
 * name : admin.js
 * author : Mallanagouda R Biradar
 * created-date : 24-Apr-2025
 * Description : Admin related db queries
 */

// Dependencies
/**
 * Admin
 * @class
 */

module.exports = class Admin {
	/**
	 * list index.
	 * @method
	 * @name listIndices
	 * @param {String} [collectionName] - collection name.
	 * @returns {cursorObject} program details.
	 */

	static listIndices(collectionName) {
		return new Promise(async (resolve, reject) => {
			try {
				// Use Sequelize's internal model reference to call listIndexes on the collection
				let presentIndices = await database.models[collectionName].listIndexes()
				return resolve(presentIndices)
			} catch (error) {
				return reject(error)
			}
		})
	}

	/**
	 * create index
	 * @method
	 * @name createIndex
	 * @param {String} [collectionName] - collection name.
	 * @param {String} [key] - key to be indexed
	 * @returns {Object} success/failure object
	 */

	static createIndex(collectionName, key) {
		return new Promise(async (resolve, reject) => {
			try {
				// Use native MongoDB driver to create an ascending index on the specified key
				let createdIndex = await database.models[collectionName].db
					.collection(collectionName)
					.createIndex({ [key]: 1 })
				return resolve(createdIndex)
			} catch (error) {
				return reject(error)
			}
		})
	}
}
