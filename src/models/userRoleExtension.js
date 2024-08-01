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
			index: true,
			unique: true,
		},
		title: {
			type: String,
			index: true,
		},
		userType: {
			type: Number,
			index: true,
		},
		status: {
			type: String,
			default: 'ACTIVE',
		},
		entityTypes: [
			{
				entityType: { type: String, index: true },
				entityTypeId: { type: String, index: true },
			},
		],
		createdBy: {
			type: String,
			default: 'SYSTEM',
		},
		updatedBy: {
			type: String,
			default: 'SYSTEM',
		},
	},
}
