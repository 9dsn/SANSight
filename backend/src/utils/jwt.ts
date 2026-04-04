/** Short-lived session JWTs; sub claim holds internal user id. Cookie + Authorization both supported in auth middleware. */
import jwt from "jsonwebtoken";
import { env } from "../config/env";

type SessionPayload = {
  sub: string;
};

const EXPIRATION = "7d";

export const signSessionToken = (userId: string) =>
  jwt.sign({ sub: userId } satisfies SessionPayload, env.JWT_SECRET, {
    expiresIn: EXPIRATION
  });

export const verifySessionToken = (token: string) =>
  jwt.verify(token, env.JWT_SECRET) as SessionPayload;
