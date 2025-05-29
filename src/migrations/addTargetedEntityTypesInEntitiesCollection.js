require('dotenv').config({ path: '../.env' })
const path = require('path')
const { MongoClient } = require('mongodb')

const MONGODB_URL = process.env.MONGODB_URL
const dbClient = new MongoClient(MONGODB_URL, { useUnifiedTopology: true })

let professionalSubRolesInfo = {
	'student-preschool-class-2': ['school'],
	'student-class-1-5': ['school'],
	'student-class-3-5': ['school'],
	'student-class-6-8': ['school'],
	'student-class-6-10': ['school'],
	'student-class-9-10': ['school'],
	'student-class-11-12': ['school'],
	'student-class-8-10': ['school'],
	'student-higher-education': ['school'],
	'student-pre-service-teacher': ['school'],
	'teacher-preschool-class-2': ['school'],
	'teacher-class-1-5': ['school'],
	'teacher-class-3-5': ['school'],
	'teacher-class-6-8': ['school'],
	'teacher-class-6-10': ['school'],
	'teacher-class-9-10': ['school'],
	'teacher-class-11-12': ['school'],
	'special-educators': ['school'],
	'physical-education-teacher': ['school'],
	'art-music-performing-teacher': ['school'],
	counsellor: ['school'],
	'warden-caretaker': ['school'],
	'anganwadi-worker': ['school'],
	'anganwadi-helper': ['school'],
	librarian: ['school'],
	'technician-lab-it': ['school'],
	'principal-head-teacher': ['school'],
	'vice-principal-asst-head-teacher': ['school'],
	'head-teacher-incharge': ['school'],
	'teacher-educator-SCERT': ['state'],
	'teacher-educator-DIET': ['state'],
	'teacher-educator-IASE': ['state'],
	'teacher-educator-univ-deptt': ['state'],
	'teacher-educator-TEI': ['state'],
	'teacher-educator-SIET': ['state'],
	'teacher-educator-CTE': ['state'],
	'teacher-educator-BASIC': ['state'],
	'block-resource-centre-coordinator-BRCC': ['block'],
	'cluster-resource-centre-oordinator-CRCC': ['cluster'],
	'state-coordinator': ['state'],
	'district-coordinator': ['school'],
	'assistant-district-coordinator': ['district'],
	coordinator: ['school'],
	'mentor-advisor': ['school'],
	'resource-person-state-district-block': ['state'],
	'shikshak-sankul': ['school'],
	'principal-secretary-commissioner-secretary-school-education': ['school'],
	'additional-secretary-commissioner-school-education': ['school'],
	'joint-secretary-education': ['school'],
	'assistant-commissioner': ['school'],
	'additional-director': ['school'],
	'director-public-instructions-elementary-secondary': ['school'],
	'project-director-SPD': ['state'],
	'joint-director': ['school'],
	'assistant-state-project-director': ['state'],
	'additional-state-project-director': ['state'],
	'director-basic': ['school'],
	'head-autonomous-organization': ['school'],
	'director-SCERT': ['state'],
	'principal-DIET': ['school'],
	'collector-DM-DC': ['school'],
	'head-state-training-center': ['state'],
	'education-officer': ['school'],
	'chief-education-officer': ['state'],
	'district-education-officer-DEO': ['district'],
	'block-ducation-fficer-BEO': ['block'],
	'MIS-coordinator': ['school'],
	'subject-inspector': ['school'],
	'evaluation-officer': ['school'],
	'extension-officer': ['school'],
	'CDPO-child-development-project-officer': ['school'],
	supervisor: ['school'],
	'program-officer': ['school'],
	'basic-shiksha-adhikari': ['school'],
	'director-primary-education': ['school'],
	'Desk-officer-education': ['school'],
	'director-secondary-and-higher-secondary-education': ['school'],
	'director-scheme': ['school'],
	'director-balbharati': ['school'],
	'director-state-education-board': ['state'],
}

let cache = {}

async function runMigration() {
	try {
		await dbClient.connect()
		const db = dbClient.db()

		for (const [externalId, entityTypeNames] of Object.entries(professionalSubRolesInfo)) {
			if (!entityTypeNames.length) continue

			// Step 1: Fetch all matching entities (with that externalId)
			const entityDocs = await db
				.collection('entities')
				.find({ 'metaInformation.externalId': externalId })
				.toArray()
			for (const entity of entityDocs) {
				const tenantId = entity.tenantId

				// Step 2: Fetch matching entityTypes for this tenant
				const matchingEntityTypes = await db
					.collection('entityTypes')
					.find(
						{
							name: { $in: entityTypeNames },
							tenantId: tenantId,
						},
						{ projection: { _id: 1, name: 1 } }
					)
					.toArray()

				const targetedEntityTypes = matchingEntityTypes.map((type) => ({
					entityType: type.name,
					entityTypeId: type._id.toString(),
				}))
				if (targetedEntityTypes.length) {
					const updateResult = await db
						.collection('entities')
						.updateOne(
							{ _id: entity._id },
							{ $set: { 'metaInformation.targetedEntityTypes': targetedEntityTypes } }
						)
					console.log(`Updated entity ${entity._id} for tenant ${tenantId}`)
				} else {
					console.warn(`No matching entityTypes found for entity ${entity._id} (tenantId: ${tenantId})`)
				}
			}
		}
	} catch (err) {
		console.error('Migration error:', err)
	} finally {
		await dbClient.close()
	}
}

runMigration()
