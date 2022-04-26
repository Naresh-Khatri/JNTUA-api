import morgan from "morgan";
import chalk from "chalk";

export default morgan(function (tokens, req, res) {
  var parenRegExp = /\(([^)]+)\)/;
  // let currTime = new Date(new Date(tokens.date(req, res, 'web')).getTime())
  let currTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
  });
  let deviceInfo;
  try {
    deviceInfo = parenRegExp
      .exec(tokens["user-agent"](req, res))[0]
      .replace(/[()]/gi, "");
  } catch (err) {
    deviceInfo = tokens["user-agent"](req, res) + "dunno 🤔";
  }

  return [
    "👉",
    tokens.method(req, res) === "POST"
      ? chalk.yellow(tokens.method(req, res))
      : chalk.green(tokens.method(req, res)),
    "⚡" + chalk.greenBright(tokens["response-time"](req, res), "ms"),
    tokens.status(req, res) > 400
      ? chalk.bgRed(tokens.status(req, res))
      : tokens.status(req, res) > 300
      ? chalk.bgYellow(tokens.status(req, res))
      : chalk.bgGreen(tokens.status(req, res)),
    // chalk.bgBlueBright('⏳' + tokens.res(req, res, 'total-time'), '-'),
    chalk.bgBlueBright("⏰" + currTime.split(",")[1]),
    chalk.bgRedBright("📱" + deviceInfo),
    chalk.bgMagentaBright("🔗" + tokens.url(req, res)),
    chalk.bgBlueBright(
      tokens.referrer(req, res)
        ? tokens.referrer(req, res).includes("https://naresh-khatri.github.io")
          ? "🧾 " + "Homepage"
          : "🧾 " + tokens.referrer(req, res)
        : "🧾 " + "NA"
    ),
    chalk.bgCyan("📦" + tokens.res(req, res, "content-length")),
  ].join(" ");
  // morganLogger(tokens, req, res);
});
// next()

// morgan(function (tokens, req, res) {
//     var parenRegExp = /\(([^)]+)\)/;
//     // let currTime = new Date(new Date(tokens.date(req, res, 'web')).getTime())
//     let currTime = new Date().toLocaleString("en-US", {
//       timeZone: "Asia/Kolkata",
//     });
//     let deviceInfo;
//     try {
//       deviceInfo = parenRegExp
//         .exec(tokens["user-agent"](req, res))[0]
//         .replace(/[()]/gi, "");
//     } catch (err) {
//       deviceInfo = tokens["user-agent"](req, res) + "dunno 🤔";
//     }
//     return [
//       "👉",
//       tokens.method(req, res) === "POST"
//         ? chalk.yellow(tokens.method(req, res))
//         : chalk.green(tokens.method(req, res)),
//       tokens.status(req, res) > 400
//         ? chalk.bgRed(tokens.status(req, res))
//         : tokens.status(req, res) > 300
//         ? chalk.bgYellow(tokens.status(req, res))
//         : chalk.bgGreen(tokens.status(req, res)),
//       // chalk.bgBlueBright('⏳' + tokens.res(req, res, 'total-time'), '-'),
//       chalk.bgBlueBright("⏰" + currTime.split(",")[1]),
//       chalk.bgRedBright("📱" + deviceInfo),
//       chalk.bgMagentaBright("🔗" + tokens.url(req, res)),
//       chalk.bgBlueBright(
//         tokens.referrer(req, res)
//           ? tokens
//               .referrer(req, res)
//               .includes("https://naresh-khatri.github.io")
//             ? "🧾 " + "Homepage"
//             : "🧾 " + tokens.referrer(req, res)
//           : "🧾 " + "NA"
//       ),
//       chalk.bgCyan("📦" + tokens.res(req, res, "content-length")),
//       "⚡ " + chalk.greenBright(tokens["response-time"](req, res), "ms"),
//     ].join(" ");
//     // morganLogger(tokens, req, res);
//   })
