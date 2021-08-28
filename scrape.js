const puppeteer = require("puppeteer");
const moment = require("moment");

const link = "https://duke-sp.transactcampus.com/eAccounts/AccountSummary.aspx";

let semesterEnd = moment("2021-12-13");

let sampleTotal = 2681.13;

let TESTING = false;

let sampleTable = [
  "9/3/2019 4:30 PM",
  "Beyu Blue BYBReg1",
  "Debit",
  "(4.30) USD",
  "9/3/2019 2:57 PM",
  "McDonalds MCDReg1",
  "Debit",
  "(2.68) USD",
  "9/3/2019 11:53 AM",
  "Au Bon Pain ABP Reg 4",
  "Debit",
  "(4.29) USD",
  "9/3/2019 11:43 AM",
  "Chefs Kitchen CKNReg1",
  "Debit",
  "(11.83) USD",
  "9/2/2019 5:36 PM",
  "Sazon SAZReg1",
  "Debit",
  "(12.90) USD",
  "9/2/2019 4:49 PM",
  "McDonalds MCDReg1",
  "Debit",
  "(1.71) USD",
  "9/2/2019 1:03 PM",
  "Loop Loop Reg 3",
  "Debit",
  "(9.99) USD",
  "9/1/2019 8:02 PM",
  "The Cafe CAFReg2",
  "Debit",
  "(7.74) USD",
  "9/1/2019 4:13 PM",
  "Perk PERReg1",
  "Debit",
  "(10.59) USD",
  "9/1/2019 1:07 PM",
  "Sazon SAZReg1",
  "Debit",
  "(9.89) USD",
  "9/1/2019 12:26 AM",
  "McDonalds MCDReg2",
  "Debit",
  "(1.71) USD",
  "8/31/2019 6:53 PM",
  "Gyotaku GYOReg1",
  "Debit",
  "(3.11) USD",
  "8/31/2019 6:52 PM",
  "Gyotaku GYOReg1",
  "Debit",
  "(15.00) USD",
  "8/31/2019 12:48 PM",
  "Sazon SAZReg1",
  "Debit",
  "(0.27) USD",
  "8/31/2019 12:42 PM",
  "Sazon SAZReg1",
  "Debit",
  "(9.68) USD",
];

let convertToTransactions = (array) => {
  const chunked_arr = [];
  for (let i = 0; i < array.length / 4; i++) {
    let idx = i * 4;
    // use regex to retrieve dollar amount
    let amountTransacted = Number(
      array[idx + 3].match(/\(([\d|\.]+)\) USD/)[1]
    );
    //location = locationArr.slice(0, location.length - 1)
    chunked_arr.push({
      date: array[idx],
      location: array[idx + 1],
      transactionType: array[idx + 2],
      amount: amountTransacted,
    });
  }
  return chunked_arr;
};

const scrapeBlackboard = async (config) => {
  //return 2685.4
  try {
	console.log("Scraping...");
    if (TESTING) {
      return [sampleTotal, sampleTable];
    }
    // launch browser and head to link
    const browser = await puppeteer.launch({
      headless: false,
    });
    const page = await browser.newPage();

    // sign in
    await page.goto(link);
    await page.waitForNavigation({ waitUntil: "networkidle2" });
    await page.evaluate((config) => {
      document.getElementById("j_username").value = config.username;
      document.getElementById("j_password").value = config.password;
    }, config);
    await page.click("#Submit");
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    // click food panel and wait for load
    await page.click(
      "#MainContent_DivPanelStoredValue_50f415b5-2d1b-4e12-8b3c-92c312fe2c29"
    );
    await page.waitForSelector("#MainContent_AccountBalance");
    // retrieve food balance
    let box = await page.$("#MainContent_AccountBalance");
    let foodPointStr = await page.evaluate((el) => el.innerText, box);
    let foodPoints = Number(foodPointStr.replace(/[^0-9.-]+/g, ""));

    // retrieve table
    let transactionElements = await page.evaluate(() => {
      let elements = Array.from(
        document.querySelectorAll("td[role='gridcell']")
      );
      let transactionElements = elements.map((el) => {
        return el.innerText;
      });
      return transactionElements;
    });
    // table selector: table > tbody > tr > td
    await browser.close();
    return [foodPoints, transactionElements];
  } catch (e) {
    console.error(e);
    process.exit();
  }
};

calcAvg = async (config) => {
  console.log(`Starting food points calculator for ${config.username}...`);
  let [moneyLeft, transactionElements] = await scrapeBlackboard(config);
  let today = moment();

  // calculate days until end of semester
  let daysLeft = semesterEnd.diff(today, "days");

  // calculate average daily spend
  let semAvgDaily = moneyLeft / daysLeft;
  //console.log("Remaining food points: " + convertToMoney(moneyLeft) + "\nAverage daily spend: " + convertToMoney(moneyLeft / daysLeft))

  // create transaction objects from parsed information
  let transactions = convertToTransactions(transactionElements);

  // find transactions done today
  let transactionsToday = transactions.filter((transaction) => {
    return today.isSame(
      moment(transaction.date.split(" ")[0], "MM/DD/YYYY"),
      "day"
    );
  });

  // calculate amount of food points spent today
  let spentToday = transactionsToday.reduce((total, transaction) => {
    return total + transaction.amount;
  }, 0);

  let transactionsByDay = {};
  for (let transaction of transactions) {
    let date = transaction.date.split(" ")[0];
    if (!(date in transactionsByDay)) {
      transactionsByDay[date] = new Array();
    }
    transactionsByDay[date].push(Number(transaction.amount.toFixed(2)));
  }
  // console.log(transactionsByDay)

  // get average of array
  let sum = (array) => array.reduce((a, b) => a + b);

  let total = 0;
  let numDays = 0;
  for (let day in transactionsByDay) {
    transactionsByDay[day] = sum(transactionsByDay[day]);
    total += transactionsByDay[day];
    numDays += 1;
  }

  let fiveDayAvg = total / numDays;

  let moneyLeftToday = semAvgDaily - spentToday;

  //console.log("Spent today: " + convertToMoney(spentToday) + "\nMoney left: " + convertToMoney(moneyLeftToday))
  return {
    transactionsList: transactions,
    transactionsToday: transactionsToday,
    moneyLeft: moneyLeft,
    spentToday: Number(spentToday.toFixed(2)),
    moneyLeftToday: Number(moneyLeftToday.toFixed(2)),
    daysLeftInSemester: daysLeft,
    dailyAvgSem: Number(semAvgDaily.toFixed(2)),
    fiveDayAvg: Number(fiveDayAvg.toFixed(2)),
  };
};
// calcAvg().then((results) => {
//   console.log(results);
// });

module.exports = calcAvg;
