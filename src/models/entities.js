/**
 * name : entities.js.
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : Schema for entities.
 */

module.exports = {
	name: 'entities',
	schema: {
		entityTypeId: 'ObjectId',
		entityType: {
			type: String,
			index: true,
		},
		groups: Object,
		metaInformation: {
			externalId: { type: String, index: true },
			name: { type: String, index: true },
			targetedEntityTypes: { type: Array },
		},
		childHierarchyPath: Array,
		userId: {
			type: String,
			index: true,
		},
		registryDetails: {
			locationId: { type: String, index: true },
			code: { type: String, index: true },
		},
		translations: Object,
		createdBy: {
			type: String,
			default: 'SYSTEM',
			index: true,
		},
		updatedBy: {
			type: String,
			default: 'SYSTEM',
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
			name: { 'metaInformation.externalId': 1, tenantId: 1 },
			indexType: { unique: true },
		},
	],
}
