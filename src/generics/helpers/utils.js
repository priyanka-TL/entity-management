/**
 * name : utils.js
 * author : Aman Karki
 * Date : 13-July-2020
 * Description : All utility functions.
 */
// Dependencies
const { validate: uuidValidate, v4: uuidV4 } = require('uuid')
/**
 * convert camel case to title case.
 * @function
 * @name camelCaseToTitleCase
 * @param {String} in_camelCaseString - String of camel case.
 * @returns {String} returns a titleCase string. ex: helloThereMister, o/p: Hello There Mister
 */

function camelCaseToTitleCase(in_camelCaseString) {
	var result = in_camelCaseString // "ToGetYourGEDInTimeASongAboutThe26ABCsIsOfTheEssenceButAPersonalIDCardForUser456InRoom26AContainingABC26TimesIsNotAsEasyAs123ForC3POOrR2D2Or2R2D"
		.replace(/([a-z])([A-Z][a-z])/g, '$1 $2') // "To Get YourGEDIn TimeASong About The26ABCs IsOf The Essence ButAPersonalIDCard For User456In Room26AContainingABC26Times IsNot AsEasy As123ForC3POOrR2D2Or2R2D"
		.replace(/([A-Z][a-z])([A-Z])/g, '$1 $2') // "To Get YourGEDIn TimeASong About The26ABCs Is Of The Essence ButAPersonalIDCard For User456In Room26AContainingABC26Times Is Not As Easy As123ForC3POOr R2D2Or2R2D"
		.replace(/([a-z])([A-Z]+[a-z])/g, '$1 $2') // "To Get Your GEDIn Time ASong About The26ABCs Is Of The Essence But APersonal IDCard For User456In Room26AContainingABC26Times Is Not As Easy As123ForC3POOr R2D2Or2R2D"
		.replace(/([A-Z]+)([A-Z][a-z][a-z])/g, '$1 $2') // "To Get Your GEDIn Time A Song About The26ABCs Is Of The Essence But A Personal ID Card For User456In Room26A ContainingABC26Times Is Not As Easy As123ForC3POOr R2D2Or2R2D"
		.replace(/([a-z]+)([A-Z0-9]+)/g, '$1 $2') // "To Get Your GEDIn Time A Song About The 26ABCs Is Of The Essence But A Personal ID Card For User 456In Room 26A Containing ABC26Times Is Not As Easy As 123For C3POOr R2D2Or 2R2D"

		// Note: the next regex includes a special case to exclude plurals of acronyms, e.g. "ABCs"
		.replace(/([A-Z]+)([A-Z][a-rt-z][a-z]*)/g, '$1 $2') // "To Get Your GED In Time A Song About The 26ABCs Is Of The Essence But A Personal ID Card For User 456In Room 26A Containing ABC26Times Is Not As Easy As 123For C3PO Or R2D2Or 2R2D"
		.replace(/([0-9])([A-Z][a-z]+)/g, '$1 $2') // "To Get Your GED In Time A Song About The 26ABCs Is Of The Essence But A Personal ID Card For User 456In Room 26A Containing ABC 26Times Is Not As Easy As 123For C3PO Or R2D2Or 2R2D"

		// Note: the next two regexes use {2,} instead of + to add space on phrases like Room26A and 26ABCs but not on phrases like R2D2 and C3PO"
		.replace(/([A-Z]{2,})([0-9]{2,})/g, '$1 $2') // "To Get Your GED In Time A Song About The 26ABCs Is Of The Essence But A Personal ID Card For User 456 In Room 26A Containing ABC 26 Times Is Not As Easy As 123 For C3PO Or R2D2 Or 2R2D"
		.replace(/([0-9]{2,})([A-Z]{2,})/g, '$1 $2') // "To Get Your GED In Time A Song About The 26 ABCs Is Of The Essence But A Personal ID Card For User 456 In Room 26A Containing ABC 26 Times Is Not As Easy As 123 For C3PO Or R2D2 Or 2R2D"
		.trim()

	// capitalize the first letter
	return result.charAt(0).toUpperCase() + result.slice(1)
}

/**
 * Convert hyphen case string to camelCase.
 * @function
 * @name hyphenCaseToCamelCase
 * @param {String} string - String in hyphen case.
 * @returns {String} returns a camelCase string.
 */

function hyphenCaseToCamelCase(string) {
	return string.replace(/-([a-z])/g, function (g) {
		return g[1].toUpperCase()
	})
}

/**
 * convert string to lowerCase.
 * @function
 * @name lowerCase
 * @param {String} str
 * @returns {String} returns a lowercase string. ex: HELLO, o/p: hello
 */

function lowerCase(str) {
	return str.toLowerCase()
}

/**
 * check whether the given string is url.
 * @function
 * @name checkIfStringIsUrl - check whether string is url or not.
 * @param {String} str
 * @returns {Boolean} returns a Boolean value. ex:"http://example.com:3000/pathname/?search=test" , o/p:true
 */

function checkIfStringIsUrl(str) {
	var pattern = new RegExp(
		'^(https?:\\/\\/)?' + // protocol
			'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
			'((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
			'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
			'(\\?[&a-z\\d%_.~+=-]*)?' + // query string
			'(\\#[-a-z\\d_]*)?$',
		'i'
	) // fragment locator
	return pattern.test(str)
}

/**
 * Parse a single column.
 * @function
 * @name valueParser - Parse value
 * @param {String} dataToBeParsed - data to be parsed.
 * @returns {Object} returns parsed data
 */

function valueParser(dataToBeParsed) {
	let parsedData = {}

	Object.keys(dataToBeParsed).forEach((eachDataToBeParsed) => {
		parsedData[eachDataToBeParsed] = dataToBeParsed[eachDataToBeParsed].trim()
	})

	if (parsedData._arrayFields && parsedData._arrayFields.split(',').length > 0) {
		parsedData._arrayFields.split(',').forEach((arrayTypeField) => {
			if (parsedData[arrayTypeField]) {
				parsedData[arrayTypeField] = parsedData[arrayTypeField].split(',')
			}
		})
	}

	return parsedData
}

/**
 * Convert string to boolean.
 * @method
 * @name convertStringToBoolean
 * @param {String} stringData -String data.
 * @returns {Boolean} - Boolean data.
 */

function convertStringToBoolean(stringData) {
	let stringToBoolean = stringData === 'TRUE' || stringData === 'true' || stringData === true
	return stringToBoolean
}

/**
 * check whether id is mongodbId or not.
 * @function
 * @name isValidMongoId
 * @param {String} id
 * @returns {Boolean} returns whether id is valid mongodb id or not.
 */

function isValidMongoId(id) {
	return ObjectId.isValid(id) && new ObjectId(id).toString() === id
}

/**
 * Get epoch time from current date.
 * @function
 * @name epochTime
 * @returns {Date} returns epoch time.
 */

function epochTime() {
	var currentDate = new Date()
	currentDate = currentDate.getTime()
	return currentDate
}

/**
 * check whether string is valid uuid.
 * @function
 * @name checkValidUUID
 * @param {String} uuids
 * @returns {Boolean} returns a Boolean value true/false
 */

function checkValidUUID(uuids) {
	var validateUUID = true
	if (Array.isArray(uuids)) {
		for (var i = 0; uuids.length > i; i++) {
			if (!uuidValidate(uuids[i])) {
				validateUUID = false
			}
		}
	} else {
		validateUUID = uuidValidate(uuids)
	}
	return validateUUID
}

/**
 * count attachments
 * @function
 * @name noOfElementsInArray
 * @param {Object} data - data to count
 * @param {Object} filter -  filter data
 * @returns {Number} - attachment count
 */

function noOfElementsInArray(data, filter = {}) {
	if (!filter || !Object.keys(filter).length > 0) {
		return data.length
	}
	if (!data.length > 0) {
		return 0
	} else {
		if (filter.value == 'all') {
			return data.length
		} else {
			let count = 0
			for (let attachment = 0; attachment < data.length; attachment++) {
				if (data[attachment][filter.key] == filter.value) {
					count++
				}
			}
			return count
		}
	}
}

/**
 * validate lhs and rhs using operator passed as String/ Number
 * @function
 * @name operatorValidation
 * @param {Number or String} valueLhs
 * @param {Number or String} valueRhs
 * @returns {Boolean} - validation result
 */

function operatorValidation(valueLhs, valueRhs, operator) {
	return new Promise(async (resolve, reject) => {
		let result = false
		if (operator == '==') {
			result = valueLhs == valueRhs ? true : false
		} else if (operator == '!=') {
			result = valueLhs != valueRhs ? true : false
		} else if (operator == '>') {
			result = valueLhs > valueRhs ? true : false
		} else if (operator == '<') {
			result = valueLhs < valueRhs ? true : false
		} else if (operator == '<=') {
			result = valueLhs <= valueRhs ? true : false
		} else if (operator == '>=') {
			result = valueLhs >= valueRhs ? true : false
		}
		return resolve(result)
	})
}

/**
 * Generate unique id.s
 * @method
 * @name generateUniqueId
 * @returns {String} - unique id
 */

function generateUniqueId() {
	return uuidV4()
}

// Helper function to convert mongo ids to objectIds to facilitate proper query in aggregate function
function convertMongoIds(query) {
	const keysToConvert = ['_id', 'entityTypeId'] // Add other fields if needed

	const convertValue = (value) => {
		if (Array.isArray(value)) {
			return value.map((v) => (isValidObjectId(v) ? new ObjectId(v) : v))
		} else if (isValidObjectId(value)) {
			return new ObjectId(value)
		}
		return value
	}

	const isValidObjectId = (id) => {
		return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id)
	}

	const recurse = (obj) => {
		for (const key in obj) {
			if (keysToConvert.includes(key)) {
				if (typeof obj[key] === 'object' && obj[key] !== null && '$in' in obj[key]) {
					obj[key]['$in'] = convertValue(obj[key]['$in'])
				} else {
					obj[key] = convertValue(obj[key])
				}
			} else if (typeof obj[key] === 'object' && obj[key] !== null) {
				recurse(obj[key])
			}
		}
	}

	recurse(query)
	return query
}

/**
 * Strip orgIds from query object and log a warning.
 * @function
 * @name stripOrgIds
 * @param {Object} query - The query object containing orgIds.
 * @returns {Object} - The query object without orgIds.
 * @deprecated orgIds is deprecated and should not be used in queries.
 */

function stripOrgIds(query) {
	const { orgIds, orgId, ...rest } = query
	if (orgIds || orgId) {
		console.warn('orgIds/orgId deprecated.')
	}
	return rest
}

/**
 * Convert an array of organization objects to an array of stringified org IDs.
 * @function
 * @name convertOrgIdsToString
 * @param {Array<{code: number|string}>} array - Array of objects each containing a `code` property.
 * @returns {string[]} - Array of stringified `code` values.
 */

function convertOrgIdsToString(array) {
	return array.map((data) => {
		return data.code.toString()
	})
}

module.exports = {
	camelCaseToTitleCase: camelCaseToTitleCase,
	lowerCase: lowerCase,
	checkIfStringIsUrl: checkIfStringIsUrl,
	hyphenCaseToCamelCase: hyphenCaseToCamelCase,
	valueParser: valueParser,
	convertStringToBoolean: convertStringToBoolean,
	epochTime: epochTime,
	isValidMongoId: isValidMongoId,
	checkValidUUID: checkValidUUID,
	noOfElementsInArray: noOfElementsInArray,
	operatorValidation: operatorValidation,
	generateUniqueId: generateUniqueId,
	convertMongoIds: convertMongoIds,
	stripOrgIds: stripOrgIds,
	convertOrgIdsToString: convertOrgIdsToString,
}
