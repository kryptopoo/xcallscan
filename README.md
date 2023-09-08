# xCallScan

xCallScan is an Explorer that allows users to look up relay messages and transactions being sent through xCall.

xCallScan is typically made of:

1. Indexer: that fetches the raw data from the on-chain, extracts, transforms, and stores it in the database in an efficient way to provide quick access to the blockchain data

2. API: an API that queries the database

3. Explorer: A frontend app that displays the data

## Live: http://testnet.xcallscan.xyz

## Demo 


## Screenshots


## Indexer

- Install package
- Change `.env.example` to `.env` and configure environment settings
- Initialize database 
```bash
ts-node cmd initdb
```

- Command
```bash
ts-node cmd scan icon|havah|eth2|bsc CallMessageSent
ts-node cmd fletch icon|havah|eth2|bsc
ts-node cmd sync from_sn to_sn
```

- Start indexer
```bash
npm start
```

## Api

- Install package
- Change `.env.example` to `.env` and configure environment settings
- Start API
    ```
    npm start
    ```

## Explorer

- Install package
- Configure env in `next.config.js`
- Build
    ```
    npm run build
    ```

- Run dev
    ```
    npm run dev
    ```

- Start app
    ```
    npm start
    ```

## What's next
- This is still under testing and known issues found.
- Improving Indexer to fetch data faster.
- Improving Explorer UI/UX, supporting mobile responsiveness.