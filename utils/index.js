import { sleep } from "k6";

export function random(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

export const transformResponse = (response) => {
  const body = response.body;
  return JSON.parse(body);
};

export const prettyPrint = (json) => {
  console.log(JSON.stringify(json, null, 2));
};

export const wait = () => {
  const rand = random(6, 13);
  console.log("⏰ Waiting for ", `${rand} seconds...`);
  sleep(rand);
};

export const initRequest = (request) => {
  wait();
  console.log(`▶️ ${request} initialized`);
};

export const iteration = (request, iteration) => {
  console.log(`🆗 Starting iteration: ${iteration} - ${request.toUpperCase()}`);
};

export const exhaust = (request) => {
  console.log(`💰 ${request} total calls exhausted`);
  console.log("");
  console.log(`➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖`);
  return { exhaust: true };
};

export const requestCompletion = (request) => {
  console.log(`✅ ${request} completed`);
  console.log("");
  console.log(`➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖`);
};
