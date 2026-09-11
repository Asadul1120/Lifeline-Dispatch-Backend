
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";
import express, { type Request, type Response } from "express";

import { globalErrorHandler } from "./middleware/global-error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { authRoutes } from "./modules/auth/auth.route.ts";
import { userRoutes } from "./modules/user/user.route.ts";
import { driverRoutes } from "./modules/driver/driver.route.ts";
import { adminRoutes } from "./modules/admin/admin.route.ts";


const app = express();


// EJS setup
app.set("view engine", "ejs");
app.set(
  "views",
  path.join(process.cwd(), "src", "templates")
);


app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());


app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "LifeLine Dispatch API is running",
  });
});


// Google Login Test Page
app.get("/google-login", (_req: Request, res: Response) => {
  res.render("google-login", {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  });
});


// Main routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/driver", driverRoutes);
app.use("/api/v1/admin", adminRoutes);




// Error handling middleware
app.use(notFound);
app.use(globalErrorHandler);


export default app;