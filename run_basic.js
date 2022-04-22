const prompt = require("prompt");
const scrape = require("./scrape.js");

prompt.message = "";

const properties = [
  {
    name: "netID",
    validator: /^[a-zA-Z0-9]+$/,
    warning: "NetID must be only letters and numbers",
  },
  {
    name: "password",
    hidden: true,
  }
];

prompt.start();

prompt.get(properties, (err, res) => {
  if (err) {
    console.error(err);
  }
  scrape({ username: res.netID, password: res.password }).then((results) => {
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
})