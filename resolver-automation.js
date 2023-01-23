import http from "k6/http";

export default function () {
  const url = "https://sr-api.hdlecommercelab.cloud/api/public/resolver";

  const params = {
    headers: {
      "Content-type": "application/json",
      "hc-host": "sailracing.com",
    },
  };

  const response = http.get(url, params);
  console.log("RESOLVER_FETCHED");
}
