import * as Redis from "redis";

let client;
export const initRedis = async () => {
  try {
    client = await Redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || "localhost",
        port: 6379,
      },
      username: process.env.REDIS_USERNAME || "default",
      password: process.env.REDIS_PASSWORD,
      database: Number(process.env.REDIS_DEX_DATABASE) || 9,
    });
    await client.connect();
    console.log("********************* init redis *********************");
  } catch (err) {
    console.error(err);
  }
};

// Keys for tracking online users
const ONLINE_USERS_10_MIN_KEY = "onlineUsers10Min";
const ONLINE_USERS_24_HOUR_KEY = "onlineUsers24Hour";
const USER_STATS_CHART = "userStatChart";

export const getString = async (key: string) => await client.get(key);

export const setString = async (key: string, value: string) =>
  await client.set(key, value);

export const setStringWithTTL = async (
  key: string,
  value: string,
  ttl = 86400
) => await client.setEx(key, ttl, value);

export const removeString = async (key: string) => await client.del(key);

export const cacheUserStatChart = async (data: any) => {
  await setStringWithTTL(USER_STATS_CHART, JSON.stringify(data), 43200); // Cache for 12h
};

export const getCachedUserStatChart = async () => {
  const cachedData = await getString(USER_STATS_CHART);
  return cachedData ? JSON.parse(cachedData) : null;
};

export const cleanDB = async () => client.flushDb();

// Function to mark a user as online
export const markUserOnline = async (userId: string) => {
  const timestamp = Date.now();

  // Add user to both sorted sets with the current timestamp
  await client.zAdd(ONLINE_USERS_10_MIN_KEY, {
    score: timestamp,
    value: userId,
  });
  await client.zAdd(ONLINE_USERS_24_HOUR_KEY, {
    score: timestamp,
    value: userId,
  });
};

// Function to get users who were online in the last 10 minutes
export const getRecentOnlineUsers10Min = async () => {
  const now = Date.now();
  const tenMinutesAgo = now - 10 * 60 * 1000;

  return await client.zCount(ONLINE_USERS_10_MIN_KEY, tenMinutesAgo, now);
};

// Function to get users who were online in the last 24 hours
export const getRecentOnlineUsers24Hour = async () => {
  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

  return await client.zCount(ONLINE_USERS_24_HOUR_KEY, twentyFourHoursAgo, now);
};

// Function to clean up entries in the 10-minute and 24-hour sets
export const cleanUpOldEntries10Min = async () => {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  await client.zRemRangeByScore(ONLINE_USERS_10_MIN_KEY, 0, tenMinutesAgo);
};

export const cleanUpOldEntries24Hour = async () => {
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  await client.zRemRangeByScore(
    ONLINE_USERS_24_HOUR_KEY,
    0,
    twentyFourHoursAgo
  );
};

// Set intervals to clean up each sorted set at appropriate times
setInterval(cleanUpOldEntries10Min, 5 * 60 * 1000); // Run every 5 minutes
setInterval(cleanUpOldEntries24Hour, 24 * 60 * 60 * 1000); // Run every 24 hours
