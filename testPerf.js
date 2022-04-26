import { performance, PerformanceObserver } from "perf_hooks";

let startTime = performance.now();
for (let i = 0; i < 1_000_000_000; i++) {
  // console.log();
}
let endTime = performance.now();
console.log("Time taken = " + Number.parseFloat(endTime - startTime));
