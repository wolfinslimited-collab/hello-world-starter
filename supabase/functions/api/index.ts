import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ==================== MATH UTILITIES ====================
const math = {
  sum: (...args: number[]): number => {
    return args.reduce((acc, val) => {
      const factor = 1e12;
      return (Math.round(acc * factor) + Math.round(val * factor)) / factor;
    }, 0);
  },
  mine: (...args: number[]): number => {
    if (args.length === 0) return 0;
    return args.slice(1).reduce((acc, val) => {
      const factor = 1e12;
      return (Math.round(acc * factor) - Math.round(val * factor)) / factor;
    }, args[0]);
  },
  mul: (...args: number[]): number => {
    return args.reduce((acc, val) => {
      const factor = 1e12;
      return (Math.round(acc * factor) * Math.round(val * factor)) / (factor * factor);
    }, 1);
  },
  div: (a: number, b: number): number => {
    if (b === 0) throw new Error("Division by zero");
    const factor = 1e12;
    return Math.round(a * factor) / Math.round(b * factor);
  },
  normal: (num: number): number => {
    return Math.round(num * 1e12) / 1e12;
  },
  round: (num: number, decimals: number): number => {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  },
};

// ==================== AUTH HELPERS ====================
async function createHmacToken(userId: number): Promise<string> {
  const salt = Deno.env.get("SECRET_SALT") || "DEX_DEFAULT_SECRET";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(salt),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(String(userId)));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Response helpers
const success = (data: any) =>
  new Response(JSON.stringify({ success: true, ...data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const error = (message: string, status = 400) =>
  new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Get authenticated user from token
async function getAuthUser(supabase: any, token: string) {
  if (!token) return null;
  
  const { data } = await supabase
    .from("auth_tokens")
    .select("user_id, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!data) return null;
  if (new Date(data.expires_at) < new Date()) return null;

  const { data: user } = await supabase
    .from("users")
    .select("*, links(*)")
    .eq("id", data.user_id)
    .maybeSingle();

  return user;
}

// ==================== LEADERBOARD HELPER ====================
async function updateLeaderboard(supabase: any, userId: number, amount: number) {
  if (amount <= 0) return;

  const now = new Date();

  // Calculate start dates
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const d = new Date(now);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(d.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);

  const periods = [
    { type: "DAILY", date: startOfDay.toISOString().split("T")[0] },
    { type: "WEEKLY", date: startOfWeek.toISOString().split("T")[0] },
    { type: "MONTHLY", date: startOfMonth.toISOString().split("T")[0] },
  ];

  for (const p of periods) {
    // Check if entry exists
    const { data: existing } = await supabase
      .from("leaderboard_entries")
      .select("id, score")
      .eq("user_id", userId)
      .eq("period", p.type)
      .eq("start_date", p.date)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("leaderboard_entries")
        .update({ score: math.sum(existing.score, amount) })
        .eq("id", existing.id);
    } else {
      await supabase.from("leaderboard_entries").insert({
        user_id: userId,
        period: p.type,
        start_date: p.date,
        score: amount,
      });
    }
  }
}

// ==================== WALLET HELPERS ====================
async function modifyWallet(
  supabase: any,
  userId: number,
  amount: number,
  identifier: { assetId?: number; assetSymbol?: string; walletId?: number }
): Promise<{ success: boolean; wallet?: any; error?: string }> {
  try {
    let targetAssetId: number | null = null;
    const newAmount = math.normal(amount);

    if (identifier.walletId) {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("id", identifier.walletId)
        .maybeSingle();
      if (!wallet) throw new Error("Wallet not found");
      if (wallet.user_id !== userId) throw new Error("Wallet does not belong to user");
      targetAssetId = wallet.asset_id;
    } else if (identifier.assetId) {
      targetAssetId = identifier.assetId;
    } else if (identifier.assetSymbol) {
      const { data: asset } = await supabase
        .from("assets")
        .select("id")
        .eq("symbol", identifier.assetSymbol)
        .maybeSingle();
      if (!asset) throw new Error(`Asset ${identifier.assetSymbol} not found`);
      targetAssetId = asset.id;
    }

    if (!targetAssetId) throw new Error("Could not determine Asset ID");

    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .eq("asset_id", targetAssetId)
      .maybeSingle();

    const currentBalance = wallet?.balance || 0;
    const newBalance = math.sum(currentBalance, newAmount);

    if (wallet) {
      const { data: updatedWallet } = await supabase
        .from("wallets")
        .update({ balance: newBalance })
        .eq("id", wallet.id)
        .select()
        .single();
      return { success: true, wallet: updatedWallet };
    } else {
      const { data: newWallet } = await supabase
        .from("wallets")
        .insert({
          user_id: userId,
          asset_id: targetAssetId,
          balance: newAmount,
        })
        .select()
        .single();
      return { success: true, wallet: newWallet };
    }
  } catch (err: any) {
    console.error("Modify Wallet Error:", err.message);
    return { success: false, error: err.message };
  }
}

// ==================== MAIN HANDLER ====================
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace("/api", "");
  const method = req.method;

  // Create Supabase client with service role for full access
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Extract auth token if present
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  try {
    // ==================== USER ROUTES ====================
    if (path === "/user/auth" && method === "POST") {
      const { chain, address, signature, refId } = await req.json();

      // Check if wallet exists
      const { data: existingLink } = await supabase
        .from("links")
        .select("*, user:users(*)")
        .eq("address", address)
        .eq("chain", chain)
        .maybeSingle();

      let user;
      let isNewUser = false;

      if (existingLink) {
        // Login existing user
        if (signature !== existingLink.signature) {
          return error("Invalid signature", 401);
        }
        user = existingLink.user;
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({})
          .select()
          .single();

        if (createError) throw createError;

        // Create link
        await supabase.from("links").insert({
          user_id: newUser.id,
          address,
          chain,
          signature,
        });

        // Handle referral
        if (refId) {
          const { data: referrer } = await supabase
            .from("users")
            .select("id, friends")
            .eq("id", refId)
            .maybeSingle();

          if (referrer) {
            await supabase.from("referrals").insert({
              referrer_id: referrer.id,
              referee_id: newUser.id,
            });
            await supabase
              .from("users")
              .update({ friends: (referrer.friends || 0) + 1 })
              .eq("id", referrer.id);
          }
        }

        user = newUser;
        isNewUser = true;
      }

      // Create auth token
      const appToken = await createHmacToken(user.id);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await supabase.from("auth_tokens").upsert(
        {
          user_id: user.id,
          token: appToken,
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: "user_id" }
      );

      return success({ token: appToken, userId: user.id, isNewUser });
    }

    if (path === "/user/link" && method === "POST") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const { chain, address, signature } = await req.json();

      // Check if already linked
      const { data: existing } = await supabase
        .from("links")
        .select("*")
        .eq("address", address)
        .eq("chain", chain)
        .maybeSingle();

      if (existing) {
        return error("This wallet is already linked to an account");
      }

      await supabase.from("links").insert({
        user_id: user.id,
        address,
        chain,
        signature,
      });

      const { data: updatedUser } = await supabase
        .from("users")
        .select("*, links(*)")
        .eq("id", user.id)
        .single();

      return success({ user: updatedUser });
    }

    if (path === "/user/profile" && method === "GET") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const { data: tokens } = await supabase
        .from("user_tokens")
        .select("*, token:airdrop_tokens(*)")
        .eq("user_id", user.id);

      return success({ user, tokens: tokens || [] });
    }

    if (path === "/user/update" && method === "POST") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const { fullName } = await req.json();
      const { data: updatedUser } = await supabase
        .from("users")
        .update({ full_name: fullName })
        .eq("id", user.id)
        .select("*, links(*)")
        .single();

      return success({ user: updatedUser });
    }

    if (path === "/user/activate" && method === "POST") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      if (user.status === "Active") {
        return error("User already activated");
      }

      const { walletId, amount } = await req.json();

      // Get wallet and check balance
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*, asset:assets(*)")
        .eq("id", walletId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!wallet) return error("Wallet not found");

      const requiredAmount = amount / (wallet.asset?.price || 1);
      if (wallet.balance < requiredAmount) {
        return error("Insufficient balance");
      }

      // Deduct balance
      await modifyWallet(supabase, user.id, -requiredAmount, { walletId });

      // Update user status
      await supabase
        .from("users")
        .update({ status: "Active" })
        .eq("id", user.id);

      // Create transaction record
      await supabase.from("transactions").insert({
        user_id: user.id,
        amount: requiredAmount,
        type: "Out",
        tag: "Activate",
      });

      // Claim initial tokens
      const claimResult = await claimAllInitialTokens(supabase, user.id);

      const { data: updatedUser } = await supabase
        .from("users")
        .select("*, links(*)")
        .eq("id", user.id)
        .single();

      return success({ user: updatedUser, ...claimResult });
    }

    if (path === "/user/upgrade" && method === "POST") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const { walletId, amount } = await req.json();

      const { data: wallet } = await supabase
        .from("wallets")
        .select("*, asset:assets(*)")
        .eq("id", walletId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!wallet) return error("Wallet not found");

      const requiredAmount = amount / (wallet.asset?.price || 1);
      if (wallet.balance < requiredAmount) {
        return error("Insufficient balance");
      }

      await modifyWallet(supabase, user.id, -requiredAmount, { walletId });

      const newLevel = (user.level || 0) + 1;
      await supabase
        .from("users")
        .update({ level: newLevel })
        .eq("id", user.id);

      await supabase.from("transactions").insert({
        user_id: user.id,
        amount: requiredAmount,
        type: "Out",
        tag: "Spend",
      });

      const { data: updatedUser } = await supabase
        .from("users")
        .select("*, links(*)")
        .eq("id", user.id)
        .single();

      return success({ user: updatedUser });
    }

    if (path === "/user/boost" && method === "POST") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const { walletId, amount } = await req.json();

      const { data: wallet } = await supabase
        .from("wallets")
        .select("*, asset:assets(*)")
        .eq("id", walletId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!wallet) return error("Wallet not found");

      const requiredAmount = amount / (wallet.asset?.price || 1);
      if (wallet.balance < requiredAmount) {
        return error("Insufficient balance");
      }

      await modifyWallet(supabase, user.id, -requiredAmount, { walletId });

      const newBoost = (user.boost || 0) + 1;
      await supabase
        .from("users")
        .update({ boost: newBoost })
        .eq("id", user.id);

      await supabase.from("transactions").insert({
        user_id: user.id,
        amount: requiredAmount,
        type: "Out",
        tag: "Spend",
      });

      // Multiply token balances
      const multiplier = 2;
      await multiplyBalances(supabase, user.id, multiplier);

      const { data: updatedUser } = await supabase
        .from("users")
        .select("*, links(*)")
        .eq("id", user.id)
        .single();

      const { data: tokens } = await supabase
        .from("user_tokens")
        .select("*, token:airdrop_tokens(*)")
        .eq("user_id", user.id);

      return success({ user: updatedUser, tokens: tokens || [] });
    }

    if (path === "/user/friends" && method === "GET") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const page = Number(url.searchParams.get("page")) || 1;
      const limit = Number(url.searchParams.get("limit")) || 10;

      const { data: referrals } = await supabase
        .from("referrals")
        .select("*, referee:users!referee_id(*, links(*))")
        .eq("referrer_id", user.id)
        .range((page - 1) * limit, page * limit - 1);

      return success({ users: referrals || [] });
    }

    if (path === "/user/leaderboards" && method === "GET") {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(d.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);

      const getLeaderboard = async (period: string, startDate: Date) => {
        const { data } = await supabase
          .from("leaderboard_entries")
          .select("*, user:users(*, links(*))")
          .eq("period", period)
          .eq("start_date", startDate.toISOString().split("T")[0])
          .gt("score", 0)
          .order("score", { ascending: false })
          .limit(10);

        return (data || []).map((entry: any, index: number) => ({
          rank: index + 1,
          userId: entry.user_id,
          name: entry.user?.full_name || entry.user?.links?.[0]?.address || "Anonymous",
          score: entry.score,
          level: entry.user?.level || 0,
        }));
      };

      const [daily, weekly, monthly] = await Promise.all([
        getLeaderboard("DAILY", startOfDay),
        getLeaderboard("WEEKLY", startOfWeek),
        getLeaderboard("MONTHLY", startOfMonth),
      ]);

      return success({ leaders: { daily, weekly, monthly } });
    }

    // ==================== WALLET ROUTES ====================
    if (path === "/wallet/assets" && method === "GET") {
      const { data: assets } = await supabase
        .from("assets")
        .select("*, networks:asset_networks(*, network:networks(*))")
        .eq("active", true)
        .eq("visible", true);

      return success(assets || []);
    }

    if (path === "/wallet/balance" && method === "GET") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const { data: wallets } = await supabase
        .from("wallets")
        .select("*, asset:assets(*)")
        .eq("user_id", user.id);

      return success(wallets || []);
    }

    if (path === "/wallet/transactions" && method === "GET") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const { data: transactions } = await supabase
        .from("wallet_transactions")
        .select("*, asset:assets(*), network:networks(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      return success(transactions || []);
    }

    if (path === "/wallet/deposit" && method === "POST") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const { txId, amount, assetId, networkId, fromAddress } = await req.json();

      // Check for duplicate transaction
      const { data: existingTx } = await supabase
        .from("wallet_transactions")
        .select("id")
        .eq("tx_id", txId)
        .maybeSingle();

      if (existingTx) {
        return error("Transaction ID already exists");
      }

      // Verify asset network
      const { data: assetNetwork } = await supabase
        .from("asset_networks")
        .select("*, network:networks(*)")
        .eq("asset_id", assetId)
        .eq("network_id", networkId)
        .maybeSingle();

      if (!assetNetwork || !assetNetwork.can_deposit) {
        return error("Deposits are currently disabled for this asset/network");
      }

      if (amount < assetNetwork.min_deposit) {
        return error(`Minimum deposit is ${assetNetwork.min_deposit}`);
      }

      // Add to wallet
      await modifyWallet(supabase, user.id, amount, { assetId });

      // Create transaction record
      const { data: transaction } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: user.id,
          asset_id: assetId,
          network_id: networkId,
          tx_id: txId,
          amount,
          from_address: fromAddress,
          to_address: assetNetwork.network?.main_address,
          type: "Deposit",
          status: "Completed",
        })
        .select()
        .single();

      // Check and activate referral bonus
      const { data: referral } = await supabase
        .from("referrals")
        .select("*")
        .eq("referee_id", user.id)
        .eq("status", false)
        .maybeSingle();

      if (referral) {
        await supabase
          .from("referrals")
          .update({ status: true })
          .eq("id", referral.id);

        // Add referral bonus to both users
        await addStaticAmount(supabase, referral.referrer_id, 50);
        await addStaticAmount(supabase, user.id, 50);
      }

      return success({ transaction });
    }

    if (path === "/wallet/withdraw" && method === "POST") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const { amount, assetId, networkId, toAddress } = await req.json();

      // Verify asset network
      const { data: assetNetwork } = await supabase
        .from("asset_networks")
        .select("*")
        .eq("asset_id", assetId)
        .eq("network_id", networkId)
        .maybeSingle();

      if (!assetNetwork || !assetNetwork.can_withdraw) {
        return error("Withdrawals are currently disabled for this asset/network");
      }

      if (amount < assetNetwork.min_withdraw) {
        return error(`Minimum withdrawal is ${assetNetwork.min_withdraw}`);
      }

      // Check balance
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .eq("asset_id", assetId)
        .maybeSingle();

      const fee = assetNetwork.withdraw_fee || 0;
      const totalRequired = math.sum(amount, fee);

      if (!wallet || wallet.balance < totalRequired) {
        return error("Insufficient balance");
      }

      // Deduct from wallet
      await modifyWallet(supabase, user.id, -totalRequired, { assetId });

      // Create pending withdrawal
      const { data: transaction } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: user.id,
          asset_id: assetId,
          network_id: networkId,
          amount,
          to_address: toAddress,
          type: "Withdraw",
          status: "Pending",
          memo: JSON.stringify({ fee }),
        })
        .select()
        .single();

      return success({ transaction, fee, finalAmount: amount });
    }

    // ==================== TRADE ROUTES ====================
    if (path === "/trade/pairs" && method === "GET") {
      const { data: pairs } = await supabase
        .from("trading_pairs")
        .select("*")
        .eq("active", true);

      return success(pairs || []);
    }

    if (path === "/trade/submit" && method === "POST") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const { pair, side, type, quantity, price, leverage = 1, isIsolated = true } = await req.json();

      // Get trading pair
      const { data: tradingPair } = await supabase
        .from("trading_pairs")
        .select("*")
        .eq("id", pair)
        .eq("active", true)
        .maybeSingle();

      if (!tradingPair) return error("Trading pair not found or inactive");

      // Get quote asset (usually USDT)
      const { data: quoteAsset } = await supabase
        .from("assets")
        .select("*")
        .eq("id", tradingPair.quote_asset_id)
        .maybeSingle();

      if (!quoteAsset) return error("Quote asset not found");

      // Calculate required margin
      const orderPrice = type === "MARKET" ? 0 : price; // Market orders use current price
      const notionalValue = math.mul(quantity, orderPrice || 1);
      const requiredMargin = math.div(notionalValue, leverage);

      // Check wallet balance
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .eq("asset_id", tradingPair.quote_asset_id)
        .maybeSingle();

      if (!wallet || wallet.balance < requiredMargin) {
        return error("Insufficient margin");
      }

      // Lock funds
      await supabase
        .from("wallets")
        .update({
          balance: math.mine(wallet.balance, requiredMargin),
          locked: math.sum(wallet.locked || 0, requiredMargin),
        })
        .eq("id", wallet.id);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          pair_id: pair,
          side,
          type,
          quantity,
          price: orderPrice,
          leverage,
          is_isolated: isIsolated,
          status: "PENDING",
        })
        .select()
        .single();

      if (orderError) {
        // Refund locked funds
        await supabase
          .from("wallets")
          .update({
            balance: math.sum(wallet.balance, requiredMargin),
            locked: math.mine(wallet.locked || 0, requiredMargin),
          })
          .eq("id", wallet.id);
        throw orderError;
      }

      return success({ orderId: order.id, order });
    }

    if (path === "/trade/cancel" && method === "POST") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const { orderId } = await req.json();

      const { data: order } = await supabase
        .from("orders")
        .select("*, pair:trading_pairs(*)")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!order) return error("Order not found");
      if (order.status !== "PENDING" && order.status !== "OPEN") {
        return error("Order cannot be canceled");
      }

      // Calculate refund
      const remainingQty = math.mine(order.quantity, order.filled_qty);
      const refundMargin = math.div(
        math.mul(remainingQty, order.price || 1),
        order.leverage
      );

      // Refund to wallet
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .eq("asset_id", order.pair.quote_asset_id)
        .maybeSingle();

      if (wallet) {
        await supabase
          .from("wallets")
          .update({
            balance: math.sum(wallet.balance, refundMargin),
            locked: math.mine(wallet.locked || 0, refundMargin),
          })
          .eq("id", wallet.id);
      }

      // Update order status
      await supabase
        .from("orders")
        .update({ status: "CANCELED" })
        .eq("id", orderId);

      return success({ canceled: true });
    }

    if (path === "/trade/orders" && method === "GET") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const pairId = url.searchParams.get("pairId");
      let query = supabase
        .from("orders")
        .select("*, pair:trading_pairs(*)")
        .eq("user_id", user.id)
        .in("status", ["PENDING", "OPEN"]);

      if (pairId) query = query.eq("pair_id", Number(pairId));

      const { data: orders } = await query.order("created_at", { ascending: false });
      return success(orders || []);
    }

    if (path === "/trade/positions" && method === "GET") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const pairId = url.searchParams.get("pairId");
      let query = supabase
        .from("positions")
        .select("*, pair:trading_pairs(*)")
        .eq("user_id", user.id)
        .eq("is_open", true);

      if (pairId) query = query.eq("pair_id", Number(pairId));

      const { data: positions } = await query.order("created_at", { ascending: false });
      return success(positions || []);
    }

    if (path === "/trade/close" && method === "POST") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const { positionId } = await req.json();

      const { data: position } = await supabase
        .from("positions")
        .select("*, pair:trading_pairs(*)")
        .eq("id", positionId)
        .eq("user_id", user.id)
        .eq("is_open", true)
        .maybeSingle();

      if (!position) return error("Position not found or already closed");

      // Return margin to wallet
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .eq("asset_id", position.pair.quote_asset_id)
        .maybeSingle();

      if (wallet) {
        const pnl = position.unrealized_pnl || 0;
        const returnAmount = math.sum(position.margin, pnl);

        await supabase
          .from("wallets")
          .update({
            balance: math.sum(wallet.balance, returnAmount),
          })
          .eq("id", wallet.id);
      }

      // Close position
      await supabase
        .from("positions")
        .update({ is_open: false })
        .eq("id", positionId);

      return success({ closed: true });
    }

    if (path === "/trade/history" && method === "GET") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const pairId = url.searchParams.get("pairId");
      let query = supabase
        .from("orders")
        .select("*, pair:trading_pairs(*)")
        .eq("user_id", user.id)
        .in("status", ["FILLED", "CANCELED"]);

      if (pairId) query = query.eq("pair_id", Number(pairId));

      const { data: history } = await query.order("created_at", { ascending: false }).limit(100);
      return success(history || []);
    }

    // ==================== TOKENS ROUTES ====================
    if (path === "/tokens" && method === "GET") {
      const { data: tokens } = await supabase
        .from("airdrop_tokens")
        .select("*")
        .eq("is_active", true);

      return success({ tokens: tokens || [], count: tokens?.length || 0 });
    }

    if (path.startsWith("/tokens/") && path !== "/tokens/claim" && path !== "/tokens/claimInit" && path !== "/tokens/claimAll" && method === "GET") {
      const slug = path.replace("/tokens/", "");
      const { data: token } = await supabase
        .from("airdrop_tokens")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!token) return error("Token not found", 404);
      return success(token);
    }

    if (path === "/tokens/claimInit" && method === "POST") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const result = await claimAllInitialTokens(supabase, user.id);
      return success(result);
    }

    if (path === "/tokens/claim" && method === "POST") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const { tokenId } = await req.json();
      const result = await claimDailyToken(supabase, user.id, tokenId, user.level || 1);
      return success(result);
    }

    if (path === "/tokens/claimAll" && method === "POST") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const result = await claimAllDailyTokens(supabase, user.id, user.level || 1);
      return success(result);
    }

    // ==================== MISSIONS ROUTES ====================
    if (path === "/missions" && method === "GET") {
      const { data: missions } = await supabase
        .from("missions")
        .select("*")
        .eq("is_active", true)
        .order("order_id");

      return success({ missions: missions || [] });
    }

    if (path === "/missions/user" && method === "GET") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const { data: userMissions } = await supabase
        .from("user_missions")
        .select("*, mission:missions(*)")
        .eq("user_id", user.id);

      return success({ userMissions: userMissions || [] });
    }

    if (path === "/missions/complete" && method === "POST") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const { missionId } = await req.json();

      // Check if already completed
      const { data: existing } = await supabase
        .from("user_missions")
        .select("*")
        .eq("user_id", user.id)
        .eq("mission_id", missionId)
        .maybeSingle();

      if (existing) {
        return error("Mission already completed");
      }

      // Get mission info
      const { data: mission } = await supabase
        .from("missions")
        .select("*")
        .eq("id", missionId)
        .eq("is_active", true)
        .maybeSingle();

      if (!mission) return error("Mission not found or inactive", 404);

      // Mark as completed
      await supabase.from("user_missions").insert({
        user_id: user.id,
        mission_id: missionId,
      });

      // Add reward to token balances
      if (mission.reward_amount > 0) {
        await addStaticAmount(supabase, user.id, mission.reward_amount);
      }

      // Get updated data
      const { data: tokens } = await supabase
        .from("user_tokens")
        .select("*, token:airdrop_tokens(*)")
        .eq("user_id", user.id);

      const { data: userMissions } = await supabase
        .from("user_missions")
        .select("*")
        .eq("user_id", user.id);

      return success({ tokens: tokens || [], userMissions: userMissions || [] });
    }

    // 404 for unknown routes
    return error("Not found", 404);
  } catch (err) {
    console.error("API Error:", err);
    return error(err instanceof Error ? err.message : "Internal server error", 500);
  }
});

// ==================== AIRDROP HELPER FUNCTIONS ====================

async function claimAllInitialTokens(supabase: any, userId: number) {
  const now = new Date();

  // Get all active tokens
  const { data: validTokens } = await supabase
    .from("airdrop_tokens")
    .select("*")
    .eq("is_active", true)
    .lte("starts_at", now.toISOString())
    .gt("ends_at", now.toISOString());

  if (!validTokens || validTokens.length === 0) {
    return { claimedCount: 0, claimedTokens: [] };
  }

  // Get user's existing tokens
  const { data: existingTokens } = await supabase
    .from("user_tokens")
    .select("token_id")
    .eq("user_id", userId);

  const existingTokenIds = new Set((existingTokens || []).map((ut: any) => ut.token_id));

  // Filter for new tokens
  const tokensToClaim = validTokens.filter(
    (token: any) => !existingTokenIds.has(token.id)
  );

  if (tokensToClaim.length === 0) {
    return { claimedCount: 0, claimedTokens: [] };
  }

  const results = [];

  for (const token of tokensToClaim) {
    if (token.total_claimed >= token.total_supply) continue;

    // Create user token
    await supabase.from("user_tokens").insert({
      user_id: userId,
      token_id: token.id,
      balance: token.initial_airdrop,
      last_action_at: now.toISOString(),
    });

    // Update global stats
    await supabase
      .from("airdrop_tokens")
      .update({ total_claimed: math.sum(token.total_claimed, token.initial_airdrop) })
      .eq("id", token.id);

    // Update leaderboard
    await updateLeaderboard(supabase, userId, token.initial_airdrop);

    results.push({
      logo: token.logo_url,
      name: token.name,
      symbol: token.symbol,
      amount: token.initial_airdrop,
    });
  }

  return { claimedCount: results.length, claimedTokens: results };
}

async function claimDailyToken(supabase: any, userId: number, tokenId: number, multiplier: number = 1) {
  const now = new Date();

  // Get token
  const { data: token } = await supabase
    .from("airdrop_tokens")
    .select("*")
    .eq("id", tokenId)
    .eq("is_active", true)
    .maybeSingle();

  if (!token) throw new Error("Token not found or inactive");

  // Check timing
  if (new Date(token.starts_at) > now) throw new Error("Airdrop not started yet");
  if (new Date(token.ends_at) < now) throw new Error("Airdrop has ended");

  // Get user token
  const { data: userToken } = await supabase
    .from("user_tokens")
    .select("*")
    .eq("user_id", userId)
    .eq("token_id", tokenId)
    .maybeSingle();

  if (!userToken) {
    // First claim
    const reward = math.mul(token.initial_airdrop, multiplier);

    await supabase.from("user_tokens").insert({
      user_id: userId,
      token_id: tokenId,
      balance: reward,
      last_action_at: now.toISOString(),
    });

    await updateLeaderboard(supabase, userId, reward);

    return { claimed: reward, balance: reward, isInitial: true };
  }

  // Check cooldown (24 hours)
  const lastAction = new Date(userToken.last_action_at);
  const hoursSince = (now.getTime() - lastAction.getTime()) / (1000 * 60 * 60);

  if (hoursSince < 24) {
    throw new Error(`Can claim again in ${Math.ceil(24 - hoursSince)} hours`);
  }

  // Daily claim
  const reward = math.mul(token.daily_reward, multiplier);
  const newBalance = math.sum(userToken.balance, reward);

  await supabase
    .from("user_tokens")
    .update({
      balance: newBalance,
      last_action_at: now.toISOString(),
    })
    .eq("id", userToken.id);

  await updateLeaderboard(supabase, userId, reward);

  return { claimed: reward, balance: newBalance, isInitial: false };
}

async function claimAllDailyTokens(supabase: any, userId: number, multiplier: number = 1) {
  const now = new Date();

  // Get user's tokens
  const { data: userTokens } = await supabase
    .from("user_tokens")
    .select("*, token:airdrop_tokens(*)")
    .eq("user_id", userId);

  if (!userTokens || userTokens.length === 0) {
    return { claimedCount: 0, claimedTokens: [] };
  }

  const results = [];

  for (const ut of userTokens) {
    const token = ut.token;
    if (!token || !token.is_active) continue;

    const lastAction = new Date(ut.last_action_at);
    const hoursSince = (now.getTime() - lastAction.getTime()) / (1000 * 60 * 60);

    if (hoursSince < 24) continue;

    const reward = math.mul(token.daily_reward, multiplier);
    const newBalance = math.sum(ut.balance, reward);

    await supabase
      .from("user_tokens")
      .update({
        balance: newBalance,
        last_action_at: now.toISOString(),
      })
      .eq("id", ut.id);

    await updateLeaderboard(supabase, userId, reward);

    results.push({
      logo: token.logo_url,
      name: token.name,
      symbol: token.symbol,
      amount: reward,
      newBalance,
    });
  }

  return { claimedCount: results.length, claimedTokens: results };
}

async function addStaticAmount(supabase: any, userId: number, amount: number) {
  const { data: userTokens } = await supabase
    .from("user_tokens")
    .select("*")
    .eq("user_id", userId);

  if (!userTokens || userTokens.length === 0) return [];

  for (const ut of userTokens) {
    await supabase
      .from("user_tokens")
      .update({ balance: math.sum(ut.balance, amount) })
      .eq("id", ut.id);
  }

  await updateLeaderboard(supabase, userId, math.mul(amount, userTokens.length));

  return userTokens;
}

async function multiplyBalances(supabase: any, userId: number, factor: number = 2) {
  const { data: userTokens } = await supabase
    .from("user_tokens")
    .select("*")
    .eq("user_id", userId);

  if (!userTokens || userTokens.length === 0) return;

  let totalAdded = 0;

  for (const ut of userTokens) {
    const addAmount = math.mul(ut.balance, factor - 1);
    const newBalance = math.mul(ut.balance, factor);

    await supabase
      .from("user_tokens")
      .update({ balance: newBalance })
      .eq("id", ut.id);

    totalAdded = math.sum(totalAdded, addAmount);
  }

  await updateLeaderboard(supabase, userId, totalAdded);
}
