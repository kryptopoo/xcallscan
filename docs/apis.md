# xcallscan APIs

This documentation describes how to use the `xcallscan` REST APIs

## Network Supported

| Name                | Id            |
| ------------------- | ------------- |
| ICON                | icon          |
| Havah               | havah         |
| Binance Smart Chain | bsc           |
| Ethereum            | eth2          |
| Avalanche           | avax          |
| Base                | base          |
| Arbitrum            | arbitrum      |
| Optimism            | optimism      |
| Polygon             | polygon       |
| Archway             | ibc_archway   |
| Neutron             | ibc_neutron   |
| Injective           | ibc_injective |
| Sui                 | sui           |
| Stellar             | stellar       |
| Solana              | solana        |

## Base URLs

#### Mainnet: https://xcallscan.xyz/api

#### Testnet: https://testnet.xcallscan.xyz/api

## /messages

Listing messages

#### _GET_ `base_url/messages`

#### Params:

-   `limit`: the maximum number of items
-   `skip`: starting point within the collection of resource results
-   `src_network`: _(optional)_ source network
-   `dest_network`: _(optional)_ dest network
-   `src_address`: _(optional)_ sender address
-   `dest_address`: _(optional)_ recipient address
-   `from_timestamp`: _(optional)_ from block timestamp
-   `to_timestamp`: _(optional)_ to block timestamp
-   `status`: _(optional)_ message status, one of values `pending`, `delivered`, `executed`, `rollbacked`

## /messages/:id

Get message by id

#### _GET_ `base_url/messages/:id`

#### Params:

-   `:id`: message id

## /search

Search messages by tx hash or serial number

#### _GET_ `base_url/search`

#### Params:

-   `value`: tx hash OR sn

## /statistics/total_messages

Get total number of messages

#### _GET_ `base_url/statistics/total_messages`

#### Params:

-   `src_networks`: _(optional)_ source networks separated by `,`, eg: `icon,bsc`...
-   `dest_networks`: _(optional)_ destination networks separated by `,`, eg: `icon,bsc`...
-   `from_timestamp`: _(optional)_ from block timestamp
-   `to_timestamp`: _(optional)_ to block timestamp
-   `status`: _(optional)_ message status, one of values `pending`, `delivered`, `executed`, `rollbacked`

## /rpc/block_height

Get latest block height of networks

#### _GET_ `base_url/rpc/block_height`

#### Params:

-   `networks`: _(optional)_ networks separated by `,`, eg: `icon,bsc`...
