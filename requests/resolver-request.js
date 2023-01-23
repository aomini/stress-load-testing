import { reportUrl } from "../url.js";
import { url } from "./url.js";

// const maxCallCounts = Number.MAX_VALUE;
const maxCallCounts = 2;
const request = "Resolver Request";

const resolverRequest = (http, lib) => {
  let callCounts = 1;

  return () => {
    lib.initRequest(request);
    lib.iteration(request, callCounts);

    if (callCounts > maxCallCounts) {
      callCounts++;
      return lib.exhaust(request);
    }

    const response = http.get(`${url}/resolver`, {
      "hc-host": "alpha",
      "hc-store": "alpha",
    });
    console.log("😀 STATUS: ", response.status);
    if (response.status > 499) {
      console.log("🔴 Process exit");
      throw new Error("Process exited due to status code");
    }

    const body = lib.transformResponse(response);

    callCounts++;
    lib.requestCompletion(request);
    return body;
  };
};
export default resolverRequest;
