const readlineSync = require("readline-sync");
const scrape = require("./scrape.js");

const username = readlineSync.question("Username: ");
const password = readlineSync.question("Password: ", {
  hideEchoBack: true,
});

scrape({ username, password }).then((results) => {
  console.log(
    `--------\nMoney left: $${results.moneyLeft}\n
# of days left in semester: ${results.daysLeftInSemester} days\n
Amount spent today: $${results.spentToday}\n
Money left today: $${results.moneyLeftToday}\n
Daily amount available to spend: $${results.dailyAvgSem}\n
Current 5-day average spending: $${results.fiveDayAvg}\n`
  );
});
