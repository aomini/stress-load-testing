import { url } from "./url.js";

const maxCallCounts = Number.MAX_VALUE;
const request = "Search Request";

const searchRequest = (http, lib) => {
  let callCounts = 1;

  return (params, { q, page }) => {
    lib.initRequest(request);
    lib.iteration(request, callCounts);

    if (callCounts > maxCallCounts) {
      callCounts++;
      return lib.exhaust(request);
    }

    const response = http.get(
      `${url}/catalog/search?q=${q}&page=${page}`,
      params
    );
    console.log("😀 STATUS: ", response.status);

    if (response.status > 499) {
      console.log("🔴 Process exit");
      throw new Error("Process exited due to status code");
    }

    const body = lib.transformResponse(response).payload.data;

    callCounts++;
    lib.requestCompletion(request);
    return body;
  };
};
export default searchRequest;
