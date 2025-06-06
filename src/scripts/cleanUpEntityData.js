const MongoClient = require('mongodb').MongoClient
require('dotenv').config()

async function deleteEntitiesInBatches(mongoUrl) {
	const batchSize = 1000 // Configurable batch size
	const entityTypes = ['state', 'district', 'block', 'cluster', 'school']

	// Validate MongoDB URL
	if (!mongoUrl) {
		console.error('Error: MongoDB URL must be provided as a command-line argument or in .env as MONGODB_URL')
		process.exit(1)
	}

	let client

	try {
		// Connect to MongoDB
		client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
		console.log('Connected to MongoDB')

		const db = client.db() // Use default database from URL
		const collection = db.collection('entities')

		// Count total matching documents
		const totalDocs = await collection.countDocuments({ entityType: { $in: entityTypes } })
		console.log(`Total documents to delete: ${totalDocs}`)

		if (totalDocs === 0) {
			console.log('No documents found matching the criteria. Exiting.')
			return
		}

		// Delete in batches
		let deletedCount = 0
		while (deletedCount < totalDocs) {
			// Find a batch of document IDs to delete
			const batchDocs = await collection
				.find({ entityType: { $in: entityTypes } })
				.limit(batchSize)
				.project({ _id: 1 })
				.toArray()

			if (batchDocs.length === 0) {
				break // No more documents to delete
			}

			// Extract IDs for deletion
			const batchIds = batchDocs.map((doc) => doc._id)

			// Delete documents by IDs
			const batchResult = await collection.deleteMany({ _id: { $in: batchIds } })
			const batchDeleted = batchResult.deletedCount
			deletedCount += batchDeleted
			console.log(`Deleted ${batchDeleted} documents in this batch. Total deleted: ${deletedCount}`)
		}

		console.log(`Deletion complete. Total documents deleted: ${deletedCount}`)
	} catch (error) {
		console.error('Error during deletion:', error.message)
		process.exit(1)
	} finally {
		if (client) {
			await client.close()
			console.log('MongoDB connection closed')
		}
	}
}

// Get MongoDB URL from command-line argument or environment variable
const mongoUrl = process.argv[2] || process.env.MONGODB_URL

// Run the script
deleteEntitiesInBatches(mongoUrl).catch((error) => {
	console.error('Script failed:', error.message)
	process.exit(1)
})
