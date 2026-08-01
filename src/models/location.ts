import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * Nigerian geography: State -> LGA -> free-text area/landmark.
 *
 * Structured rather than free text because filtering and the
 * /services/[category]/[state]/[lga] SEO pages both need stable slugs.
 * The last mile stays free text on the artisan profile ("behind Shoprite,
 * Jakande bus stop") because that is genuinely how people give directions.
 */

const stateSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    /** Standard state code, e.g. LA for Lagos, FC for FCT. */
    code: { type: String, required: true, uppercase: true },

    /**
     * Launch cities. All 36 + FCT are seeded so artisans anywhere can sign up,
     * but the marketing surface starts with Lagos only.
     */
    isLaunchCity: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },

    artisanCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const lgaSchema = new Schema(
  {
    stateId: {
      type: Schema.Types.ObjectId,
      ref: "State",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, index: true },

    /** Neighbourhoods people actually name: Lekki, Ikate, Agungi, Ikota. */
    popularAreas: { type: [String], default: [] },

    isActive: { type: Boolean, default: true },
    artisanCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Slugs repeat across states (several states have an "Ifelodun"), so the
// uniqueness constraint has to be scoped to the state.
lgaSchema.index({ stateId: 1, slug: 1 }, { unique: true });

export type StateDoc = InferSchemaType<typeof stateSchema>;
export type LgaDoc = InferSchemaType<typeof lgaSchema>;

export const State: Model<StateDoc> =
  (models.State as Model<StateDoc>) ?? model<StateDoc>("State", stateSchema);

export const Lga: Model<LgaDoc> =
  (models.Lga as Model<LgaDoc>) ?? model<LgaDoc>("Lga", lgaSchema);
