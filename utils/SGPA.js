export default function getFullSGPA(attempts) {
  try {
    // have an empty array bestAttempts then push all subjects from first attempt
    // iterate over all attempts' subjects(index 1) and check if any subject is better
    // than present in bestAttempts and update it
    let G2GP = {
      S: 10,
      O: 10,
      A: 9,
      B: 8,
      C: 7,
      D: 6,
      E: 5,
      F: 0,
      AB: 0,
      N: 0,
      Y: 0,
    };
    let bestAttempts;
    //add first attempts to bestAttempts
    for (let i = 0; i < attempts.length; i++) {
      // console.log(attempts[i])
      if (attempts[i].subjects) {
        bestAttempts = attempts[i].subjects;
        break;
      }
    }
    //return SGPA = 0 if no bestAttempt found
    if (!bestAttempts) {
      console.log("Couldnt find bestAttempt so returning SGPA 0");
      return 0;
    }

    //check if stud failed in first attempt
    if (attempts.length > 1) {
      for (let i = 1; i < attempts.length; i++) {
        //only check if stud attempted and this obj is not empty
        if (attempts[i] && Object.keys(attempts[i]).length) {
          for (let j = 0; j < attempts[i].subjects.length; j++) {
            // console.log('checking', attempts[i].subjects[j]['Subject Name'])

            //only check the starting 8 characters of subject name to avoid
            //confusion with other subjects
            //sometimes jutua adds a prefix to subject name
            const index = bestAttempts.findIndex(
              (sub) =>
                sub["1"].toLowerCase() ==
                attempts[i].subjects[j]["1"].toLowerCase()
            );
            //if found, check if grade is better
            if (index != -1) {
              bestAttempts[index] = attempts[i].subjects[j];
            }
          }
        }
      }
    }

    // console.log('actual len ', attempts[0].subjects.length, 'merged len = ', bestAttempts.length)

    // attempts.map(attempt => console.log('attempt', attempt.subjects))
    let totalCred = 0;
    let obtainedCred = 0;
    let flag = false;
    // console.log("bestAttempts", bestAttempts);
    bestAttempts.forEach((subject) => {
      //return sgpa as 0 if any subject has credit 0
      if (
        (subject.Credits == 0 && subject.Grade == "F") ||
        subject.Grade == "AB"
      ) {
        // console.log('abs', subject)
        flag = true;
      }

      // this is yet another check to set flag true
      // JNTU is a big pile of dog shit, they switched
      // Credits column with Grade when student is detained
      if (subject.Grade == 0 && subject.Credits == "F") {
        flag = true;
        // console.log('subject failed', subject)
      }
      // console.log(obtainedCred, totalCred)
      obtainedCred += G2GP[subject.Grade] * subject.Credits;
      totalCred += Number.parseFloat(subject.Credits);
    });
    //check if totalCred is 0 ie AB or flag
    if (totalCred == 0) return 0;
    else if (flag) return -1;
    else return (obtainedCred / totalCred).toFixed(2);

    // console.log('bestAttempts = ', bestAttempts)
  } catch (err) {
    console.log(err);
    return 0;
  }
}
