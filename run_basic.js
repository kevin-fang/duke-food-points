const readlineSync = require("readline-sync");
const mod_getpass = require("getpass");
const scrape = require("./scrape.js");

const username = readlineSync.question("Username:");
mod_getpass.getPass((_, password) => {
  scrape({ username, password }).then((results) => {
    console.log(
      `--------\nMoney left: $${results.moneyLeft}\n
# of days left in semester: ${results.daysLeftInSemester} days\n
Amount spent today: $${results.spentToday}\n
Money left today: $${results.moneyLeftToday}\n
Daily amount available to spend: $${results.dailyAvgSem}\n
Current 5-day average spending: $${results.fiveDayAvg}\n`
    );
    process.exit(0);
  });

});
