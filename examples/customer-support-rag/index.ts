import "dotenv/config";
import { buildMemory, createApp } from "./app.js";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const app = createApp(buildMemory());

app.listen(port, () => {
  console.log(`customer-support-rag listening on http://localhost:${port}`);
});
