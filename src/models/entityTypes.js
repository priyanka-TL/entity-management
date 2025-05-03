/**
 * name : entityTypes.js.
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : Schema for entityTypes.
 */

module.exports = {
	name: 'entityTypes',
	schema: {
		name: {
			type: String,
		},
		profileForm: Array,
		profileFields: Array,
		types: Array,
		callResponseTypes: Array,
		registryDetails: Object,
		isObservable: {
			type: Boolean,
			default: true,
		},
		immediateChildrenEntityType: Array,
		toBeMappedToParentEntities: Boolean,
		isDeleted: Boolean,
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
		orgIds: {
			type: Array,
			require: true,
			index: true,
		},
	},
	compoundIndex: [
		{
			name: { name: 1, tenantId: 1 },
			indexType: { unique: true },
		},
	],
}
