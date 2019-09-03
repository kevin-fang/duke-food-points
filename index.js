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

const link = "https://dco31.oit.duke.edu/mydukecard/"

let semesterEnd = moment("2019-12-07")

// to do: parse from https://duke-sp.blackboard.com/eAccounts/AccountSummary.aspx
// ^^ blackboard webpage has transaction history

const run = async () => {
	return 2685.4
	try {
		const browser = await puppeteer.launch({
			headless: true
		})
		const page = await browser.newPage()

		await page.goto(link)
		await page.evaluate((config) => {
			document.getElementById("j_username").value = config.username
			document.getElementById("j_password").value = config.password
		}, config)
		await page.click("#Submit")
		await page.waitForNavigation({waitUntil: "networkidle2"})
		let box = await page.$("#lbl_FoodBalance")
		let foodPointStr = await page.evaluate(el => el.innerText, box);
		let foodPoints = Number(foodPointStr.replace(/[^0-9.-]+/g,""));
		console.log("Food points:", foodPoints)
		browser.close()
	} catch (e) {
		console.error(e)
		process.exit()
	}
}

calcAvg = async () => {
	let moneyLeft = await run()
	let today = moment()

	let daysLeft = semesterEnd.diff(today, 'days')
	console.log("Money left: $" + moneyLeft + ", days left:" + daysLeft)
	console.log("Average daily spend: $" + moneyLeft / daysLeft)
}

calcAvg()