# xCallScan

xCallScan is an Explorer that allows users to look up relay messages and transactions being sent through [xCall Service](https://www.xcall.dev).

xCallScan is typically made of:

1. Indexer: that fetches the raw data from the on-chain, extracts, transforms, and stores it in the database in an efficient way to provide quick access to the blockchain data

2. API: an API that queries the database

3. Explorer: A frontend app that displays the data


### Highlevel architecture

<img src="https://github.com/kryptopoo/xcallscan/blob/master/docs/screenshots/xcallscan-highlevel-architecture.png" width="800" >


### Screenshots

<img src="https://github.com/kryptopoo/xcallscan/blob/master/docs/screenshots/homepage.png" width="800" >


### Live: http://testnet.xcallscan.xyz



## Getting started

### Indexer

- Install package
- Change `.env.example` to `.env` and configure environment settings
- Initialize database 
    ```bash
    ts-node cmd initdb
    ```

- Start indexer
    ```bash
    npm start
    ```

- Command
    ```bash
    ts-node cmd scan <network> <event>
    ts-node cmd fletch <network>
    ts-node cmd sync <from_sn> <to_sn>
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

## What's next
- This is still under testing and known issues found.
- Improving Indexer to fetch data faster.
- Improving Explorer UI/UX, supporting mobile responsiveness.