/**
 * name : removeDuplicate.js
 * author : Mallanagouda R Biradar
 * created-date : 24-June-2025
 * Description : Remove Duplicates.
 */

const fs = require('fs')
const csv = require('csv-parser')
const createCsvWriter = require('csv-writer').createObjectCsvWriter

const inputFilePath = 'input.csv' // Your input CSV
const outputFilePath = 'output_unique.csv' // Output with unique rows

const seen = new Set()
const uniqueRows = []

fs.createReadStream(inputFilePath)
	.pipe(csv())
	.on('data', (row) => {
		const parentEntityId = row['parentEntityId'].trim()
		const childEntityId = row['childEntityId'].trim()
		const key = `${parentEntityId}-${childEntityId}`

		if (!seen.has(key)) {
			seen.add(key)
			uniqueRows.push({ parentEntityId, childEntityId })
		}
	})
	.on('end', () => {
		const csvWriter = createCsvWriter({
			path: outputFilePath,
			header: [
				{ id: 'parentEntityId', title: 'parentEntityId' },
				{ id: 'childEntityId', title: 'childEntityId' },
			],
		})

		csvWriter.writeRecords(uniqueRows).then(() => {
			console.log(`✅ Deduplicated data written to: ${outputFilePath}`)
		})
	})
