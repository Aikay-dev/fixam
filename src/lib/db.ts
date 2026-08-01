import mongoose, { type Mongoose } from "mongoose";

import { env, isProduction } from "@/lib/env";

/**
 * Mongoose connection singleton.
 *
 * Next.js re-evaluates modules on every HMR pass in dev, and serverless
 * invocations reuse warm containers in production. Both cases will happily
 * open a new connection per module evaluation and exhaust the Atlas
 * connection pool, so the live connection (and the in-flight promise, so
 * concurrent callers don't race) is cached on globalThis.
 */

type MongooseCache = {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

const globalForMongoose = globalThis as unknown as {
  _fixamMongoose?: MongooseCache;
};

const cache: MongooseCache = globalForMongoose._fixamMongoose ?? {
  conn: null,
  promise: null,
};

globalForMongoose._fixamMongoose = cache;

// Reject writes containing paths not declared in the schema instead of
// silently dropping them — a silent drop on ArtisanProfile would be a very
// expensive bug to find later.
mongoose.set("strictQuery", true);

if (!isProduction) {
  mongoose.set("debug", process.env.MONGOOSE_DEBUG === "true");
}

export async function connectDB(): Promise<Mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(env.MONGODB_URI, {
        dbName: env.MONGODB_DB_NAME,
        // Fail fast rather than hanging a request for 30s when Atlas is
        // unreachable — a Nigerian mobile user will have abandoned by then.
        serverSelectionTimeoutMS: 10_000,
        socketTimeoutMS: 45_000,
        maxPoolSize: 10,
        minPoolSize: 1,
        retryWrites: true,
      })
      .then((m) => m);
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    // Clear the cached promise so the next request retries instead of
    // permanently re-awaiting a rejected promise.
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}

export async function disconnectDB(): Promise<void> {
  if (cache.conn) {
    await mongoose.disconnect();
    cache.conn = null;
    cache.promise = null;
  }
}

export { mongoose };
