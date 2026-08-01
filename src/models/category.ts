import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * Two-level taxonomy: groups (parentId null) contain leaf trades.
 *
 * Categories carry their own SEO copy because every leaf becomes a landing
 * page — /services/plumber and /services/plumber/lagos/lekki — and generic
 * boilerplate across 90 pages reads as thin content to Google.
 */
const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },

    /** Null for a top-level group. */
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },

    description: { type: String, default: "" },

    /** lucide-react icon name, resolved client-side. */
    icon: { type: String, default: "Wrench" },

    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },

    /**
     * What Nigerians actually type. "AC guy", "fridge engineer", "POP man".
     * Fed into the search text index so colloquial queries still match.
     */
    synonyms: { type: [String], default: [] },

    /** Denormalised count of approved artisans, for directory sorting. */
    artisanCount: { type: Number, default: 0 },

    // SEO
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    h1: { type: String, default: "" },
    introCopy: { type: String, default: "" },
  },
  { timestamps: true },
);

categorySchema.index({ parentId: 1, order: 1 });
categorySchema.index({ name: "text", synonyms: "text" });

export type CategoryDoc = InferSchemaType<typeof categorySchema>;

export const Category: Model<CategoryDoc> =
  (models.Category as Model<CategoryDoc>) ??
  model<CategoryDoc>("Category", categorySchema);
