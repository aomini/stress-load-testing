# Load Testing

> You can also find the docs in [win-docs](https://hazesoftco-my.sharepoint.com/:w:/g/personal/rakesh_shrestha_hazesoft_co/EZKFNz9nZZRNjHMDAGX7OssBOPgselhk6oKdYS1jfXtcZQ?e=fOdBFU) as well.

For testing the sustainability, up-time, server usages, server upgrades analysis & browser metrices load testing (stress testing) is required.

> TLDR; final implementation of load testing is being done with hybrid approach I.e. load testing is implemented to the API server & then tested on the browser to see the responses & behaviour of servers.

## Analysis

Initially, cypress was used as a behaviour testing automation tool. But the challenges with load testing with cypress was huge such as low providers for such testing, high CPU usages, huge cost & maximum number of load testing virtual users was 1000.  
Since, stress testing the API required no providers, low CPU usages, supports local runs as well as cloud, low in cost, no limit to the number of virtual users, efficient & easy to test. Therefore, load testing the system with hybrid approach was the best solution above all.

## Implementation

K6 is a API load testing tool which is similar to Jmeter and can be implemented in nodejs. Also, k6 provides xk6 for browser testing which is escaped due to high CPU usage. K6 supports large number of iterations, virtual users and durations. Also, the feature named k6 stages is beneficial to stress testing which sends in user overtime and aids to create a virtual load testing environment similar to real traffic scenarios.

In order to test the real scenarios, different strategies have been used. Such as randomization, wait, planned API Hits, random API requests, outputs & workflows.

### Randomization

A Random function is used which returns the output randomly. This is being implemented in most of the cases such as wait duration, API params (/<api-url>?page=<random-page>) & workflow selection. This helps us to have users hit API differently in different instance in time.

### Wait

A wait function basically sleeps or pauses the process randomly. Currently, the wait function makes use of randomization and waits for 11 to 15 seconds. Sleep function helps us to have users hit the API randomly.

### Planned API

Since, in the browser users can navigate to different pages with various workflows so API requests should be planned to mimic the navigation and user flow.

### Random API Requests

Some users can or cannot make api requests such as pagination in a search listing page. So, we have implemented a randomization of some API requests such as catalog listing & search listing.

### Outputs

For the purpose of tracking processes, responses & status codes of requests pretty outputs have been used. In the active CLI, we can find various outputs of the running processes.

### Workflows

As mentioned in the Planned API section, a user will have some sort of workflow in the system. We have three workflows in implementation where user hit the API in a planned manner.

#### Workflow-1

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

#### Workflow-2

- User Fetches Resolver

- User Fetches Navigation

- User Navigates to category page

- User Views a product

- User Fetches the cart without cart_id

- User Switches the workflow to primary workflow-1

#### Workflow-3

- User Fetches Resolver

- User Fetches Navigation

- User Navigates to category page

- User Switches the workflow to primary workflow

## Usage

Since, we are also sending metrices like requests failure and successes to a node server for final metrics so we need to run the node server first to start receiving requests during load testing.

**Node Server**

The server stores data to a cloud mongodb store.

1. Change directory to server from the terminal

2. Hit `npm install`

3. Then `npm run dev` which will start the node server at port `8000`.

**K6 Automation**

K6 should run the cart-automation.js.

1. Install the K6 executable

2. Change directory to root of the project

3. Run `k6 run cart-automation.js` this should run the load testing automation but since we may run lots of automations so we need to tag an automation test.

4. Instead run `k6 run cart-automation.js -e tag=iteration-1`. Here, `iteration-1` is an example of a tag. This tag is used when requesting reports of an automation.

## Reports

API Live Reports & reports can be found at http://localhost:8000/metrics/identifier=<tag>. And Html reports can be found at http://localhost:8000/report.

References

[K6](https://k6.io/docs/) - https://k6.io/docs/
