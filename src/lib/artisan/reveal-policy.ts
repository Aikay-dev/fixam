import "server-only";

import { getPlatformConfig } from "@/models/platform-config";

/**
 * ⭐⭐ THE STAGE TWO SWITCH.
 *
 * This is the ONLY place that decides whether a customer may see an artisan's
 * phone number, and what that reveal costs. Nothing else in the codebase
 * knows about pricing.
 *
 * Stage One: monetizationEnabled is false, so every reveal is allowed and
 * costs zero. Leads are still written, with `billingStatus: "free"`.
 *
 * Stage Two, when the free platform has proven demand: flip
 * `monetizationEnabled` in /admin/settings and implement the branch below —
 * read the artisan's wallet, return the credit cost, and let the caller debit
 * it. The reveal endpoint, the lead schema, the artisan dashboard and the
 * customer UI all stay exactly as they are.
 *
 * There is a regression test for this claim: `npm run test:stage-two` flips
 * the flag and asserts nothing outside this file needs to change.
 */

export type RevealDecision =
  | { allowed: true; cost: number; chargeable: boolean; reason?: never }
  | { allowed: false; cost: 0; chargeable: false; reason: RevealDenialReason };

export type RevealDenialReason =
  | "insufficient_credits"
  | "artisan_unavailable"
  | "monetization_error";

export type RevealContext = {
  customerUserId: string;
  artisanUserId: string;
  artisanProfileId: string;
  /** True when this customer already revealed this artisan in the window. */
  isDuplicate: boolean;
};

export async function canRevealContact(
  context: RevealContext,
): Promise<RevealDecision> {
  const config = await getPlatformConfig();

  // ---- Stage One -------------------------------------------------------
  if (!config.monetizationEnabled) {
    return { allowed: true, cost: 0, chargeable: false };
  }

  // ---- Stage Two -------------------------------------------------------
  // Repeat contact inside the dedupe window is never charged twice: the
  // artisan already paid for this customer.
  if (context.isDuplicate) {
    return { allowed: true, cost: 0, chargeable: false };
  }

  // When the meter is switched on, this is where the artisan's wallet is
  // checked and the cost returned. Deliberately not implemented in Stage One
  // rather than half-implemented against an untested schema.
  //
  //   const wallet = await Wallet.findOne({ userId: context.artisanUserId });
  //   const cost = config.defaultLeadCreditCost;
  //   if (!wallet || wallet.creditBalance < cost) {
  //     return { allowed: false, cost: 0, chargeable: false,
  //              reason: "insufficient_credits" };
  //   }
  //   return { allowed: true, cost, chargeable: true };

  console.warn(
    "[reveal-policy] monetizationEnabled is true but Stage Two billing is not implemented — allowing the reveal for free rather than blocking customers.",
  );

  // Fail OPEN, not closed. A billing bug must never stop a customer reaching
  // an artisan — that breaks the marketplace for both sides at once, and lost
  // trust costs far more than an uncharged lead.
  return { allowed: true, cost: 0, chargeable: false };
}

/** Human-readable copy for a denial. */
export function revealDenialMessage(reason: RevealDenialReason): string {
  switch (reason) {
    case "insufficient_credits":
      return "This artisan can't take new enquiries right now. Try another artisan nearby.";
    case "artisan_unavailable":
      return "This artisan isn't accepting new jobs at the moment.";
    default:
      return "Couldn't show the number right now. Please try again.";
  }
}
