import Search from "../models/Search.js";
import Analytics from "../models/Analytics.js";

export default async function addAnalytics(resultID, htn) {
  try {
    Analytics.findOneAndUpdate(
      { htn, resultID },
      {
        $inc: { count: 1 },
        latest: new Date(
          new Date().getTime() - new Date().getTimezoneOffset() * 60 * 1000
        ).toUTCString(),
      },
      { new: true, useFindAndModify: false }
    )
      .then(
        (
          result
          //  err
        ) => {
          //increase count, update time and save
          //result is null if no result found
          if (!result) {
            //add new entry with count=1, current time and save
            const anal = new Analytics({
              htn,
              resultID,
              count: 1,
              latest: new Date(
                new Date().getTime() -
                  new Date().getTimezoneOffset() * 60 * 1000
              ).toUTCString(),
            });
            anal.save();
          }
        }
      )
      .catch((err) => {
        console.log(`Error: Couldnt add anal for ${htn} - ${resultID}:${err}`);
      });

    //increase the search count for the day
    let date = formateDate(new Date());

    // let currTime = new Date(
    //   new Date().getTime() - new Date().getTimezoneOffset() * 60 * 1000
    // );
    // let formattedTime = currTime.getHours().length == 1 ? "0" + currTime.getHours() : currTime.getHours() + ":"
    // currTime.getMinutes().length == 1 ? "0" + currTime.getMinutes() : currTime.getMinutes() + ":"
    // currTime.getSeconds().length == 1 ? "0" + currTime.getSeconds() : currTime.getSeconds()

    Search.findOneAndUpdate(
      { date: date },
      {
        $inc: { searchCount: 1 },
        // $push: { time: currTime }
      },
      { new: true, useFindAndModify: false }
    )
      .then((result) => {
        // console.log(result)
        // result is null if no result found
        if (!result) {
          console.log("New date! adding new record in search");
          const search = new Search({
            date: date,
            count: 1,
            // time: [new Date().getHours()],
          });
          search.save().then((result) => {
            console.log("search added:", result);
          });
        }
      })
      .catch((err) => {
        console.log("Error:", err);
      });

    // if (err) {
    //     console.log('while updating searches', err)
    // }
    // else {
    //     if (result.length == 0) {
    //         // const search = new Search({ date: date, count: 1, time: [new Date().getHours()] })
    //         // search.save()
    //         //     .then(result => {
    //         //         console.log('search added:', result)
    //         //     })
    //     }
    // }
    // })}
  } catch (err) {
    console.log(err);
  }
}
function formateDate(date) {
  return (
    date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate()
  );
}
