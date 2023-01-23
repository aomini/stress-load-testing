import { prettyPrint } from "../utils/index.js";
import { url } from "./url.js";

const maxCallCounts = Number.MAX_VALUE;
const request = "Add to Cart Request";

const addCartRequest = (http, lib) => {
  let callCounts = 1;

  return (params, { product_id }) => {
    lib.initRequest(request);
    lib.iteration(request, callCounts);

    if (callCounts > maxCallCounts) {
      callCounts++;
      return lib.exhaust(request);
    }

    const addToCartResponse = http.post(
      `${url}/checkout/cart`,
      JSON.stringify({ product_id, qty: 1 }),
      params
    );
    console.log("😀 STATUS: ", addToCartResponse.status);

    if (![200, 201].includes(addToCartResponse.status)) {
      console.log("💙 Process close due to error");
      prettyPrint(params);
      console.log(`➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖`);
      return { close: true };
    }

    if (addToCartResponse.status > 499) {
      console.log("🔴 Process exit");
      throw new Error("Process exited due to status code");
    }
    const body = lib.transformResponse(addToCartResponse).payload.data;

    callCounts++;
    lib.requestCompletion(request);
    return body;
  };
};
export default addCartRequest;
