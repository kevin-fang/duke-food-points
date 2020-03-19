const puppeteer = require("puppeteer")
const moment = require("moment")
const fs = require("fs")
const app = require("express")()
const cors = require("cors")
app.use(cors())

const config = require("./config.json")

let semesterEnd = moment("2020-05-02")
let port = 8000
let TESTING = false
let dataFilename = "data.json"

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
    try {
        // launch browser and head to link
        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null
        })
        const page = (await browser.pages())[0]

        // sign in
        await page.goto(config.link)
        await page.waitForNavigation({waitUntil: "networkidle2"})

        await page.waitForSelector("#MainContent_AccountSummaryPanel");
        
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

let calcAvg = async () => {
    let [moneyLeft, transactionElements] = await scrapeBlackboard()
    let today = moment()

    // calculate days until end of semester
    let daysLeft = semesterEnd.diff(today, 'days')

    // calculate average daily spend
    let semAvgDaily = moneyLeft / daysLeft
    //console.log("Remaining food points: " + convertToMoney(moneyLeft) + "\nAverage daily spend: " + convertToMoney(moneyLeft / daysLeft))

    // create transaction objects from parsed information
    let transactions = convertToTransactions(transactionElements)

    // find transactions done today
    let transactionsToday = transactions.filter(transaction => {
        return today.isSame(moment(transaction.date.split(" ")[0], "MM/DD/YYYY"), 'day')
    })

    // calculate amount of food points spent today
    let spentToday = transactionsToday.reduce((total, transaction) => {
        return total + transaction.amount
    }, 0)

    let transactionsByDay = {}
    for (let transaction of transactions) {
        let date = transaction.date.split(" ")[0]
        if (!(date in transactionsByDay)) {
            transactionsByDay[date] = new Array() 
        }
        transactionsByDay[date].push(transaction.amount)
    }
    //console.log(transactionsByDay)

    // get average of array
    let sum = (array) => array.reduce((a, b) => a + b)

    let total = 0
    let numDays = 0
    for (let day in transactionsByDay) {
        transactionsByDay[day] = sum(transactionsByDay[day])
        total += transactionsByDay[day]
        numDays += 1
    }

    let fiveDayAvg = total / numDays

    let moneyLeftToday = semAvgDaily - spentToday

    //console.log("Spent today: " + convertToMoney(spentToday) + "\nMoney left: " + convertToMoney(moneyLeftToday))
    return {
        spentToday: spentToday,
        moneyLeftToday: moneyLeftToday,
        daysLeftInSemester: daysLeft,
        dailyAvgSem: semAvgDaily,
        transactionsList: transactions,
        transactionsToday: transactionsToday,
        fiveDayAvg: fiveDayAvg
    }
}
app.get('/', async (req, res) => {
    console.log("Received request")
    res.setHeader("Content-Type", "text/json")
    fs.readFile(dataFilename, "utf-8", (err, data) => {
        if (err) {
            res.status(404).send("Can't find")
        }
        res.send(data)
    })
})

const run = async () => {
    if (!TESTING) {
        let data = await calcAvg();
        fs.writeFile(dataFilename, JSON.stringify(data), (err) => {
            if (err)  {
                throw err
            }
            console.log("Finished scraping data... Opening statistics page");
        })
    } else {
        console.log("Running in testing mode")
    }
}

run();

app.listen(port)
console.log(`Server listening on port ${port}`)
