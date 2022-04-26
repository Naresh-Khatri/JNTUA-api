import axios from "axios";

export default function (htn, resultId) {
  this.url = "https://jntuaresults.ac.in/view-results-56736424.html";
  const promise = new Promise((resolve, reject) => {
    this.getToken = function () {
      return new Promise((resolve, reject) => {
        axios
          .get(this.url)
          .then((res) => {
            const pageHTML = res.data;
            const token = this.parseInt(
              pageHTML.substring(
                pageHTML.indexOf("access"),
                pageHTML.indexOf("access") + 30
              )
            );
            resolve(token);
          })
          .catch((err) => reject(err));
      });
    };
    this.parseInt = function (str) {
      let num = "";
      for (let i = 0; i < str.length; i++) {
        num +=
          Number.parseInt(str[i]) || str[i] == "0"
            ? Number.parseInt(str[i])
            : "";
      }
      return num;
    };
    this.getResult = async function () {
      var config = {
        method: "get",
        url: `https://jntuaresults.ac.in/results/res.php?ht=${htn}&id=${resultId}&accessToken=${5892158}`,
        headers: {
          Cookie: "PHPSESSID=kk98b6kd3oaft9p9p8uiis6ae6;",
        },
      };
      axios(config).then((res) => {
        resolve(res.data);
      });
    };
    this.test = function () {
      resolve("ok");
    };
  });
};

// const main = async () => {
//   let res = new Result('19fh1a0546', '56736424')
//   res.getResult()
//   //console.log(await res.getToken())
// }

// main()
