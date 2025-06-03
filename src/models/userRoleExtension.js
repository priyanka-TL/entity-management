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
				_id: false,
				entityType: { type: String },
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
		code: {
			type: String,
			index: true,
		},
		tenantId: {
			type: String,
			index: true,
			require: true,
		},
		orgId: {
			type: String,
			require: true,
			index: true,
		},
	},
	compoundIndex: [
		{
			name: { userRoleId: 1, tenantId: 1 },
			indexType: { unique: true },
		},
	],
}
