/**
 * name : globals.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : Globals data.
 */

// dependencies

require('module-alias/register')
const fs = require('fs')
const path = require('path')
const requireAll = require('require-all')

module.exports = function () {
	global.async = require('async')
	global.PROJECT_ROOT_DIRECTORY = path.join(__dirname, '..')
	global.MODULES_BASE_PATH = '@module'
	global.DB_QUERY_BASE_PATH = '@dbQueries'
	global.GENERICS_FILES_PATH = '@generics'
	global.GENERIC_HELPERS_PATH = '@helpers'
	global._ = require('lodash')
	global.UTILS = require('@helpers/utils')
	global.cache = require('@helpers/cache')

	global.CSV_FILE_STREAM = require('@generics/file-stream')
	require('./connections')

	global.HTTP_STATUS_CODE = require('@generics/http-status-codes')

	// Load database models.
	global.models = requireAll({
		dirname: path.resolve('models'),
		filter: /(.+)\.js$/,
		resolve: (Model) => Model,
	})

	// Load base v1 controllers
	const pathToController = path.resolve('controllers/v1/')
	try {
		fs.readdirSync(pathToController).forEach((file) => {
			checkWhetherFolderExistsOrNot(pathToController, `/${file}`)
		})
	} catch (error) {
		console.error('Error reading files:', error)
	}

	/**
	 * Check whether folder exists or Not.
	 * @method
	 * @name checkWhetherFolderExistsOrNot
	 * @param {String} pathToFolder - path to folder.
	 * @param {String} file - File name.
	 */
	function checkWhetherFolderExistsOrNot(pathToFolder, file) {
		let folderExists = fs.lstatSync(pathToFolder + file).isDirectory()
		if (folderExists) {
			fs.readdirSync(pathToFolder + file).forEach(function (folderOrFile) {
				checkWhetherFolderExistsOrNot(pathToFolder + file + '/', folderOrFile)
			})
		} else {
			if (file.match(/\.js$/) !== null) {
				require(pathToFolder + file)
			}
		}
	}

	// Schema for db.
	global.schemas = new Array()
	fs.readdirSync(path.resolve('models')).forEach(function (file) {
		if (file.match(/\.js$/) !== null) {
			const name = file.replace('.js', '')
			global.schemas[name] = require(path.resolve('models', file))
		}
	})

	// All controllers
	global.controllers = requireAll({
		dirname: path.resolve('controllers'),
		resolve: (Controller) => new Controller(),
	})

	// Message constants
	global.CONSTANTS = new Array()
	fs.readdirSync(path.resolve('generics/constants')).forEach(function (file) {
		if (file.match(/\.js$/) !== null) {
			let name = file.replace('.js', '')
			name = UTILS.hyphenCaseToCamelCase(name)
			global.CONSTANTS[name] = require(path.resolve('generics/constants', file))
		}
	})
}
