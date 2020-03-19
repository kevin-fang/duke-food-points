const app = require('express')()
const cors = require('cors')
app.use(cors())


let scrape = require('./scrape.js')

/*
return {
		spentToday: spentToday,
		moneyLeftToday: moneyLeftToday,
		daysLeftInSemester: daysLeft,
		dailyAvg: avgDaily,
		transactionsList: transactions,
		transactionsToday: transactionsToday
	}
*/
let convertToMoney = (moneyInt) => {
 	return moneyInt.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

const run = async () => {
	console.log("Scraping Blackboard...")
	let results = await scrape()
	console.log(results)
	return results
}

app.get('/points', async (req, res) => {
	res.setHeader("Content-Type", "text/json")
	res.send(await run())
})

app.get("/visual", async (req, res) => {
	let results = await run()
	res.setHeader("Content-Type", "text/html")
	res.send(`Money left: ${convertToMoney(results.moneyLeftToday)}, spent: ${convertToMoney(results.spentToday)}`)
})

app.listen(8080)
console.log("Listening on port 8080")