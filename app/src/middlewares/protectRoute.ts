import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function protectRoute(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.t;
  if (!token) {
    return res.redirect("/login");
  }
  try {
    jwt.verify(token, process.env.SECRET as string);
    next();
  } catch (err) {
    return res.redirect("/login");
  }
}
