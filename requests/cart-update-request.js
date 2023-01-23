import { url } from "./url.js";

const maxCallCounts = Number.MAX_VALUE;
const request = "Update Cart Request";

const cartUpdateRequest = (http, lib) => {
  let callCounts = 1;

  return (params, { product_id, cart_id }) => {
    lib.initRequest(request);
    lib.iteration(request, callCounts);

    if (callCounts > maxCallCounts) {
      callCounts++;
      return lib.exhaust(request);
    }

    const response = http.post(
      `${url}/checkout/cart`,
      JSON.stringify({ product_id, type: "update", qty: 2 }),
      {
        headers: {
          "Content-type": "application/json",
          "hc-host": "sailracing.com",
          "hc-channel": "se",
          "hc-store": "en",
          "hc-cart": cart_id,
        },
      }
    );
    console.log("😀 STATUS: ", response.status, cart_id);

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
export default cartUpdateRequest;
