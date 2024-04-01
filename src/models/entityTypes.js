/**
 * name : entityTypes.js.
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : Schema for entityTypes.
 */

module.exports = {
    name: "entityTypes",
    schema: {
        name: {
            type: String,
            index: true,
            unique: true
        },
        profileForm: Array,
        profileFields: Array,
        types: Array,
        callResponseTypes: Array,
        registryDetails:Object,
        isObservable: Boolean,
        immediateChildrenEntityType:Array,
        toBeMappedToParentEntities: Boolean,
        isDeleted: Boolean,
        createdBy: {
            type: String,
            default: "SYSTEM",
            index: true
        },
        updatedBy: {
            type: String,
            default: "SYSTEM"
        }
    },
}


