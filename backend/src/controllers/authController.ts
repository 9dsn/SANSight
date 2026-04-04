/** World ID login: verify proof, upsert user by nullifier, issue JWT + httpOnly signed session cookie. */
import { Request, Response } from "express";
import { env } from "../config/env";
import { userService } from "../services/userService";
import { worldIdService } from "../services/worldIdService";
import { signSessionToken } from "../utils/jwt";

export const authController = {
  async verifyWorldId(req: Request, res: Response) {
    const { payload, action, signal } = req.body as {
      payload: Parameters<typeof worldIdService.verifyProof>[0];
      action: string;
      signal?: string;
    };
    const { nullifierHash, verification } = await worldIdService.verifyProof(payload, action, signal);
    const user = await userService.findOrCreateByNullifier(nullifierHash);
    const token = signSessionToken(user.id);

    res.cookie("sans_session", token, {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: "lax",
      signed: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      token,
      user: {
        id: user.id
      },
      verification
    });
  }
};
