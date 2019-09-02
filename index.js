const puppeteer = require('puppeteer')
const config = require("./config.json")

const link = "https://dco31.oit.duke.edu/mydukecard/"

const run = async () => {
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
		const foodPointValue = await page.evaluate(el => el.innerText, box);
		console.log("Food points: ", foodPointValue)
		browser.close()
	} catch (e) {
		console.error(e)
		process.exit()
	}
}

run()