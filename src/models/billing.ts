import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * Stage Two billing primitives — defined now, never written to in Stage One.
 *
 * They exist so that switching monetisation on is a policy change plus a
 * credit top-up flow, not a schema migration against a live directory. A
 * wallet is created lazily with a zero balance; nothing ever debits it while
 * `PlatformConfig.monetizationEnabled` is false.
 */

const walletSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    creditBalance: { type: Number, default: 0, min: 0 },
    lifetimeTopUp: { type: Number, default: 0 },
    lifetimeSpend: { type: Number, default: 0 },
    currency: { type: String, default: "NGN" },
  },
  { timestamps: true },
);

const creditTransactionSchema = new Schema(
  {
    walletId: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["topup", "lead_charge", "refund", "bonus", "adjustment"],
      required: true,
    },

    /** Signed: positive credits in, negative credits out. */
    amount: { type: Number, required: true },
    /** Running balance after this entry — an append-only ledger. */
    balanceAfter: { type: Number, required: true },

    /** Set when type is lead_charge. */
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", default: null },

    /** Paystack/Flutterwave reference when type is topup. */
    reference: { type: String, default: null, index: true },
    provider: { type: String, default: null },

    note: { type: String, default: "" },
  },
  { timestamps: true },
);

creditTransactionSchema.index({ userId: 1, createdAt: -1 });

export type WalletDoc = InferSchemaType<typeof walletSchema> & { _id: string };
export type CreditTransactionDoc = InferSchemaType<
  typeof creditTransactionSchema
> & { _id: string };

export const Wallet: Model<WalletDoc> =
  (models.Wallet as Model<WalletDoc>) ?? model<WalletDoc>("Wallet", walletSchema);

export const CreditTransaction: Model<CreditTransactionDoc> =
  (models.CreditTransaction as Model<CreditTransactionDoc>) ??
  model<CreditTransactionDoc>("CreditTransaction", creditTransactionSchema);
