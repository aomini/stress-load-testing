import { url } from "./url.js";

const maxCallCounts = Number.MAX_VALUE;
const request = "Cart Request";

const cartRequest = (http, lib) => {
  let callCounts = 1;

  return (params, cartID) => {
    lib.initRequest(request);
    lib.iteration(request, callCounts);

    if (callCounts > maxCallCounts) {
      callCounts++;
      return lib.exhaust(request);
    }

    const response = http.get(`${url}/checkout/cart`, {
      headers: {
        "Content-type": "application/json",
        "hc-host": "sr.hdlecommercelab.cloud",
        "hc-channel": "se",
        "hc-store": "en",
        "hc-cart": cartID,
      },
    });
    console.log("😀 STATUS: ", response.status);

    if (![200, 201].includes(response.status)) {
      console.log("💙 Process close due to error");
      return { close: true };
    }

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
export default cartRequest;
