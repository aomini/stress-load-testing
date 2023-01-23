import { url } from "./url.js";

const maxCallCounts = Number.MAX_VALUE;
const request = "Catalog Category Request";

const catalogRequest = (http, lib) => {
  let callCounts = 1;

  return (params, page = 1) => {
    lib.initRequest(request);
    lib.iteration(request, callCounts);

    if (callCounts > maxCallCounts) {
      callCounts++;
      return lib.exhaust(request);
    }

    const categoryResponse = http.get(
      `${url}/catalog/category/men/products?page=${page}`,
      params
    );
    console.log("😀 STATUS: ", categoryResponse.status);

    if (categoryResponse.status > 499) {
      console.log("🔴 Process exit");
      throw new Error("Process exited due to status code");
    }

    const body = lib.transformResponse(categoryResponse).payload.data;

    callCounts++;
    lib.requestCompletion(request);
    return body;
  };
};
export default catalogRequest;
