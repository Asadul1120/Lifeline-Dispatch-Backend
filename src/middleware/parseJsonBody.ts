import { Request, Response, NextFunction } from "express";

const parseJsonBody = (req: Request, _res: Response, next: NextFunction) => {
  if (typeof req.body?.data === "string") {
    try {
      req.body = JSON.parse(req.body.data);
    } catch {
      req.body = {};
    }
  }

  next();
};

export default parseJsonBody;
