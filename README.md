# xCallScan - ICON's General Message Passing Explorer

xCallScan is an Explorer that allows users to look up relay messages and transactions being sent through [xCall Service (General Message Passing)](https://www.xcall.dev).

xCallScan is typically made of:

1. Indexer: that fetches the raw data from the on-chain, extracts, transforms, and stores it in the database in an efficient way to provide quick access to the blockchain data

2. API: an API that queries the database

3. Explorer: A frontend app that displays the data

4. WebSocket: client dApp can subscribe websocket to get new messages in realtime

5. Network Subscriber: the service listens for new events from networks/chains, extracts, transforms data in realtime

6. Action Analyzer: the service analyzes message transactions to determine what action (SendMsg, Transfer, Swap, Loan...)


### Screenshots

<img src="https://github.com/kryptopoo/xcallscan/blob/master/docs/screenshots/homepage.png" width="800" >


### Live: http://xcallscan.xyz


## Getting started

### Indexer

- Install package
- Change `.env.example` to `.env` and configure environment settings
- Initialize database 
    ```bash
    ts-node cmd db init
    ```
    
- Migrate database 
    ```bash
    ts-node cmd db migrate <filename.sql>
    ```

- Start indexer
    ```bash
    npm run indexer
    ```

- Start web socket
    ```bash
    npm run ws
    ```

- Start network subscriber
    ```bash
    npm run subscriber
    ```

- Start action analyzer
    ```bash
    npm run analyzer
    ```

- Command
    ```bash
    ts-node cmd scan <network> <event> <flag_number> <xcall_address>
    ts-node cmd fetch <network> <event> <flag_number> <update_counter>
    ts-node cmd sync <from_sn><comma_or_hyphen><to_sn> <networks_separated_by_comma>
    ts-node cmd analyze <src_network> <dest_network> <sn>
    ```

### Api

- Install package
- Change `.env.example` to `.env` and configure environment settings
- Start API
    ```bash
    npm start
    ```

### Explorer

- Install package
- Configure env in `next.config.js`
- Build
    ```bash
    npm run build
    ```

- Run dev
    ```bash
    npm run dev
    ```

- Start app
    ```bash
    npm start
    ```

## References
- https://github.com/icon-project/xcall-multi/wiki/xCall-Deployment-Info
- https://docs.icon.community/cross-chain-communication/general-message-passing-xcall
