/**
 * name : fixOrgIdsFromCollections.js
 * author : Saish R B
 * created-date : 26-May-2025
 * Description : Migration script to update orgIds to scope
 */

require('dotenv').config({ path: '../.env' })
const { MongoClient } = require('mongodb')
const MONGODB_URL = process.env.MONGODB_URL

if (!MONGODB_URL) {
	throw new Error('Missing MONGODB_URL or DB in environment variables')
}

const dbClient = new MongoClient(MONGODB_URL)

const BATCH_SIZE = 100

async function modifyCollection(collectionName) {
	console.log(`Starting migration for collection: ${collectionName}`)

	const db = dbClient.db()
	const collection = db.collection(collectionName)

	const cursor = collection.find(
		{
			orgIds: { $exists: true, $type: 'array' },
		},
		{
			projection: { _id: 1, orgIds: 1 },
		}
	)

	let batch = []

	while (await cursor.hasNext()) {
		try {
			console.log(`processing for collection: ${collectionName}`)
			const doc = await cursor.next()
			console.log(`Processing document with _id: ${doc._id}`)
			if (!doc.orgIds || doc.orgIds.length === 0) {
				console.log(`Skipping _id: ${doc._id} - empty orgIds`)
				continue
			}

			batch.push({
				updateOne: {
					filter: { _id: doc._id },
					update: {
						$unset: { orgIds: '' },
						$set: { orgId: doc.orgIds[0] },
					},
				},
			})

			// Process batch
			if (batch.length >= BATCH_SIZE) {
				await collection.bulkWrite(batch, { ordered: false })
				console.log(`Processed ${batch.length} docs in ${collectionName}`)
				batch = []
			}
		} catch (err) {
			console.log(err, '<-- Error processing document')
		}
	}

	// Final remaining batch
	if (batch.length > 0) {
		await collection.bulkWrite(batch, { ordered: false })
		console.log(`Processed remaining ${batch.length} docs in ${collectionName}`)
	}

	console.log(`Collection "${collectionName}" migration completed.`)
}

async function runMigration() {
	try {
		await dbClient.connect()
		const COLLECTIONS = ['entities', 'entityTypes', 'userRoleExtension']

		for (const collection of COLLECTIONS) {
			console.log('collection', collection)
			await modifyCollection(collection)
		}
	} catch (err) {
		console.error('Migration failed:', err)
	} finally {
		await dbClient.close()
	}
}

runMigration()
