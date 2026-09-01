import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Request, type Response } from "express";

import { globalErrorHandler } from "./middleware/global-error-handler.js";
import { notFound } from "./middleware/not-found.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (_req: Request, res: Response) => {
  res.json({ success: true, message: "LifeLine Dispatch API is running" });
});

//main routes



app.use(notFound);
app.use(globalErrorHandler);

export default app;
