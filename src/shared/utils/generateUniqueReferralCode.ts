import type { Prisma } from "@prisma/client";

/**
 * Generates a secure, unique referral code for a new user
 * Example: "SUMIT5432"
 */
export const generateUniqueReferralCode = async (
  tx: Prisma.TransactionClient,
  username: string,
) => {
  const base = (username || "USER").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  let code = `${base}${Math.floor(1000 + Math.random() * 9000)}`;

  // Use transaction client 'tx' for lock safety during generation
  let isTaken = await tx.user_referral.findUnique({
    where: { referralCode: code },
  });

  // Loop in case of collision (redundant safety)
  while (isTaken) {
    code = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    isTaken = await tx.user_referral.findUnique({
      where: { referralCode: code },
    });
  }

  return code;
};
