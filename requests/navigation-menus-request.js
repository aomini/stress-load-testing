import { url } from "./url.js";

const maxCallCounts = Number.MAX_VALUE;
const request = "Navigation Menu Request";

const navigationMenuRequest = (http, lib) => {
  let callCounts = 1;

  return (params) => {
    lib.initRequest(request);
    lib.iteration(request, callCounts);

    if (callCounts > maxCallCounts) {
      callCounts++;
      return lib.exhaust(request);
    }

    const response = http.get(`${url}/navigation-menus`, params);
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
export default navigationMenuRequest;
