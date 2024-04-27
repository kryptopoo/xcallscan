# xcallscan APIs

This documentation describes how to use the `xcallscan` REST APIs

## BASE_URL

#### Mainnet: https://xcallscan.xyz
#### Testnet: https://testnet.xcallscan.xyz

## /api/messages

Listing all messages 

#### *GET* `base_url/api/messages`

#### Params:

- `limit`: the maximum number of items
- `skip`: tarting point within the collection of resource results


## /api/messages/:id

Get message by id

#### *GET* `base_url/api/messages/:id`

#### Params:

`:id`: message id


## /api/search

Search messages by tx hash or serial number

#### *GET* `base_url/api/search`

#### Params:

`value`: tx hash OR sn
