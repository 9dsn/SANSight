/** Verifies World ID cloud proofs and returns the persistent nullifier hash for account linking. */
import type { ISuccessResult } from "@worldcoin/idkit-core";
import { verifyCloudProof } from "@worldcoin/idkit-core/backend";
import { env } from "../config/env";
import { HttpError } from "../utils/httpError";

export const worldIdService = {
  async verifyProof(payload: ISuccessResult, action: string, signal?: string) {
    if (!env.worldIdActions.includes(action)) {
      throw new HttpError(400, "Unsupported World ID action");
    }

    const verification = await verifyCloudProof(
      payload,
      env.WORLD_ID_APP_ID as `app_${string}`,
      action,
      signal
    );

    if (!verification.success) {
      throw new HttpError(401, "World ID proof verification failed", verification);
    }

    const nullifierHash: string | undefined = payload.nullifier_hash;

    if (!nullifierHash) {
      throw new HttpError(400, "World ID verification response did not include a nullifier hash");
    }

    return {
      nullifierHash,
      verification
    };
  }
};
