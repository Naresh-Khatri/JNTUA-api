import axios from "axios";
import HtmlTableToJson from "html-table-to-json";

export default function getAttempt(result, htn) {
  return new Promise((resolve, reject) => {
    try {
      // console.log('token', token)
      var config = {
        method: "get",
        url: `https://jntuaresults.ac.in/results/res.php?ht=${htn}&id=${result.resultID}&accessToken=${process.env.ACCESS_TOKEN}`,
        headers: {
          Cookie: "PHPSESSID=kk98b6kd3oaft9p9p8uiis6ae6;",
        },
      };
      axios(config)
        .then(async (res) => {
          // console.log("url",config.url)
            // console.log("result",result)
            // console.log("attempt - ",result.resultID, res.data);

          if (res.data == "Something goes wrong 😟") {
            console.log(res.data);
            return "Something goes wrong 😟";
          }
          //check if token is expired
          if (res.data == "Invalid Token") {
            console.log("token expired");
            return "Token updated please reload";
          }
          //reject if result not found
            // console.log('ressssssssssss:',res.data)
          if (res.data.includes("Invalid")) {
              // console.log(res.data)
            // console.log(`Invalid htn=${htn} with resid=${result.resultID}`)
            return resolve({});
          }

          //get stud name in all attempts
          let studInfo = res.data
            .substring(0, res.data.indexOf("<br>"))
            .replace(
              /&nbsp;|<\/?[^>]+(>|$)|Hall Ticket No :|Student name:/g,
              ""
            )
            .split(" ");
          studInfo.shift();
          const studName = studInfo.join(" ");

          let tableHTML = res.data + "</th></tr></table>";

          //jntua is a fucking piece of shit for not adding these closing tags
          //such a pain
          const resultObj = getAllAttemptsObj(tableHTML, result);
        //   console.log(resultObj)
          return resolve({ resultObj, studName });
        })
        .catch((err) => {
          console.log(err);
          reject(err);
          return;
        });
    } catch (err) {
      console.log(err);
    }
  });
}
function getAllAttemptsObj(tableHTML, result) {
  //when Grade is AB jntu calls it 'Grades' 😥
  tableHTML = tableHTML.replace(/Grades/g, "Grade");
  const jsonTable = HtmlTableToJson.parse(tableHTML).results;
  //remove <table> --> &nbsp; --> <tags> --> htn title --> name title -->split by ' '
  // let studInfo = tableHTML.substring(0, tableHTML.indexOf('<br>'))
  //     .replace(/&nbsp;|<\/?[^>]+(>|$)|Hall Ticket No :|Student name:/g, '')
  //     .split(' ')

  const subjects = jsonTable[0];
  //add resID examMonth to every elem
  const splitArr = result.title.split(" ");
  const monthArr = splitArr.slice(-2);
  monthArr[0] = monthArr[0].slice(0, 3);
  monthArr[1] = monthArr[1].slice(-2);
  let month = monthArr.join("-");
  subjects.forEach((sub) =>
    Object.assign(sub, { resultID: result.resultID, month })
  );
  // console.log(subjects)
  // const resultObj = {}
  // resultObj['htn'] = studInfo[0]
  // resultObj['name'] = ''
  // for (let i = 1; i < studInfo.length; i++) {
  //     resultObj['name'] += studInfo[i] + " "
  // }
  // const sgpa = getSGPA(subjects)
  // Object.assign(resultObj, { result.resultID, failedCount, sgpa, subjects })

  const failedCount = getFailedCount(subjects);
  const attempt = {};

  return { ...attempt, failedCount, subjects, resultID: result.resultID };
}
function getFailedCount(subjects) {
  let count = 0;
  if (!subjects) return 0;
  subjects.forEach((sub) => {
    if ((sub.Credits == 0 && sub.Grade == "F") || sub.Grade == "AB") {
      count++;
    }
  });
  return count;
}
