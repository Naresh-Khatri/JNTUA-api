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
    deviceInfo = tokens["user-agent"](req, res) + "dunno ๐ค";
  }

  return [
    "๐",
    tokens.method(req, res) === "POST"
      ? chalk.yellow(tokens.method(req, res))
      : chalk.green(tokens.method(req, res)),
    "โก" + chalk.greenBright(tokens["response-time"](req, res), "ms"),
    tokens.status(req, res) > 400
      ? chalk.bgRed(tokens.status(req, res))
      : tokens.status(req, res) > 300
      ? chalk.bgYellow(tokens.status(req, res))
      : chalk.bgGreen(tokens.status(req, res)),
    // chalk.bgBlueBright('โณ' + tokens.res(req, res, 'total-time'), '-'),
    chalk.bgBlueBright("โฐ" + currTime.split(",")[1]),
    chalk.bgRedBright("๐ฑ" + deviceInfo),
    chalk.bgMagentaBright("๐" + tokens.url(req, res)),
    chalk.bgBlueBright(
      tokens.referrer(req, res)
        ? tokens.referrer(req, res).includes("https://naresh-khatri.github.io")
          ? "๐งพ " + "Homepage"
          : "๐งพ " + tokens.referrer(req, res)
        : "๐งพ " + "NA"
    ),
    chalk.bgCyan("๐ฆ" + tokens.res(req, res, "content-length")),
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
//       deviceInfo = tokens["user-agent"](req, res) + "dunno ๐ค";
//     }
//     return [
//       "๐",
//       tokens.method(req, res) === "POST"
//         ? chalk.yellow(tokens.method(req, res))
//         : chalk.green(tokens.method(req, res)),
//       tokens.status(req, res) > 400
//         ? chalk.bgRed(tokens.status(req, res))
//         : tokens.status(req, res) > 300
//         ? chalk.bgYellow(tokens.status(req, res))
//         : chalk.bgGreen(tokens.status(req, res)),
//       // chalk.bgBlueBright('โณ' + tokens.res(req, res, 'total-time'), '-'),
//       chalk.bgBlueBright("โฐ" + currTime.split(",")[1]),
//       chalk.bgRedBright("๐ฑ" + deviceInfo),
//       chalk.bgMagentaBright("๐" + tokens.url(req, res)),
//       chalk.bgBlueBright(
//         tokens.referrer(req, res)
//           ? tokens
//               .referrer(req, res)
//               .includes("https://naresh-khatri.github.io")
//             ? "๐งพ " + "Homepage"
//             : "๐งพ " + tokens.referrer(req, res)
//           : "๐งพ " + "NA"
//       ),
//       chalk.bgCyan("๐ฆ" + tokens.res(req, res, "content-length")),
//       "โก " + chalk.greenBright(tokens["response-time"](req, res), "ms"),
//     ].join(" ");
//     // morganLogger(tokens, req, res);
//   })
