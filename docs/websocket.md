# Web Socket

xCallScan enables one-way socket connections, allow the client side to subscribe to new messages in real time.


### Html example

```javascript
const ws = new WebSocket("ws://localhost:8080");
ws.addEventListener('message', function (event) {
    console.log(event.data);
});
```

### Nodejs example

https://www.npmjs.com/package/ws

```javascript
import WebSocket from 'ws';
const ws = new WebSocket('ws://localhost:8080');
ws.on('message', function message(data) {
  console.log('received: %s', data);
});
```