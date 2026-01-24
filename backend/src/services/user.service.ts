import prisma from "../helpers/prisma";

export const findOrCreateUser = async ({
  chain,
  address,
  signature,
  referId,
}: {
  chain: string;
  address: string;
  signature: string;
  referId?: number;
}) => {
  // A. Check if this specific Wallet already exists
  const existingWallet = await prisma.links.findUnique({
    where: {
      address_chain: {
        address: address,
        chain: chain,
      },
    },
    include: { user: true },
  });

  // -> Login existing user
  if (existingWallet) {
    return {
      user: signature === existingWallet.signature ? existingWallet.user : null,
      isNewUser: false,
    };
  }

  // B. Handle Referral (If exists)
  let referrer = null;
  if (referId) {
    referrer = await prisma.user.findUnique({
      where: { id: referId },
    });
  }

  // C. Create New User AND Wallet
  // We use a transaction or nested create to ensure both exist
  const newUser = await prisma.user.create({
    data: {
      // Create the wallet relation immediately
      links: {
        create: {
          address: address,
          chain: chain,
          signature,
        },
      },
      // If referrer exists, link it
      refereed: referrer
        ? {
            create: {
              referrerId: referrer.id,
            },
          }
        : undefined,
    },
  });

  if (!newUser) {
    throw new Error("User creation failed.");
  }

  // D. Update Referrer Stats (if applicable)
  if (referrer) {
    await prisma.user.update({
      where: { id: referrer.id },
      data: {
        friends: { increment: 1 },
      },
    });
  }

  return { user: newUser, isNewUser: true };
};
export const linkWallet = async (userId, { chain, address, signature }) => {
  return await prisma.links.create({
    data: {
      userId,
      chain,
      address,
      signature,
    },
  });
};
export const getUser = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: { links: true },
  });
};

export const getFriends = async ({ page, limit, sort }, userId) => {
  const skip = (page - 1) * limit;

  const users = await prisma.referral.findMany({
    where: {
      referrerId: userId,
    },
    skip,
    take: limit,
    orderBy: {
      referee: {
        id: "desc",
      },
    },
    include: {
      referee: {
        include: { links: true },
      },
    },
  });

  return { users };
};

const _getPeriodDates = async () => {
  const now = new Date();

  // 1. Daily Start (00:00:00 today)
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  // 2. Monthly Start (1st of current month)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 3. Weekly Start (Most recent Monday)
  const d = new Date(now);
  const day = d.getDay();
  // Adjust to Monday: If Sunday (0), subtract 6. Else subtract (day - 1)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(d.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);

  return {
    DAILY: startOfDay,
    WEEKLY: startOfWeek,
    MONTHLY: startOfMonth,
  };
};

/**
 * Get Top 10 for a specific period and token
 */
const getLeaderboard = async (period: "DAILY" | "WEEKLY" | "MONTHLY") => {
  const dates = _getPeriodDates();
  const targetDate = dates[period];

  const data = await prisma.leaderboardEntry.findMany({
    where: {
      period: period,
      startDate: targetDate,
      score: { gt: 0 },
    },
    distinct: ["userId"], // This ensures each userId appears only once
    orderBy: {
      score: "desc",
    },
    take: 10,
    include: {
      user: {
        include: { links: true },
      },
    },
  });

  return data.map((entry, index) => ({
    rank: index + 1,
    userId: entry.userId,
    name: entry.user.fullName || entry.user.links[0].address,
    score: entry.score,
    level: entry.user.level,
  }));
};

export const getAllLeaderboards = async () => {
  const [daily, weekly, monthly] = await Promise.all([
    getLeaderboard("DAILY"),
    getLeaderboard("WEEKLY"),
    getLeaderboard("MONTHLY"),
  ]);

  return {
    daily,
    weekly,
    monthly,
  };
};
