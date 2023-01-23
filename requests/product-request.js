import { url } from "./url.js";

const maxCallCounts = Number.MAX_VALUE;
const request = "Product Request";

const productRequest = (http, lib) => {
  let callCounts = 1;

  return (params, slug) => {
    lib.initRequest(request);
    lib.iteration(request, callCounts);

    if (callCounts > maxCallCounts) {
      callCounts++;
      return lib.exhaust(request);
    }

    const productResponse = http.get(`${url}/catalog/product/${slug}`, params);
    console.log("😀 STATUS: ", productResponse.status);

    if (productResponse.status > 499) {
      console.log("🔴 Process exit");
      throw new Error("Process exited due to status code");
    }

    const body = lib.transformResponse(productResponse).payload.data;

    callCounts++;
    lib.requestCompletion(request);
    return body;
  };
};
export default productRequest;
