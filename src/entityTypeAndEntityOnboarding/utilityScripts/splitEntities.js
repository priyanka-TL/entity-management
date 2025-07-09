/**
 * name : splitEntities.js
 * author : Mallanagouda R Biradar
 * created-date : 24-June-2025
 * Description : Split the entities based on the limit pass.
 */

const fs = require('fs')
const csv = require('csv-parser')
const { createObjectCsvWriter } = require('csv-writer')

const inputFilePath = 'input.csv' // Input file name
const rowsPerFile = 5000 // Split size
const allRows = []

let headers = []

// Step 1: Read CSV data
fs.createReadStream(inputFilePath)
	.pipe(csv())
	.on('headers', (csvHeaders) => {
		// Ensure fixed header names
		headers = ['parentEntiyId', 'childEntityId'].map((header) => ({
			id: header,
			title: header,
		}))
	})
	.on('data', (row) => {
		// Optional: only keep required fields to avoid extra columns
		allRows.push({
			parentEntiyId: row.parentEntiyId,
			childEntityId: row.childEntityId,
		})
	})
	.on('end', async () => {
		const totalFiles = Math.ceil(allRows.length / rowsPerFile)

		for (let i = 0; i < totalFiles; i++) {
			const chunk = allRows.slice(i * rowsPerFile, (i + 1) * rowsPerFile)

			const csvWriter = createObjectCsvWriter({
				path: `data${i + 1}.csv`,
				header: headers,
			})

			await csvWriter.writeRecords(chunk)
			console.log(`data${i + 1}.csv written with ${chunk.length} records`)
		}
	})
