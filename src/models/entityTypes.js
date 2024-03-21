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
            index: true
        },
        profileForm: Array,
        profileFields: Array,
        types: Array,
        callResponseTypes: Array,
        isObservable: Boolean,
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
};

