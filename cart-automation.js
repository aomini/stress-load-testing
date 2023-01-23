import http from "k6/http";
import { getCurrentStageIndex } from "https://jslib.k6.io/k6-utils/1.3.0/index.js";
import exec from "k6/execution";
import { reportUrl, url } from "./url.js";
import {
  random,
  initRequest,
  requestCompletion,
  iteration,
  wait,
  exhaust,
  prettyPrint,
} from "./utils/index.js";
import navigationMenuRequest from "./requests/navigation-menus-request.js";
import catalogRequest from "./requests/catalog-request.js";
import resolverRequest from "./requests/resolver-request.js";
import productRequest from "./requests/product-request.js";
import addCartRequest from "./requests/add-to-cart-request.js";
import shippingRequest from "./requests/shipping-request.js";
import cartRequest from "./requests/cart-request.js";
import searchRequest from "./requests/search-request.js";
import cartUpdateRequest from "./requests/cart-update-request.js";
import checkoutRequest from "./requests/checkout-request.js";

export const transformResponse = (response) => {
  const body = response.body;
  return JSON.parse(body);
};

const params = {
  headers: {
    "Content-type": "application/json",
    "hc-host": "sr.hdlecommercelab.cloud",
    "hc-channel": "se",
    "hc-store": "en",
  },
};

const lib = {
  transformResponse,
  exhaust,
  initRequest,
  requestCompletion,
  iteration,
};

const workflows = [
  {
    workflow: 1,
    description: `
      - User Fetches Resolver
      - User Fetches Navigation
      - User Searches for a product named jacket
      - User Scrolls down in search to randomly selected page
      - User Views a product
      - User Randomly selects category
      - User Randomly Scrolls to a page in categoryBody
      - User Adds products to cart randomly
      - User Fetches the cart
      - User Updates the product quantity
      - User Fetches the cart
      - User Fetches the Shipping method
      - User Tries to checkout the cart
    `,
  },
  {
    workflow: 2,
    description: `
      - User Fetches Resolver
      - User Fetches Navigation
      - User Navigates to category page
      - User Views a product
      - User Fetches the cart without cart_id
      - User Switches the workflow to primary workflow
    `,
  },
  {
    workflow: 3,
    description: `
      - User Fetches Resolver
      - User Fetches Navigation
      - User Navigates to category page
      - User Switches the workflow to primary workflow
    `,
  },
];

const selectWorkflow = (workflows) => {
  const choice = random(0, workflows.length);
  const selectedWorkflow = workflows[choice];
  console.log(
    `
    🚨 Workflow - ${selectedWorkflow.workflow} selected
    ${selectedWorkflow.description}
  `.trim()
  );
  console.log("");
  console.log(`➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖`);
  return workflows[choice];
};

const baseWorkflow = () => {
  const fetchResolver = resolverRequest(http, lib);
  const fetchNavigation = navigationMenuRequest(http, lib);
  const fetchCatalog = catalogRequest(http, lib);
  const fetchProduct = productRequest(http, lib);
  const fetchShippingMethods = shippingRequest(http, lib);
  const fetchCart = cartRequest(http, lib);
  const addToCart = addCartRequest(http, lib);
  const search = searchRequest(http, lib);
  const cartUpdate = cartUpdateRequest(http, lib);
  const checkout = checkoutRequest(http, lib);

  return {
    fetchResolver,
    fetchNavigation,
    fetchCatalog,
    fetchProduct,
    fetchShippingMethods,
    fetchCart,
    addToCart,
    search,
    cartUpdate,
    checkout,
  };
};
const makeRequest = baseWorkflow();

/**
 * Select one index randomly
 */
const selectAny = (array) => {
  const randomIndex = random(0, array.length);
  return array[randomIndex];
};

/**
 * Hits search api two times with page 1 and a randomly selected page
 * @returns Object - Randomly selected searched product
 */
const implementSearchWorkflow = () => {
  /** List of search Products */
  let products = [];

  let searchResult = makeRequest.search(params, {
    q: "jacket",
    page: 1,
  });
  searchResult.products.forEach((product) => products.push(product));

  /**
   * Can request another page with a random page
   * Mitigating user scroll
   */
  const initialLastPage = searchResult.last_page;
  if (initialLastPage !== 1) {
    searchResult = makeRequest.search(params, {
      q: "jacket",
      page: random(1, initialLastPage + 1),
    });
    searchResult.products.forEach((product) => products.push(product));

    if (!products.length) {
      throw new Error("🚫 Search Results products is empty cannot proceed");
    }
  }

  return products;
};

/** Hit category listing */
const implementCategoryWorkflow = (page = 1) => {
  /** Listed products */
  let products = [];

  const category = makeRequest.fetchCatalog(params, page);
  const last_page = category.last_page;

  // Is multiple category
  const isMultiple = "categories" in category;

  if (isMultiple) {
    // TODO
    return true;
  }

  category.products.forEach((product) => products.push(product));

  const randomPage = random(2, last_page + 1);
  // todo: recursion
  const nextCategory = makeRequest.fetchCatalog(params, randomPage);
  if ("categories" in nextCategory) {
    return products;
  } else {
    nextCategory.products.forEach((product) => products.push(product));
  }
  return products;
};

const workflow1 = () => {
  makeRequest.fetchResolver();

  makeRequest.fetchNavigation(params);
  const searchedProducts = implementSearchWorkflow();

  /** Randomly select a product */
  const selectedProduct = selectAny(searchedProducts);

  makeRequest.fetchProduct(params, selectedProduct.url_key);

  /** Add items to cart randomly */
  const randomTotalItemsToAdd = random(1, 4);
  let noItemsAdded = true;
  let createdCartID = null;
  let product = null;

  const products = implementCategoryWorkflow();
  for (let i = 1; i <= randomTotalItemsToAdd; i++) {
    console.log(`➕ Adding ${i} item to cart...`);
    const selectedProduct = selectAny(products);
    const cart = makeRequest.addToCart(
      createdCartID
        ? {
            headers: {
              "Content-type": "application/json",
              "hc-host": "sr.hdlecommercelab.cloud",
              "hc-channel": "se",
              "hc-store": "en",
              "hc-cart": createdCartID,
            },
          }
        : params,
      {
        product_id: selectedProduct.id,
      }
    );
    if (!("close" in cart) && !createdCartID) {
      createdCartID = cart.id;
      noItemsAdded = false;
      product = selectedProduct;
    }
  }

  if (noItemsAdded) return true;

  const fetchedCart = makeRequest.fetchCart(params, createdCartID);
  makeRequest.cartUpdate(params, {
    product_id: product.id,
    cart_id: fetchedCart.cart_id,
  });

  makeRequest.fetchShippingMethods(params, fetchedCart.cart_id);
  makeRequest.checkout(params, { cart_id: fetchedCart.cart_id });
};

const workflow2 = () => {
  makeRequest.fetchResolver();
  makeRequest.fetchNavigation(params);
  const category = makeRequest.fetchCatalog(params, 1);

  // Is multiple category
  const isMultiple = "categories" in category;

  if (isMultiple) {
    // TODO
    return true;
  }

  const products = category.products;
  const randomProductIndex = random(0, products.length);
  const selectedProduct = products[randomProductIndex];
  makeRequest.fetchProduct(params, selectedProduct.url_key);
  makeRequest.fetchCart(params, "");

  const switchedWorkflow = workflows[0];
  console.log(
    `
    🚨 Workflow - ${switchedWorkflow.workflow} Switched
    ${switchedWorkflow.description}
  `.trim()
  );
  console.log("");
  console.log(`➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖`);
  implementWorkflow(switchedWorkflow);
};

const workflow3 = () => {
  makeRequest.fetchResolver();
  makeRequest.fetchNavigation(params);
  makeRequest.fetchCatalog(params, 1);

  const switchedWorkflow = workflows[0];
  console.log(
    `
    🚨 Workflow - ${switchedWorkflow.workflow} Switched
    ${switchedWorkflow.description}
  `.trim()
  );
  console.log("");
  console.log(`➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖`);
  implementWorkflow(switchedWorkflow);
};

/**
 * Implement workflow
 */
const implementWorkflow = (workflow, metricTrackerID) => {
  switch (workflow.workflow) {
    case 1:
      return workflow1(metricTrackerID);
    case 2:
      return workflow2(metricTrackerID);
    default:
      return workflow3(metricTrackerID);
  }
};

/**
 * Options
 */
export const options = {
  stages: [
    { duration: "30s", target: 20 },
    { duration: "1m30s", target: 50 },
    { duration: "3m", target: 100 },
    { duration: "3m", target: 150 },
    { duration: "3m", target: 170 },
    { duration: "3m", target: 200 },
    { duration: "20s", target: 1 },
  ],
};

const resolveVus = (vu) => {
  const targets = options.stages
    .filter((x) => x.target !== 1)
    .map((x) => x.target)
    .sort((a, b) => a - b);

  let found = null;

  for (let i = 0; i <= targets.length; i++) {
    const it = targets[i];
    if (vu <= it) {
      found = it;
      break;
    }
  }
  return found ? found : targets[targets.length - 1];
};

export default () => {
  const tag = __ENV.tag;
  if (!tag) {
    console.error("TAG NOT PROVIDED");
    return false;
  }

  /** Send start metrics */
  const resp = http.post(
    reportUrl,
    JSON.stringify({
      identifier: tag,
      ius: exec.instance.vusActive,
      // vus: resolveVus(exec.instance.vusActive),
      // vus: 10,
      vus: options.stages[getCurrentStageIndex()].target,
      status: "pending",
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const body = JSON.parse(resp.body);
  const metricTrackerID = body.data._id;
  /** Set tracker id */
  lib.trackerID = metricTrackerID;

  try {
    /** Initially select a workflow */
    let workflow = selectWorkflow(workflows);

    implementWorkflow(workflow, metricTrackerID);

    http.patch(
      `${reportUrl}/${metricTrackerID}`,
      JSON.stringify({
        status: "success",
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    http.patch(
      `${reportUrl}/${metricTrackerID}`,
      JSON.stringify({
        status: "Failed",
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
  console.log("⏺️ Metrics Recorded.");
};

export function backup() {
  /**
   * Navigation
   */
  const response = http.get(`${url}/navigation-menus`, params);
  const body = transformResponse(response);
  const primaryMenus = body.payload.data.find((x) => x.location === "primary");
  const randomIndex = random(0, primaryMenus.items.length);
  const selectedMenu = primaryMenus.items[randomIndex];
  /** selected menu split slug from link */
  const [, , , , slug] = selectedMenu.link.split("/");

  /**
   * Fetch category product
   */
  const categoryResponse = http.get(
    `${url}/catalog/category/men/products?page=1`,
    params
  );
  const categoryBody = transformResponse(categoryResponse).payload.data;
  const lastPage = categoryBody.last_page;

  wait();

  // Is multiple category
  const isMultiple = "categories" in categoryBody;

  if (isMultiple) {
    // TODO
  } else {
    const randomProductPage = random(1, lastPage);

    /**
     * Fetch category product
     */
    const refetchedCategoryResponse = http.get(
      `${url}/catalog/category/men/products?page=${randomProductPage}`,
      params
    );
    const refetchedCategoryBody = transformResponse(refetchedCategoryResponse)
      .payload.data;
    const products = refetchedCategoryBody.products;
    const randomProductIndex = random(0, products.length);
    const selectedProduct = products[randomProductIndex];

    /** Fetch product details for testing? */
    /** Array with low fetchable condition true probability */
    const fetchProductDetail = [false, false, false, true, false, true, false];
    const fetchableRandom = random(0, fetchProductDetail.length);
    if (fetchableRandom) {
      http.get(`${url}/catalog/product/${selectedProduct.url_key}`);
      console.log("💯 JUST FETCHING CATALOG PRODUCT API");
    }

    wait();

    /** Add to cart */
    const addToCartResponse = http.post(
      `${url}/checkout/cart`,
      JSON.stringify({ product_id: selectedProduct.id, quantity: 1 }),
      params
    );
    const addToCartBody = transformResponse(addToCartResponse).payload.data;
    const cartID = addToCartBody.id;

    wait();

    /** Should Fetch Cart */
    // Array of low probab
    const fetchCartApi = [false, false, false, true, false, true, false];
    const fetchableCart = random(0, fetchCartApi.length);
    if (fetchableCart) {
      http.get(`${url}/checkout/cart`, {
        headers: {
          "Content-type": "application/json",
          "hc-host": "sr.hdlecommercelab.cloud",
          "hc-channel": "se",
          "hc-store": "en",
          "hc-cart": cartID,
        },
      });
      console.log("💯 FETCHING CART CHANCE");
    }

    wait();

    /** Shipping Methods */
    const fetchShippingMethods = [
      true,
      true,
      true,
      true,
      true,
      false,
      false,
      false,
    ];
    const fetchableMethods = random(0, fetchShippingMethods);
    if (fetchableMethods) {
      http.get(`${url}/shipping/payment/methods?cart_id=${cartID}`, params);
      console.log("💯 FETCHING SHIPPING METHODS");

      http.post(`${url}/checkout`, JSON.stringify({ cart_id: cartID }), params);
      console.log("💯 Checkout Fetched Successfully");
    }
  }
}
