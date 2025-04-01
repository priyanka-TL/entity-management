/**
 * name : userRoleExtension.js
 * author : Mallanagouda R Biradar
 * created-date : 30-july-2024
 * Description : Schema for userRoleExtension.
 */

module.exports = {
	name: 'userRoleExtension',
	schema: {
		userRoleId: {
			type: String,
			unique: true,
		},
		title: {
			type: String,
			index: true,
		},
		status: {
			type: String,
			default: 'ACTIVE',
		},
		entityTypes: [
			{
				entityType: { type: String },
				entityTypeId: { type: String, index: true },
			},
		],
		translations: Object,
		createdBy: {
			type: String,
			default: 'SYSTEM',
		},
		updatedBy: {
			type: String,
			default: 'SYSTEM',
		},
		code: {
			type: String,
			index: true,
		},
	},
}
