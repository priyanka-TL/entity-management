/**
 * name : v1.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : Entities.
 */

module.exports = (req) => {
	let entitiesValidator = {
		add: function () {
			req.checkQuery('type').exists().withMessage('required type')
			req.checkBody('externalId').exists().withMessage('required externalId ')
			req.checkBody('name')
				.exists()
				.withMessage('The name field is required.')
				.trim() // Removes leading and trailing spaces
				.notEmpty()
				.withMessage('The name field cannot be empty.')
		},
		update: function () {
			req.checkParams('_id').exists().withMessage('required _id')
			req.checkParams('_id').exists().isMongoId().withMessage('Invalid MongoDB ID')
			if (req.body['metaInformation.name']) {
				req.checkBody('metaInformation.name')
					.exists()
					.withMessage('The name field is required.')
					.trim()
					.notEmpty()
					.withMessage('The name field cannot be empty.')
			}
			if (req.body['metaInformation.externalId']) {
				req.checkBody('metaInformation.externalId')
					.exists()
					.withMessage('The name field is required.')
					.trim()
					.notEmpty()
					.withMessage('The name field cannot be empty.')
			}
		},
		subEntityList: function () {
			req.checkQuery('type').exists().withMessage('required type')
			req.checkParams('_id').exists().withMessage('required _id')
			req.checkParams('_id').exists().isMongoId().withMessage('Invalid MongoDB ID')
		},
		targetedRoles: function () {
			req.checkParams('_id').exists().withMessage('The entity ID (_id) is required.')
			req.checkParams('_id').exists().isMongoId().withMessage('Invalid MongoDB ID')
		},
		entityListBasedOnEntityType: function () {
			req.checkQuery('entityType').exists().withMessage('required entityType')
		},
		listByIds: function () {
			req.checkBody('entities').exists().withMessage('required entities')
		},
		find: function () {
			req.checkBody('query').exists().withMessage('required query')
			// req.checkBody('projection').exists().withMessage('required projection')
		},
		listByEntityType: function () {
			req.checkParams('_id').exists().withMessage('required Entity type')
			req.checkParams('_id').exists().isMongoId().withMessage('Invalid MongoDB ID')
		},
		subEntityListBasedOnRoleAndLocation: function () {
			req.checkParams('_id').exists().withMessage('required state location id')
		},
		details: function () {
			req.checkParams('_id').exists().withMessage('required id')
			req.checkParams('_id').exists().isMongoId().withMessage('Invalid MongoDB ID')
		},
		list: function () {
			req.checkQuery('type').exists().withMessage('required type')
			req.checkParams('_id').exists().withMessage('required entity id')
			req.checkParams('_id').exists().isMongoId().withMessage('Invalid MongoDB ID')
		},
		relatedEntities: function () {
			req.checkParams('_id').exists().withMessage('required Entity id')
			req.checkParams('_id').exists().isMongoId().withMessage('Invalid MongoDB ID')
		},
		bulkCreate: function () {
			if (!req.files || !req.files.entities) {
				req.checkBody('entities').exists().withMessage('entities file is required')
			}
		},
		bulkUpdate: function () {
			if (!req.files || !req.files.entities) {
				req.checkBody('entities').exists().withMessage('entities file is required')
			}
		},
		mappingUpload: function () {
			if (!req.files || !req.files.entityMap) {
				req.checkBody('entityMap').exists().withMessage('entityMap file is required')
			}
		},
		listByLocationIds: function () {
			req.checkBody('locationIds').exists().withMessage('Location ids is required')
		},
		registryMappingUpload: function () {
			req.checkQuery('entityType').exists().withMessage('required entity type')
		},
	}

	if (entitiesValidator[req.params.method]) {
		entitiesValidator[req.params.method]()
	}
}
