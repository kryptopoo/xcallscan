# xcallscan APIs

This documentation describes how to use the `xcallscan` REST APIs

## NETWORK SUPPORTED

| Name  | Id  |
|--|--|
| ICON | icon |
| Binance Smart Chain | bsc |
| Ethereum | eth2  |
| Havah | havah |
| Archway | ibc_archway |
| Neutron | ibc_neutron |
| Injective | ibc_injective |
| Avalanche | avax |
| Base | base |
| Arbitrum | arbitrum |
| Optimism | optimism |

## BASE_URL

#### Mainnet: https://xcallscan.xyz/api
#### Testnet: https://testnet.xcallscan.xyz/api

## /messages

Listing all messages 

#### *GET* `base_url/messages`

#### Params:

- `limit`: the maximum number of items
- `skip`: starting point within the collection of resource results
- `src_network`: *(optional)* source network
- `dest_network`: *(optional)* dest network
- `src_address`: *(optional)* sender address
- `dest_address`: *(optional)* recipient address
- `from_timestamp`: *(optional)* from block timestamp
- `to_timestamp`: *(optional)* to block timestamp

## /messages/:id

Get message by id

#### *GET* `base_url/messages/:id`

#### Params:

- `:id`: message id


## /search

Search messages by tx hash or serial number

#### *GET* `base_url/search`

#### Params:

- `value`: tx hash OR sn


## /statistics/total_messages

Get total messages by networks

#### *GET* `base_url/statistics/total_messages`

#### Params:

- `src_network`: *(optional)* source network, eg: `icon`, `bsc`...
- `dest_network`: *(optional)* destination network, eg: `icon`, `bsc`...
- `status`: *(optional)* message status, one of values `pending`, `delivered`, `executed`, `rollbacked`

