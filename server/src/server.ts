import path from "path";
import express, { Request, Response } from "express";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json());

const clients: Response[] = [];

// -----------------------
// שמירה של הסטטוסים בשרת
// -----------------------
interface StatusRecord {
  atlasUrl: string;
  status: string;
}
const statuses: StatusRecord[] = [];

// -----------------------
// SSE – רישום לקוחות
// -----------------------
app.get("/events", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.push(res);

  req.on("close", () => {
    const index = clients.indexOf(res);
    if (index !== -1) clients.splice(index, 1);
  });
});

// -----------------------
// שליחת עדכון סטטוס
// -----------------------
app.post("/running-status", (req: Request, res: Response) => {
  const update = req.body as StatusRecord;
  console.log("Received update:", update);

  const index = statuses.findIndex((s) => s.atlasUrl === update.atlasUrl);
  if (index !== -1) {
    statuses[index] = update;
  } else {
    statuses.push(update);
  }

  clients.forEach((client) => {
    client.write(`data: ${JSON.stringify(update)}\n\n`);
  });

  res.json({ success: true });
});

// -----------------------
// החזרת כל הסטטוסים הקיימים
// -----------------------
app.get("/running-status", (req: Request, res: Response) => {
  res.json(statuses);
});

// -----------------------
// סטטי Angular
// -----------------------
const publicDir = path.join(__dirname, "..", "dist/my-automation-ui/browser");
app.use(express.static(publicDir));

// כל route אחר -> index.html (כדי ש־Angular Router יעבוד גם ברענון)
app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// -----------------------
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
