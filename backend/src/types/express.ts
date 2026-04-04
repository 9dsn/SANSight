/** After requireAuth, req.userId is the authenticated user's UUID. */
declare namespace Express {
  interface Request {
    userId?: string;
  }
}
