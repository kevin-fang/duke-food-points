const puppeteer = require('puppeteer')
const moment = require("moment")

const config = require("./config.json")

/*
config looks like this:
{
	"username": "netid",
	"password": "password"
}

*/

const link = "https://duke-sp.blackboard.com/eAccounts/AccountSummary.aspx"

let semesterEnd = moment("2019-12-07")

let sampleTotal = 2681.1

let TESTING = false;

let sampleTable = ['9/3/2019 4:30 PM', 'Beyu Blue BYBReg1', 'Debit', '(4.30) USD', '9/3/2019 2:57 PM', 'McDonalds MCDReg1', 'Debit', '(2.68) USD', '9/3/2019 11:53 AM', 'Au Bon Pain ABP Reg 4', 'Debit', '(4.29) USD', '9/3/2019 11:43 AM', 'Chefs Kitchen CKNReg1', 'Debit', '(11.83) USD', '9/2/2019 5:36 PM', 'Sazon SAZReg1', 'Debit', '(12.90) USD', '9/2/2019 4:49 PM', 'McDonalds MCDReg1', 'Debit', '(1.71) USD', '9/2/2019 1:03 PM', 'Loop Loop Reg 3', 'Debit', '(9.99) USD', '9/1/2019 8:02 PM', 'The Cafe CAFReg2', 'Debit', '(7.74) USD', '9/1/2019 4:13 PM', 'Perk PERReg1', 'Debit', '(10.59) USD', '9/1/2019 1:07 PM', 'Sazon SAZReg1', 'Debit', '(9.89) USD', '9/1/2019 12:26 AM', 'McDonalds MCDReg2', 'Debit', '(1.71) USD', '8/31/2019 6:53 PM', 'Gyotaku GYOReg1', 'Debit', '(3.11) USD', '8/31/2019 6:52 PM', 'Gyotaku GYOReg1', 'Debit', '(15.00) USD', '8/31/2019 12:48 PM', 'Sazon SAZReg1', 'Debit', '(0.27) USD', '8/31/2019 12:42 PM', 'Sazon SAZReg1', 'Debit', '(9.68) USD']

// to do: parse from https://duke-sp.blackboard.com/eAccounts/AccountSummary.aspx
// ^^ blackboard webpage has transaction history

let convertToMoney = (moneyInt) => {
 	return moneyInt.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

let convertToTransactions = (array) => {
    const chunked_arr = [];
    for (let i = 0; i < array.length / 4; i++) {
    	let idx = i * 4
    	// use regex to retrieve dollar amount
    	let amountTransacted = Number(array[idx + 3].match(/\(([\d|\.]+)\) USD/)[1])
    	//location = locationArr.slice(0, location.length - 1)
    	chunked_arr.push({
    		date: array[idx],
    		location: array[idx + 1],
    		transactionType: array[idx + 2],
    		amount: amountTransacted
    	})
    }
    return chunked_arr
}

const scrapeBlackboard = async () => {
	//return 2685.4
	try {
		if (TESTING) {
			return [sampleTotal, sampleTable]
		}
		// launch browser and head to link
		const browser = await puppeteer.launch({
			headless: false
		})
		const page = await browser.newPage()

		// sign in
		await page.goto(link)
		await page.waitForNavigation({waitUntil: "networkidle2"})
		await page.evaluate((config) => {
			document.getElementById("j_username").value = config.username
			document.getElementById("j_password").value = config.password
		}, config)
		await page.click("#Submit")
		await page.waitForNavigation({waitUntil: "networkidle2"})

		// click food panel and wait for load
		await page.click("#MainContent_DivPanelStoredValue_50f415b5-2d1b-4e12-8b3c-92c312fe2c29")
		await page.waitForSelector("#MainContent_AccountBalance")
		// retrieve food balance
		let box = await page.$("#MainContent_AccountBalance")
		let foodPointStr = await page.evaluate(el => el.innerText, box);
		let foodPoints = Number(foodPointStr.replace(/[^0-9.-]+/g,""));

		// retrieve table
		let transactionElements = await page.evaluate(() => {
			let elements = Array.from(document.querySelectorAll("td[role='gridcell']"))
			let transactionElements = elements.map(el => {
				return el.innerText
			})
			return transactionElements
		})
		// table selector: table > tbody > tr > td
		await browser.close()
		return [foodPoints, transactionElements]
	} catch (e) {
		console.error(e)
		process.exit()
	}
}

calcAvg = async () => {
	let [moneyLeft, transactionElements] = await scrapeBlackboard()
	let today = moment()

	let daysLeft = semesterEnd.diff(today, 'days')
	// console.log("Money left: " + convertToMoney(moneyLeft) + ", days left: " + daysLeft)

	let avgDaily = moneyLeft / daysLeft
	console.log("Remaining food points: " + convertToMoney(moneyLeft) + "\nAverage daily spend: " + convertToMoney(moneyLeft / daysLeft))

	let transactions = convertToTransactions(transactionElements)
	//console.log(transactions)

	let transactionsToday = transactions.filter(transaction => {
		return today.isSame(moment(transaction.date.split(" ")[0], "MM/DD/YYYY"), 'day')
	})

	let spentToday = transactionsToday.reduce((total, transaction) => {
		return total + transaction.amount
	}, 0)

	let moneyLeftToday = avgDaily - spentToday

	console.log("Spent today: " + convertToMoney(spentToday) + "\nMoney left: " + convertToMoney(moneyLeftToday))
}

calcAvg()