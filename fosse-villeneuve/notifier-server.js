import notifier from "node-notifier";
import net from "node:net";

const server = net.createServer((c) => {
  // 'connection' listener.
  console.log("client connected");
  c.setEncoding("UTF-8");
  c.on("end", () => {
    console.log("client disconnected");
  });

  c.on("data", (data) => {
    console.log("received data", data);
    notifier.notify(data);
  });
});

server.on("error", (err) => {
  throw err;
});
server.listen(8124, "127.0.0.1", () => {
  console.log("server bound on port 8124");
});
