# Web Socket

xCallScan enables one-way socket connections, allow the client side to subscribe to new messages in real time.

## URLs
- `Mainnet`: wss://xcallscan.xyz/ws
- `Testnet`: wss://testnet.xcallscan.xyz/ws


## Examples

### Html

```javascript
const ws = new WebSocket('wss://xcallscan.xyz/ws')
ws.addEventListener('message', function (event) {
    console.log(event.data)
})
```

### Nodejs

https://www.npmjs.com/package/ws

```javascript
import WebSocket from 'ws'
const ws = new WebSocket('wss://xcallscan.xyz/ws')
ws.on('message', function message(data) {
    console.log('received', JSON.parse(data.toString()))
})
```