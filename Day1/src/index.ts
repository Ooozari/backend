import express, { Request, Response } from "express";

const app = express();
const port = 3000;

// Basic GET route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

// Start server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
