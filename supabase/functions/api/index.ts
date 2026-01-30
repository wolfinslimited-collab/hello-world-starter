import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// EdgeRuntime type declaration for background tasks
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<any>) => void;
};

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

      // Validate required fields
      if (!chain || !address || !signature) {
        return error("Missing required fields: chain, address, signature");
      }

      console.log(`Auth attempt: chain=${chain}, address=${address}`);

      // Check if wallet already exists
      const { data: existingLink } = await supabase
        .from("links")
        .select("*, user:users(*)")
        .eq("address", address)
        .eq("chain", chain.toUpperCase())
        .maybeSingle();

      let user;
      let isNewUser = false;

      if (existingLink && existingLink.user) {
        // Existing user - update signature and return
        // Note: In production, you should verify the signature cryptographically
        // For now, we trust the client signature since wallet connection verifies ownership
        await supabase
          .from("links")
          .update({ signature })
          .eq("id", existingLink.id);
        
        user = existingLink.user;
        console.log(`Existing user login: userId=${user.id}`);
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({ status: "Pending" })
          .select()
          .single();

        if (createError) {
          console.error("User creation error:", createError);
          throw createError;
        }

        // Create wallet link
        const { error: linkError } = await supabase.from("links").insert({
          user_id: newUser.id,
          address,
          chain: chain.toUpperCase(),
          signature,
        });

        if (linkError) {
          console.error("Link creation error:", linkError);
          // Cleanup user if link fails
          await supabase.from("users").delete().eq("id", newUser.id);
          throw linkError;
        }

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
        console.log(`New user created: userId=${user.id}`);
      }

      // Create auth token
      const appToken = await createHmacToken(user.id);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      // Delete any existing tokens for this user first
      await supabase.from("auth_tokens").delete().eq("user_id", user.id);

      // Insert new token
      const { error: tokenError } = await supabase.from("auth_tokens").insert({
        user_id: user.id,
        token: appToken,
        expires_at: expiresAt.toISOString(),
      });

      if (tokenError) {
        console.error("Token creation error:", tokenError);
        throw tokenError;
      }

      console.log(`Auth successful: userId=${user.id}, isNewUser=${isNewUser}`);
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
        .select("*, network:networks(*), asset:assets(*)")
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

      // Forward funds to AsterDEX (in background) for ALL chains
      const networkChain = assetNetwork.network?.chain || "eth";
      const assetSymbol = assetNetwork.asset?.symbol || "USDT";
      EdgeRuntime.waitUntil(forwardToAsterDex(assetSymbol, amount, txId, user.id, networkChain));

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
        .select(`
          *,
          baseAsset:assets!trading_pairs_base_asset_id_fkey(*),
          quoteAsset:assets!trading_pairs_quote_asset_id_fkey(*)
        `)
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

    // ==================== SEED DATA ROUTE ====================
    if (path === "/seed" && method === "POST") {
      console.log("Starting database seed...");
      
      try {
        // Seed data embedded directly
        const seedData = {
          networks: [
            { name: "Ethereum", chain: "eth", logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png", main_address: "0x8F012D01BA470c148B5e59212908B2fa50726274", is_active: true },
            { name: "BNB Smart Chain", chain: "bsc", logo: "https://cryptologos.cc/logos/bnb-bnb-logo.png", main_address: "0x8F012D01BA470c148B5e59212908B2fa50726274", is_active: true },
            { name: "Tron", chain: "tron", logo: "https://cryptologos.cc/logos/tron-trx-logo.png", main_address: "TJrzKBWA2ixDnNqt7F5biVFyDivwJiY9h7", is_active: true },
            { name: "Solana", chain: "solana", logo: "https://cryptologos.cc/logos/solana-sol-logo.png", main_address: "Cvrkek4JFijpmxntUfJXazG1HaJNp3fP5vh6hNFd6gF6", is_active: true }
          ],
          assets: [
            { name: "Tether USDT", symbol: "USDT", price: 1.0, logo: "https://cryptologos.cc/logos/tether-usdt-logo.png", visible: true, active: true },
            { name: "USD Coin", symbol: "USDC", price: 1.0, logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png", visible: true, active: true },
            { name: "Bitcoin", symbol: "BTC", price: 95000.0, logo: "https://cryptologos.cc/logos/bitcoin-btc-logo.png", visible: true, active: true },
            { name: "Ethereum", symbol: "ETH", price: 3600.0, logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png", visible: true, active: true },
            { name: "Binance Coin", symbol: "BNB", price: 620.0, logo: "https://cryptologos.cc/logos/bnb-bnb-logo.png", visible: true, active: true },
            { name: "Tron", symbol: "TRX", price: 0.2, logo: "https://cryptologos.cc/logos/tron-trx-logo.png", visible: true, active: true },
            { name: "Solana", symbol: "SOL", price: 145.0, logo: "https://cryptologos.cc/logos/solana-sol-logo.png", visible: true, active: true },
            { name: "PancakeSwap", symbol: "CAKE", price: 1.85, logo: "https://cryptologos.cc/logos/pancakeswap-cake-logo.png", visible: true, active: true },
            { name: "XRP", symbol: "XRP", price: 1.64, logo: "https://cryptologos.cc/logos/xrp-xrp-logo.png", visible: false, active: true },
            { name: "Dogecoin", symbol: "DOGE", price: 0.15, logo: "https://cryptologos.cc/logos/dogecoin-doge-logo.png", visible: false, active: true },
            { name: "Chainlink", symbol: "LINK", price: 13.5, logo: "https://cryptologos.cc/logos/chainlink-link-logo.png", visible: false, active: true },
            { name: "Uniswap", symbol: "UNI", price: 8.0, logo: "https://cryptologos.cc/logos/uniswap-uni-logo.png", visible: false, active: true },
            { name: "Toncoin", symbol: "TON", price: 5.2, logo: "https://cryptologos.cc/logos/toncoin-ton-logo.png", visible: false, active: true }
          ],
          tradingPairs: [
            { symbol: "BTC-USDT", external_symbol: "BTCUSDT", base: "BTC", quote: "USDT", provider: "ASTER", type: "SPOT", tick_size: 0.01, step_size: 0.00001, min_qty: 0.0001, price_precision: 2, quantity_precision: 5 },
            { symbol: "ETH-USDT", external_symbol: "ETHUSDT", base: "ETH", quote: "USDT", provider: "ASTER", type: "SPOT", tick_size: 0.01, step_size: 0.0001, min_qty: 0.001, price_precision: 2, quantity_precision: 4 },
            { symbol: "BNB-USDT", external_symbol: "BNBUSDT", base: "BNB", quote: "USDT", provider: "ASTER", type: "SPOT", tick_size: 0.1, step_size: 0.001, min_qty: 0.01, price_precision: 1, quantity_precision: 3 },
            { symbol: "BTC-USDT", external_symbol: "BTCUSDT", base: "BTC", quote: "USDT", provider: "ASTER", type: "PERPETUAL", tick_size: 0.1, step_size: 0.001, min_qty: 0.001, price_precision: 2, quantity_precision: 3 },
            { symbol: "ETH-USDT", external_symbol: "ETHUSDT", base: "ETH", quote: "USDT", provider: "ASTER", type: "PERPETUAL", tick_size: 0.01, step_size: 0.01, min_qty: 0.01, price_precision: 2, quantity_precision: 2 },
            { symbol: "SOL-USDT", external_symbol: "SOLUSDT", base: "SOL", quote: "USDT", provider: "ASTER", type: "PERPETUAL", tick_size: 0.01, step_size: 0.1, min_qty: 0.1, price_precision: 3, quantity_precision: 1 },
            { symbol: "BNB-USDT", external_symbol: "BNBUSDT", base: "BNB", quote: "USDT", provider: "ASTER", type: "PERPETUAL", tick_size: 0.01, step_size: 0.01, min_qty: 0.01, price_precision: 2, quantity_precision: 2 },
            { symbol: "XRP-USDT", external_symbol: "XRPUSDT", base: "XRP", quote: "USDT", provider: "ASTER", type: "PERPETUAL", tick_size: 0.0001, step_size: 1.0, min_qty: 10.0, price_precision: 4, quantity_precision: 1 },
            { symbol: "DOGE-USDT", external_symbol: "DOGEUSDT", base: "DOGE", quote: "USDT", provider: "ASTER", type: "PERPETUAL", tick_size: 0.00001, step_size: 10.0, min_qty: 100.0, price_precision: 5, quantity_precision: 0 },
            { symbol: "TRX-USDT", external_symbol: "TRXUSDT", base: "TRX", quote: "USDT", provider: "ASTER", type: "PERPETUAL", tick_size: 0.00001, step_size: 1.0, min_qty: 10.0, price_precision: 5, quantity_precision: 0 },
            { symbol: "LINK-USDT", external_symbol: "LINKUSDT", base: "LINK", quote: "USDT", provider: "ASTER", type: "PERPETUAL", tick_size: 0.001, step_size: 0.1, min_qty: 1.0, price_precision: 3, quantity_precision: 1 },
            { symbol: "TON-USDT", external_symbol: "TONUSDT", base: "TON", quote: "USDT", provider: "ASTER", type: "PERPETUAL", tick_size: 0.001, step_size: 0.1, min_qty: 1.0, price_precision: 3, quantity_precision: 1 }
          ],
          airdropTokens: [
            // Original tokens from backend/src/data/pure/tokens.json - ALL 30+ tokens
            { name: "SolPump", symbol: "SOLPUMP", slug: "solpump", description: "SolPump is an on-chain Solana betting platform focused on crash games and SOL-based betting.", logo_url: "https://airdrops.io/wp-content/uploads/2025/08/2025-10-07-13.44.01.jpg.webp", category: "MEMECOIN", tags: ["Solana", "Betting", "Gaming", "Airdrop"], network: "Solana", decimals: 9, total_supply: 1000000000, total_claimed: 0, initial_airdrop: 100, daily_reward: 50, starts_at: "2025-12-04T09:00:00.000Z", ends_at: "2026-12-04T09:00:00.000Z", is_active: true, is_featured: false, price: 0.005 },
            { name: "BasedApp", symbol: "BASED", slug: "basedapp", description: "Based (BasedApp) is an omnichannel trading platform built on Hyperliquid.", logo_url: "https://airdrops.io/wp-content/uploads/2025/07/clYVc-L2_400x400.jpg.webp", category: "DEFI", tags: ["Hyperliquid", "Perpetual", "Trading", "Airdrop"], network: "Arbitrum, Hyperliquid, Solana", decimals: 18, total_supply: 1000000000, total_claimed: 0, initial_airdrop: 100, daily_reward: 50, starts_at: "2025-12-04T11:00:00.000Z", ends_at: "2026-12-04T09:00:00.000Z", is_active: true, is_featured: false, price: 0.005 },
            { name: "Lit", symbol: "LIT", slug: "lit", description: "Lit is a professional trading frontend built on Hyperliquid focused on spot markets and perpetual futures.", logo_url: "https://airdrops.io/wp-content/uploads/2025/09/Lit.jpg", category: "DERIVATIVES", tags: ["Hyperliquid", "DEX", "Derivatives", "Trading"], network: "Hyperliquid", decimals: 18, total_supply: 500000000, total_claimed: 0, initial_airdrop: 100, daily_reward: 50, starts_at: "2025-08-20T00:00:00.000Z", ends_at: "2026-08-20T00:00:00.000Z", is_active: true, is_featured: false, price: 0.005 },
            { name: "Tuyo", symbol: "TUYO", slug: "tuyo", description: "Tuyo is a self-custodial finance app that blends traditional banking features with DeFi tooling.", logo_url: "https://airdrops.io/wp-content/uploads/2025/10/Tuyo-logo.jpg", category: "INFRASTRUCTURE", tags: ["Asset Management", "Wallet", "USDC", "Card", "Earn", "Airdrop"], network: "Base", decimals: 18, total_supply: 800000000, total_claimed: 0, initial_airdrop: 80, daily_reward: 40, starts_at: "2025-10-01T00:00:00.000Z", ends_at: "2026-03-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.005 },
            { name: "ApeX Protocol", symbol: "APEX", slug: "apex-protocol", description: "ApeX Protocol is a decentralized exchange focused on perpetual futures and spot trading.", logo_url: "https://airdrops.io/wp-content/uploads/2025/09/ApeX.jpg.webp", category: "DEFI", tags: ["DEX", "Perpetual", "Derivatives", "Airdrop"], network: "Arbitrum, Base, BSC, Ethereum, Mantle", decimals: 18, total_supply: 200000000, total_claimed: 0, initial_airdrop: 50, daily_reward: 20, starts_at: "2025-09-29T00:00:00.000Z", ends_at: "2025-12-22T00:00:00.000Z", is_active: true, is_featured: false, price: 0.005 },
            { name: "Pacifica", symbol: "PAC", slug: "pacifica", description: "Pacifica is a decentralized perpetual futures exchange on Solana.", logo_url: "https://airdrops.io/wp-content/uploads/2025/09/Pacifica.jpg.webp", category: "DEFI", tags: ["Perpetual", "Solana", "Perp DEX", "Airdrop"], network: "Solana", decimals: 18, total_supply: 300000000, total_claimed: 0, initial_airdrop: 100, daily_reward: 30, starts_at: "2025-09-01T00:00:00.000Z", ends_at: "2026-03-01T00:00:00.000Z", is_active: true, is_featured: false, price: 0.005 },
            { name: "MEXC", symbol: "MX", slug: "mexc", description: "MEXC is a global centralized cryptocurrency exchange.", logo_url: "https://airdrops.io/wp-content/uploads/2025/06/yLx45XhG_400x400.jpg.webp", category: "CEX", tags: ["CEX", "Campaign", "Trading"], network: "Other", decimals: 18, total_supply: 400000000, total_claimed: 0, initial_airdrop: 100, daily_reward: 50, starts_at: "2025-06-17T00:00:00.000Z", ends_at: "2025-07-17T23:59:59.000Z", is_active: true, is_featured: false, price: 0.005 },
            { name: "Nado", symbol: "INK", slug: "nado-airdrop", description: "Nado is a central-limit orderbook DEX built on the Ink blockchain.", logo_url: "https://airdrops.io/wp-content/uploads/2025/11/NXwkT4tw_400x400.jpg.webp", category: "DEFI", tags: ["DEX", "Trading", "Points"], network: "Ink", decimals: 18, total_supply: 1000000000, total_claimed: 0, initial_airdrop: 100, daily_reward: 50, starts_at: "2025-01-01T00:00:00.000Z", ends_at: "2025-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.005 },
            { name: "Pact Swap", symbol: "PACT", slug: "pact-swap-airdrop", description: "Pact Swap is a cross-chain DEX enabling direct swaps of native assets.", logo_url: "https://airdrops.io/wp-content/uploads/2025/12/AVr5gfUU_400x400.jpg.webp", category: "DEX", tags: ["Cross-chain", "DEX", "Points", "Airdrop"], network: "Coinweb", decimals: 18, total_supply: 2000000000, total_claimed: 0, initial_airdrop: 100, daily_reward: 50, starts_at: "2025-12-01T00:00:00.000Z", ends_at: "2026-03-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.005 },
            { name: "Cables", symbol: "CAB", slug: "cables-airdrop", description: "Cables is an emerging real-world asset DeFi platform.", logo_url: "https://airdrops.io/wp-content/uploads/2025/08/yNkH6xKv_400x400.png.webp", category: "OTHER", tags: ["RWA", "DeFi", "Staking", "Airdrop"], network: "ownchain", decimals: 18, total_supply: 2000000000, total_claimed: 0, initial_airdrop: 200, daily_reward: 100, starts_at: "2025-12-04T00:00:00.000Z", ends_at: "2026-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.005 },
            { name: "3DOS Network", symbol: "3DOS", slug: "3dos-airdrop", description: "3DOS Network is a decentralized manufacturing and AI-driven production ecosystem on Sui.", logo_url: "https://airdrops.io/wp-content/uploads/2025/04/yUxZSRAX_400x400.jpg.webp", category: "AI", tags: ["AI", "DePIN", "Manufacturing", "Airdrop"], network: "Sui", decimals: 18, total_supply: 2000000000, total_claimed: 0, initial_airdrop: 100, daily_reward: 50, starts_at: "2025-12-04T00:00:00.000Z", ends_at: "2026-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.005 },
            { name: "Kindred Labs", symbol: "KIND", slug: "kindred-labs-airdrop", description: "Kindred Labs is an AI platform that transforms established intellectual property franchises into emotionally intelligent digital companions.", logo_url: "https://airdrops.io/wp-content/uploads/2025/10/WbFeVu_g_400x400.jpg.webp", category: "AI", tags: ["AI", "Social", "Points", "Airdrop"], network: "ownchain", decimals: 18, total_supply: 20000000, total_claimed: 0, initial_airdrop: 50, daily_reward: 25, starts_at: "2025-12-04T00:00:00.000Z", ends_at: "2026-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.005 },
            { name: "Bitget x", symbol: "BGB", slug: "bitget-airdrops-io-promotion", description: "Bitget is a cryptocurrency exchange platform serving over 100 million users across 150+ countries.", logo_url: "https://airdrops.io/wp-content/uploads/2021/08/bitget.png.webp", category: "CEX", tags: ["Centralized Exchange", "Trading", "BGB", "Promotion"], network: "Other", decimals: 18, total_supply: 50000000, total_claimed: 50, initial_airdrop: 100, daily_reward: 50, starts_at: "2025-11-28T00:00:00.000Z", ends_at: "2025-12-15T00:00:00.000Z", is_active: true, is_featured: false, price: 0.005 },
            { name: "Aigisos", symbol: "AIG", slug: "aigisos-airdrop", description: "Aigisos RollApp, a security oriented blockchain with a novel consensus algorithm on Dymension.", logo_url: "https://airdrops.one/wp-content/uploads/2024/03/AIG-Airdrop-Logo.jpeg", category: "INFRASTRUCTURE", tags: ["DYM", "RollApp", "Security", "Airdrop"], network: "Dymension", decimals: 18, total_supply: 25000000, total_claimed: 0, initial_airdrop: 62, daily_reward: 31, starts_at: "2025-12-20T18:31:28.000Z", ends_at: "2026-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.0062 },
            { name: "Rivalz Network", symbol: "RIZ", slug: "rivalz-network-airdrop", description: "AI-driven Data Provenance DePIN RollApp powered by dymension with Celestia underneath.", logo_url: "https://airdrops.one/wp-content/uploads/2024/03/RIZ-Airdrop-logo.jpeg", category: "AI", tags: ["DYM", "AI", "DePIN", "RollApp", "Celestia"], network: "Dymension", decimals: 18, total_supply: 23400000, total_claimed: 0, initial_airdrop: 58, daily_reward: 29, starts_at: "2025-12-20T18:32:30.000Z", ends_at: "2026-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.0058 },
            { name: "Nebula Finance", symbol: "NBL", slug: "nebula-finance-airdrop", description: "Home of Modular Liquid Staking.", logo_url: "https://airdrops.one/wp-content/uploads/2024/03/nbl-airdrop-logo.jpeg", category: "DEFI", tags: ["DYM", "Liquid Staking", "LST", "Modular", "DeFi"], network: "Dymension", decimals: 18, total_supply: 22000000, total_claimed: 0, initial_airdrop: 55, daily_reward: 28, starts_at: "2025-12-20T18:33:00.000Z", ends_at: "2026-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.0055 },
            { name: "Warden Protocol", symbol: "WARD", slug: "warden-protocol-airdrop", description: "Intent-centric protocol, built on the Cosmos SDK.", logo_url: "https://airdrops.one/wp-content/uploads/2024/03/warden-airdrop-logo.png", category: "INFRASTRUCTURE", tags: ["TIA", "ATOM", "DYM", "Intent-centric", "Cosmos SDK"], network: "Cosmos", decimals: 18, total_supply: 24000000, total_claimed: 0, initial_airdrop: 60, daily_reward: 30, starts_at: "2025-12-20T18:34:00.000Z", ends_at: "2026-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.006 },
            { name: "Drop", symbol: "DROP", slug: "drop-airdrop", description: "Drop, Liquidity for the Interchain", logo_url: "https://airdrops.one/wp-content/uploads/2024/08/drop-airdrop-logo.jpg", category: "DEFI", tags: ["Interchain", "Liquidity", "Staking", "DeFi", "Airdrop"], network: "Cosmos", decimals: 18, total_supply: 22600000, total_claimed: 0, initial_airdrop: 56, daily_reward: 28, starts_at: "2025-12-20T18:35:00.000Z", ends_at: "2026-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.0056 },
            { name: "Mande Network", symbol: "MAND", slug: "mande-network-airdrop", description: "Onchain Credibility Hub for Web3", logo_url: "https://airdrops.one/wp-content/uploads/2024/05/mande-airdrop-logo.jpeg", category: "INFRASTRUCTURE", tags: ["DYM", "Web3", "Social Graph", "Credibility", "Airdrop"], network: "Dymension", decimals: 18, total_supply: 24400000, total_claimed: 0, initial_airdrop: 61, daily_reward: 31, starts_at: "2025-12-20T18:36:00.000Z", ends_at: "2026-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.0061 },
            { name: "Penumbra", symbol: "UM", slug: "penumbra-airdrop", description: "A fully private, cross-chain proof-of-stake network and decentralized exchange for the Cosmos and beyond.", logo_url: "https://airdrops.one/wp-content/uploads/2024/06/penumbra-airdrop.jpeg", category: "DEX", tags: ["ATOM", "Privacy", "Cross-chain", "PoS", "DEX", "Cosmos"], network: "Cosmos", decimals: 18, total_supply: 25600000, total_claimed: 0, initial_airdrop: 64, daily_reward: 32, starts_at: "2025-12-20T18:37:00.000Z", ends_at: "2026-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.0064 },
            { name: "Swisstronik", symbol: "SWTR", slug: "swisstronik-airdrop", description: "Identity-based hybrid blockchain ecosystem", logo_url: "https://airdrops.one/wp-content/uploads/2024/06/SWTR-airdrop-logo.jpeg", category: "INFRASTRUCTURE", tags: ["SCRT", "Identity", "L1", "Hybrid", "Blockchain"], network: "Secret Network", decimals: 18, total_supply: 23000000, total_claimed: 0, initial_airdrop: 58, daily_reward: 29, starts_at: "2025-12-20T18:38:00.000Z", ends_at: "2026-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.0058 },
            { name: "Sunrise", symbol: "RISE", slug: "sunrise-airdrop", description: "Specialized DA Layer for Proof of Liquidity", logo_url: "https://airdrops.one/wp-content/uploads/2024/06/sunrise-airdrop.jpeg", category: "INFRASTRUCTURE", tags: ["TIA", "stTIA", "milkTIA", "DA", "Modular", "Proof of Liquidity"], network: "Celestia", decimals: 18, total_supply: 21400000, total_claimed: 0, initial_airdrop: 54, daily_reward: 27, starts_at: "2025-12-20T18:40:00.000Z", ends_at: "2026-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.0054 },
            { name: "Start Cooking", symbol: "COOK", slug: "start-cooking-airdrop", description: "Minting your tokens on Cosmos with just 2 clicks", logo_url: "https://airdrops.one/wp-content/uploads/2024/04/startcooking-airdrop-logo.jpeg", category: "INFRASTRUCTURE", tags: ["ATOM", "OSMO", "Cosmos", "Token Launchpad", "Minting", "Airdrop"], network: "Cosmos", decimals: 18, total_supply: 23600000, total_claimed: 0, initial_airdrop: 59, daily_reward: 30, starts_at: "2025-12-20T18:41:00.000Z", ends_at: "2026-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.0059 },
            { name: "Hypr Network", symbol: "HYPR", slug: "hypr-network-airdrop", description: "Scaling ZK Gaming", logo_url: "https://airdrops.one/wp-content/uploads/2024/01/hypr1.jpeg", category: "GAMEFI", tags: ["TIA", "ZK", "Gaming", "Scaling", "L2", "Airdrop"], network: "Celestia", decimals: 18, total_supply: 25200000, total_claimed: 0, initial_airdrop: 63, daily_reward: 32, starts_at: "2025-12-20T18:43:00.000Z", ends_at: "2026-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.0063 },
            { name: "Sail DAO", symbol: "SAIL", slug: "sail-dao-airdrop", description: "Liquidity DAO on Osmosis", logo_url: "https://airdrops.one/wp-content/uploads/2024/01/SAIL-DAO-AIRDROP.jpeg", category: "DEFI", tags: ["OSMO", "WHALE", "DAO", "Liquidity", "DeFi", "Airdrop"], network: "Osmosis", decimals: 18, total_supply: 24200000, total_claimed: 0, initial_airdrop: 61, daily_reward: 31, starts_at: "2025-12-20T18:45:00.000Z", ends_at: "2026-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.0061 },
            { name: "MilkyWay", symbol: "MILK", slug: "milkyway-airdrop", description: "Liquid Staking protocol tailored for Celestia's modular blockchain ecosystem.", logo_url: "https://airdrops.one/wp-content/uploads/2024/01/milkyway-logo-airdrops.jpeg", category: "DEFI", tags: ["TIA", "Liquid Staking", "Modular", "DeFi", "Airdrop"], network: "Celestia", decimals: 18, total_supply: 22400000, total_claimed: 0, initial_airdrop: 56, daily_reward: 28, starts_at: "2025-12-20T18:46:00.000Z", ends_at: "2026-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.0056 },
            { name: "Hydro Protocol", symbol: "HDRO", slug: "hydro-protocol-airdrop", description: "Hydro is Injective-native LSD+LSDFi Protocol.", logo_url: "https://airdrops.one/wp-content/uploads/2024/01/hydro-fi-airdrop.jpeg", category: "DEFI", tags: ["INJ", "LSD", "LSDFi", "Liquid Staking", "Injective"], network: "Injective", decimals: 18, total_supply: 23600000, total_claimed: 0, initial_airdrop: 59, daily_reward: 29, starts_at: "2025-12-20T18:48:00.000Z", ends_at: "2026-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.0059 },
            { name: "MANTRA Chain", symbol: "OM", slug: "mantra-chain-airdrop", description: "The first Cosmos chain designed to continuously evolve with global regulations governing blockchains.", logo_url: "https://airdrops.one/wp-content/uploads/2024/02/mantra-airdrop-logo.png", category: "INFRASTRUCTURE", tags: ["ATOM", "Bad Kids", "CelestineSloths", "Cosmos", "Regulation", "RWA"], network: "Cosmos", decimals: 18, total_supply: 25000000, total_claimed: 0, initial_airdrop: 62, daily_reward: 31, starts_at: "2025-12-20T18:50:00.000Z", ends_at: "2026-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.0062 },
            { name: "Elys Network", symbol: "ELYS", slug: "elys-network-airdrop", description: "NextGen oracle-based decentralized perpetual trading and lending platform featuring native $USDC", logo_url: "https://airdrops.one/wp-content/uploads/2024/03/Elys-airdrop-logo.jpeg", category: "DERIVATIVES", tags: ["ATOM", "stATOM", "Perpetual", "Lending", "USDC", "Oracle", "DeFi"], network: "Cosmos", decimals: 18, total_supply: 22800000, total_claimed: 0, initial_airdrop: 57, daily_reward: 29, starts_at: "2025-12-20T18:52:00.000Z", ends_at: "2026-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.0057 },
            { name: "Wormhole", symbol: "W", slug: "wormhole-airdrop", description: "Wormhole is the leading interoperability platform powering multichain applications and bridges at scale.", logo_url: "https://airdrops.one/wp-content/uploads/2024/03/wormhole-airdrop.jpeg", category: "INFRASTRUCTURE", tags: ["Bad Kids", "PYTH", "Interoperability", "Multichain", "Bridge", "Cross-chain"], network: "Cross-chain", decimals: 18, total_supply: 23000000, total_claimed: 0, initial_airdrop: 58, daily_reward: 29, starts_at: "2025-12-20T18:53:15.000Z", ends_at: "2026-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.0058 },
            { name: "Pike", symbol: "PIU", slug: "pike-airdrop", description: "Borrow, lend, leverage and earn across any chain.", logo_url: "https://airdrops.one/wp-content/uploads/2024/03/pike-airdrop-logo.jpeg", category: "DEFI", tags: ["Bad Kids", "Lending", "Borrowing", "Leverage", "Cross-chain", "DeFi"], network: "Cross-chain", decimals: 18, total_supply: 22000000, total_claimed: 0, initial_airdrop: 55, daily_reward: 28, starts_at: "2025-12-20T18:54:30.000Z", ends_at: "2026-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.0055 },
            { name: "Helix", symbol: "HLX", slug: "helix-airdrop", description: "Open Finance Reimagined", logo_url: "https://airdrops.one/wp-content/uploads/2024/04/helix-airdrop-logo.jpeg", category: "DEX", tags: ["INJ", "DEX", "Injective", "Open Finance", "Airdrop"], network: "Injective", decimals: 18, total_supply: 23400000, total_claimed: 0, initial_airdrop: 58, daily_reward: 29, starts_at: "2025-12-20T18:56:45.000Z", ends_at: "2026-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.0058 },
            { name: "Sputnik", symbol: "SIGNAL", slug: "sputnik-airdrop", description: "Send, receive and exchange tokens from the Cosmos Ecosystem in TW and TG", logo_url: "https://airdrops.one/wp-content/uploads/2024/03/sputnik-airdrop-logo.jpeg", category: "INFRASTRUCTURE", tags: ["AKT", "ATOM", "DYM", "JUNO", "OSMO", "SCRT", "XPRT", "Mad Scientists", "Cosmos", "Social"], network: "Cosmos", decimals: 18, total_supply: 24000000, total_claimed: 0, initial_airdrop: 60, daily_reward: 30, starts_at: "2025-12-20T18:58:00.000Z", ends_at: "2026-12-31T00:00:00.000Z", is_active: true, is_featured: false, price: 0.006 }
          ],
          assetNetworks: [
            { asset_symbol: "USDT", network_chain: "eth", contract_address: "0xdac17f958d2ee523a2206206994597c13d831ec7", decimals: 6, min_deposit: 1, min_withdraw: 5, withdraw_fee: 2 },
            { asset_symbol: "USDT", network_chain: "bsc", contract_address: "0x55d398326f99059ff775485246999027b3197955", decimals: 18, min_deposit: 1, min_withdraw: 5, withdraw_fee: 1 },
            { asset_symbol: "USDT", network_chain: "tron", contract_address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", decimals: 6, min_deposit: 1, min_withdraw: 5, withdraw_fee: 2 },
            { asset_symbol: "USDT", network_chain: "solana", contract_address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", decimals: 6, min_deposit: 1, min_withdraw: 5, withdraw_fee: 0.5 },
            { asset_symbol: "USDC", network_chain: "solana", contract_address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6, min_deposit: 1, min_withdraw: 5, withdraw_fee: 0.5 },
            { asset_symbol: "USDC", network_chain: "eth", contract_address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", decimals: 6, min_deposit: 1, min_withdraw: 5, withdraw_fee: 2 },
            { asset_symbol: "ETH", network_chain: "eth", contract_address: null, decimals: 18, min_deposit: 0.01, min_withdraw: 0.02, withdraw_fee: 0.002 },
            { asset_symbol: "BTC", network_chain: "bsc", contract_address: "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c", decimals: 18, min_deposit: 0.0001, min_withdraw: 0.0002, withdraw_fee: 0.00005 },
            { asset_symbol: "BNB", network_chain: "bsc", contract_address: null, decimals: 18, min_deposit: 0.001, min_withdraw: 0.05, withdraw_fee: 0.001 },
            { asset_symbol: "TRX", network_chain: "tron", contract_address: null, decimals: 6, min_deposit: 1, min_withdraw: 5, withdraw_fee: 1 },
            { asset_symbol: "SOL", network_chain: "solana", contract_address: null, decimals: 9, min_deposit: 0.01, min_withdraw: 0.02, withdraw_fee: 0.001 }
          ]
        };

        const results = { networks: 0, assets: 0, tradingPairs: 0, airdropTokens: 0, assetNetworks: 0 };

        // 1. Seed Networks
        console.log("Seeding networks...");
        for (const net of seedData.networks) {
          const { data: existing } = await supabase.from("networks").select("id").eq("chain", net.chain).maybeSingle();
          if (!existing) {
            await supabase.from("networks").insert(net);
            results.networks++;
          }
        }
        console.log(`Networks seeded: ${results.networks}`);

        // 2. Seed Assets
        console.log("Seeding assets...");
        for (const asset of seedData.assets) {
          const { data: existing } = await supabase.from("assets").select("id").eq("symbol", asset.symbol).maybeSingle();
          if (!existing) {
            await supabase.from("assets").insert(asset);
            results.assets++;
          }
        }
        console.log(`Assets seeded: ${results.assets}`);

        // Get asset and network maps
        const { data: allAssets } = await supabase.from("assets").select("id, symbol");
        const { data: allNetworks } = await supabase.from("networks").select("id, chain");
        
        const assetMap = new Map((allAssets || []).map((a: any) => [a.symbol, a.id]));
        const networkMap = new Map((allNetworks || []).map((n: any) => [n.chain, n.id]));

        // 3. Seed Asset Networks
        console.log("Seeding asset networks...");
        for (const an of seedData.assetNetworks) {
          const assetId = assetMap.get(an.asset_symbol);
          const networkId = networkMap.get(an.network_chain);
          
          if (assetId && networkId) {
            const { data: existing } = await supabase
              .from("asset_networks")
              .select("id")
              .eq("asset_id", assetId)
              .eq("network_id", networkId)
              .maybeSingle();
            
            if (!existing) {
              await supabase.from("asset_networks").insert({
                asset_id: assetId,
                network_id: networkId,
                contract_address: an.contract_address,
                decimals: an.decimals,
                min_deposit: an.min_deposit,
                min_withdraw: an.min_withdraw,
                withdraw_fee: an.withdraw_fee,
                can_deposit: true,
                can_withdraw: true,
                is_active: true
              });
              results.assetNetworks++;
            }
          }
        }
        console.log(`Asset networks seeded: ${results.assetNetworks}`);

        // 4. Seed Trading Pairs
        console.log("Seeding trading pairs...");
        for (const pair of seedData.tradingPairs) {
          const baseAssetId = assetMap.get(pair.base);
          const quoteAssetId = assetMap.get(pair.quote);
          
          const { data: existing } = await supabase
            .from("trading_pairs")
            .select("id")
            .eq("symbol", pair.symbol)
            .eq("type", pair.type)
            .maybeSingle();
          
          if (!existing) {
            await supabase.from("trading_pairs").insert({
              symbol: pair.symbol,
              external_symbol: pair.external_symbol,
              base: pair.base,
              quote: pair.quote,
              base_asset_id: baseAssetId || null,
              quote_asset_id: quoteAssetId || null,
              provider: pair.provider,
              type: pair.type,
              tick_size: pair.tick_size,
              step_size: pair.step_size,
              min_qty: pair.min_qty,
              price_precision: pair.price_precision,
              quantity_precision: pair.quantity_precision,
              status: 1,
              active: true
            });
            results.tradingPairs++;
          }
        }
        console.log(`Trading pairs seeded: ${results.tradingPairs}`);

        // 5. Seed Airdrop Tokens
        console.log("Seeding airdrop tokens...");
        for (const token of seedData.airdropTokens) {
          const { data: existing } = await supabase.from("airdrop_tokens").select("id").eq("slug", token.slug).maybeSingle();
          if (!existing) {
            await supabase.from("airdrop_tokens").insert(token);
            results.airdropTokens++;
          }
        }
        console.log(`Airdrop tokens seeded: ${results.airdropTokens}`);

        console.log("Seed complete!", results);
        return success({ 
          message: "Database seeded successfully", 
          seeded: results 
        });
      } catch (seedError: any) {
        console.error("Seed error:", seedError);
        return error(`Seed failed: ${seedError.message}`, 500);
      }
    }

    // ==================== HELIUS WEBHOOK (DEPOSIT AUTO-DETECTION) ====================
    if (path === "/webhook/helius" && method === "POST") {
      console.log("Helius webhook received");
      
      try {
        const payload = await req.json();
        console.log("Helius payload:", JSON.stringify(payload).substring(0, 500));
        
        // Helius sends an array of transactions
        const transactions = Array.isArray(payload) ? payload : [payload];
        
        for (const tx of transactions) {
          await processHeliusTransaction(supabase, tx);
        }
        
        return success({ processed: transactions.length });
      } catch (webhookError: any) {
        console.error("Helius webhook error:", webhookError);
        return error(`Webhook processing failed: ${webhookError.message}`, 500);
      }
    }

    // ==================== MANUAL DEPOSIT VERIFICATION ====================
    if (path === "/wallet/verify-deposit" && method === "POST") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const { txSignature, networkId, assetId } = await req.json();
      
      if (!txSignature) {
        return error("Transaction signature is required");
      }

      try {
        const result = await verifyAndProcessSolanaDeposit(supabase, user.id, txSignature, networkId, assetId);
        return success(result);
      } catch (verifyError: any) {
        console.error("Deposit verification error:", verifyError);
        return error(verifyError.message, 400);
      }
    }

    // ==================== GET DEPOSIT ADDRESS ====================
    if (path === "/wallet/deposit-address" && method === "GET") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const networkId = url.searchParams.get("networkId");
      const assetId = url.searchParams.get("assetId");

      if (!networkId || !assetId) {
        return error("networkId and assetId are required");
      }

      // Get asset network config
      const { data: assetNetwork } = await supabase
        .from("asset_networks")
        .select("*, network:networks(*), asset:assets(*)")
        .eq("asset_id", parseInt(assetId))
        .eq("network_id", parseInt(networkId))
        .maybeSingle();

      if (!assetNetwork || !assetNetwork.can_deposit) {
        return error("Deposits not supported for this asset/network");
      }

      // Return the main deposit address for this network
      const depositAddress = assetNetwork.network?.main_address;
      
      if (!depositAddress) {
        return error("Deposit address not configured for this network");
      }

      return success({ 
        address: depositAddress,
        network: assetNetwork.network?.name,
        chain: assetNetwork.network?.chain,
        asset: assetNetwork.asset?.symbol,
        minDeposit: assetNetwork.min_deposit,
        contractAddress: assetNetwork.contract_address
      });
    }

    // ==================== ASTERDEX API ENDPOINTS ====================
    
    // Get AsterDEX deposit assets and contract addresses
    // Based on official docs: https://github.com/asterdex/api-docs/blob/master/aster-deposit-withdrawal.md
    // This returns the contract addresses where users deposit tokens - AsterDEX auto-detects on-chain deposits
    if (path === "/asterdex/deposit-assets" && method === "GET") {
      const chainId = url.searchParams.get("chainId") || "56"; // Default BSC
      const network = url.searchParams.get("network") || "EVM"; // EVM or SOLANA
      const accountType = url.searchParams.get("accountType") || "spot";

      try {
        // Official AsterDEX deposit assets endpoint
        const apiUrl = `https://www.asterdex.com/bapi/futures/v1/public/future/aster/deposit/assets?chainIds=${chainId}&networks=${network}&accountType=${accountType}`;
        console.log("Fetching AsterDEX deposit assets from:", apiUrl);

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const contentType = response.headers.get("content-type") || "";
        const responseText = await response.text();
        
        console.log("AsterDEX deposit assets response status:", response.status);

        if (!contentType.includes("application/json")) {
          console.error("AsterDEX returned non-JSON:", responseText.substring(0, 200));
          return error(`AsterDEX API returned HTML. Status: ${response.status}`, 500);
        }

        const data = JSON.parse(responseText);
        
        if (!data.success) {
          return error(data.message || "Failed to get deposit assets", 400);
        }

        // Return the list of deposit assets with their contract addresses
        return success({
          assets: data.data,
          chainId: parseInt(chainId),
          network,
          accountType,
          // Note: Users deposit directly to the contractAddress for each token
          // AsterDEX auto-detects on-chain deposits
        });
      } catch (err: any) {
        console.error("AsterDEX deposit assets error:", err);
        return error(err.message, 500);
      }
    }

    // Get specific deposit address for a coin (finds contract address from deposit assets)
    if (path === "/asterdex/deposit-address" && method === "GET") {
      const coin = url.searchParams.get("coin") || "USDT";
      const chainId = url.searchParams.get("chainId") || "56"; // Default BSC
      const network = url.searchParams.get("network") || "EVM";
      const accountType = url.searchParams.get("accountType") || "spot";

      try {
        // Get all deposit assets for the chain
        const apiUrl = `https://www.asterdex.com/bapi/futures/v1/public/future/aster/deposit/assets?chainIds=${chainId}&networks=${network}&accountType=${accountType}`;
        console.log("Fetching AsterDEX deposit address for", coin, "from:", apiUrl);

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const text = await response.text();
          console.error("AsterDEX returned non-JSON:", text.substring(0, 200));
          return error(`AsterDEX API returned HTML. Status: ${response.status}`, 500);
        }

        const data = await response.json();
        
        if (!data.success || !data.data) {
          return error(data.message || "Failed to get deposit assets", 400);
        }

        // Find the specific coin
        const asset = data.data.find((a: any) => 
          a.name?.toUpperCase() === coin.toUpperCase() || 
          a.displayName?.toUpperCase() === coin.toUpperCase()
        );

        if (!asset) {
          return error(`Asset ${coin} not found on chain ${chainId}. Available: ${data.data.map((a: any) => a.name).join(", ")}`, 404);
        }

        // For Solana, the deposit mechanism uses tokenVault/tokenMint
        // For EVM, it uses contractAddress
        const depositAddress = network === "SOLANA" 
          ? asset.tokenVault || asset.tokenMint 
          : asset.contractAddress;

        return success({
          coin: asset.name,
          displayName: asset.displayName,
          address: depositAddress,
          contractAddress: asset.contractAddress,
          tokenVault: asset.tokenVault,
          tokenMint: asset.tokenMint,
          network,
          chainId: parseInt(chainId),
          decimals: asset.decimals,
          depositType: asset.depositType,
          isNative: asset.isNative,
          // For Solana: users interact with the Aster smart contract to deposit
          // For EVM: users approve and deposit to the contract address
          instructions: network === "SOLANA" 
            ? "Deposit by interacting with AsterDEX Solana program. Use tokenVault for SPL tokens."
            : "Approve tokens to contractAddress, then call deposit function on AsterDEX contract."
        });
      } catch (err: any) {
        console.error("AsterDEX deposit address error:", err);
        return error(err.message, 500);
      }
    }

    // Get AsterDEX exchange info (publicly available endpoint)
    if (path === "/asterdex/exchangeinfo" && method === "GET") {
      try {
        const response = await fetch("https://fapi.asterdex.com/fapi/v1/exchangeInfo", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const text = await response.text();
          return error(`AsterDEX returned HTML. Preview: ${text.substring(0, 200)}`, 500);
        }

        const data = await response.json();
        return success({ exchangeInfo: data });
      } catch (err: any) {
        console.error("AsterDEX exchangeInfo error:", err);
        return error(err.message, 500);
      }
    }

    // Get AsterDEX account balance (supports spot and futures via accountType query param)
    if (path === "/asterdex/balance" && method === "GET") {
      const apiKey = Deno.env.get("ASTERDEX_API_KEY");
      const apiSecret = Deno.env.get("ASTERDEX_API_SECRET");

      if (!apiKey || !apiSecret) {
        return error("AsterDEX credentials not configured", 500);
      }

      try {
        const accountType = url.searchParams.get("accountType") || "futures";
        const timestamp = Date.now();
        const params: Record<string, string | number> = {
          timestamp: timestamp,
          recvWindow: 60000,
        };

        const signature = await signAsterDexRequest(params, apiSecret);
        const queryString = new URLSearchParams(params as Record<string, string>).toString();

        // Use different endpoint based on account type
        const baseUrl = accountType === "spot" 
          ? "https://sapi.asterdex.com/api/v1/account"  // Spot account
          : "https://fapi.asterdex.com/fapi/v2/balance"; // Futures balance

        const response = await fetch(
          `${baseUrl}?${queryString}&signature=${signature}`,
          {
            method: "GET",
            headers: {
              "X-MBX-APIKEY": apiKey,
              "Content-Type": "application/json",
            },
          }
        );

        const contentType = response.headers.get("content-type") || "";
        const responseText = await response.text();

        if (!contentType.includes("application/json")) {
          return error(`AsterDEX returned HTML. Preview: ${responseText.substring(0, 200)}`, 500);
        }

        const data = JSON.parse(responseText);

        if (!response.ok) {
          console.error("AsterDEX balance error:", data);
          return error(data.msg || data.message || "Failed to get balance", response.status);
        }

        // Spot returns { balances: [...] }, Futures returns array directly
        const balances = accountType === "spot" ? data.balances : data;
        return success({ accountType, balances });
      } catch (err: any) {
        console.error("AsterDEX balance error:", err);
        return error(err.message, 500);
      }
    }

    // Get AsterDEX deposit history
    if (path === "/asterdex/deposit-history" && method === "GET") {
      const apiKey = Deno.env.get("ASTERDEX_API_KEY");
      const apiSecret = Deno.env.get("ASTERDEX_API_SECRET");

      if (!apiKey || !apiSecret) {
        return error("AsterDEX credentials not configured", 500);
      }

      try {
        const coin = url.searchParams.get("coin");
        const status = url.searchParams.get("status"); // 0: pending, 1: success
        const startTime = url.searchParams.get("startTime");
        const endTime = url.searchParams.get("endTime");
        const limit = url.searchParams.get("limit") || "100";

        const timestamp = Date.now();
        const params: Record<string, string | number> = {
          timestamp: timestamp,
          recvWindow: 60000,
          limit: Number(limit),
        };

        if (coin) params.coin = coin;
        if (status) params.status = Number(status);
        if (startTime) params.startTime = Number(startTime);
        if (endTime) params.endTime = Number(endTime);

        const signature = await signAsterDexRequest(params, apiSecret);
        const queryString = new URLSearchParams(params as Record<string, string>).toString();

        const response = await fetch(
          `https://sapi.asterdex.com/sapi/v1/capital/deposit/hisrec?${queryString}&signature=${signature}`,
          {
            method: "GET",
            headers: {
              "X-MBX-APIKEY": apiKey,
              "Content-Type": "application/json",
            },
          }
        );

        const contentType = response.headers.get("content-type") || "";
        const responseText = await response.text();

        if (!contentType.includes("application/json")) {
          return error(`AsterDEX returned HTML. Preview: ${responseText.substring(0, 200)}`, 500);
        }

        const data = JSON.parse(responseText);

        if (!response.ok) {
          console.error("AsterDEX deposit history error:", data);
          return error(data.msg || data.message || "Failed to get deposit history", response.status);
        }

        return success({ deposits: data });
      } catch (err: any) {
        console.error("AsterDEX deposit history error:", err);
        return error(err.message, 500);
      }
    }

    // Test AsterDEX connectivity (public ping endpoint)
    if (path === "/asterdex/ping" && method === "GET") {
      try {
        const response = await fetch("https://fapi.asterdex.com/fapi/v1/ping", {
          method: "GET",
        });

        const contentType = response.headers.get("content-type") || "";
        const responseText = await response.text();

        console.log("AsterDEX ping status:", response.status);
        console.log("AsterDEX ping content-type:", contentType);

        if (!response.ok) {
          return error(`AsterDEX ping failed. Status: ${response.status}`, response.status);
        }

        return success({ 
          connected: true,
          response: responseText || "{}",
          status: response.status 
        });
      } catch (err: any) {
        console.error("AsterDEX ping error:", err);
        return error(err.message, 500);
      }
    }

    // Get AsterDEX server time (public endpoint)
    if (path === "/asterdex/time" && method === "GET") {
      try {
        const response = await fetch("https://fapi.asterdex.com/fapi/v1/time", {
          method: "GET",
        });

        const data = await response.json();
        return success({ serverTime: data.serverTime });
      } catch (err: any) {
        console.error("AsterDEX time error:", err);
        return error(err.message, 500);
      }
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

// ==================== HELIUS & DEPOSIT HELPERS ====================

// Supported token mints on Solana
const SOLANA_TOKEN_MINTS: Record<string, { symbol: string; decimals: number }> = {
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": { symbol: "USDC", decimals: 6 },
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": { symbol: "USDT", decimals: 6 },
};

async function processHeliusTransaction(supabase: any, tx: any) {
  console.log("Processing Helius transaction:", tx.signature);
  
  try {
    // Extract relevant data from Helius webhook payload
    const signature = tx.signature;
    const type = tx.type;
    
    // We're interested in token transfers
    if (type !== "TRANSFER" && type !== "TOKEN_TRANSFER") {
      console.log(`Skipping non-transfer transaction: ${type}`);
      return;
    }

    // Check if transaction already processed
    const { data: existingTx } = await supabase
      .from("wallet_transactions")
      .select("id")
      .eq("tx_id", signature)
      .maybeSingle();

    if (existingTx) {
      console.log(`Transaction ${signature} already processed`);
      return;
    }

    // Get our deposit addresses
    const { data: networks } = await supabase
      .from("networks")
      .select("id, main_address, chain")
      .eq("chain", "solana")
      .eq("is_active", true);

    if (!networks || networks.length === 0) {
      console.log("No Solana network configured");
      return;
    }

    const ourAddresses = new Set(networks.map((n: any) => n.main_address?.toLowerCase()).filter(Boolean));
    
    // Parse token transfers from Helius payload
    const tokenTransfers = tx.tokenTransfers || [];
    const nativeTransfers = tx.nativeTransfers || [];
    
    for (const transfer of tokenTransfers) {
      const toAccount = transfer.toUserAccount?.toLowerCase();
      
      if (!ourAddresses.has(toAccount)) continue;
      
      const mint = transfer.mint;
      const tokenInfo = SOLANA_TOKEN_MINTS[mint];
      
      if (!tokenInfo) {
        console.log(`Unknown token mint: ${mint}`);
        continue;
      }
      
      const amount = transfer.tokenAmount || (transfer.rawTokenAmount?.tokenAmount / Math.pow(10, tokenInfo.decimals));
      const fromAddress = transfer.fromUserAccount;
      
      console.log(`Detected ${tokenInfo.symbol} deposit: ${amount} from ${fromAddress}`);
      
      // Find the user by their linked wallet address
      const { data: link } = await supabase
        .from("links")
        .select("user_id")
        .eq("address", fromAddress)
        .eq("chain", "SOLANA")
        .maybeSingle();
      
      if (!link) {
        console.log(`No user found for address ${fromAddress}, storing as pending`);
        // Store as pending deposit for manual review
        await supabase.from("wallet_transactions").insert({
          user_id: 0, // System/pending
          asset_id: await getAssetIdBySymbol(supabase, tokenInfo.symbol),
          network_id: networks[0].id,
          tx_id: signature,
          amount,
          from_address: fromAddress,
          to_address: toAccount,
          type: "Deposit",
          status: "Pending",
          memo: JSON.stringify({ requiresUserLink: true }),
        });
        continue;
      }
      
      // Process the deposit
      await processConfirmedDeposit(supabase, link.user_id, signature, tokenInfo.symbol, amount, fromAddress, networks[0].id);
    }
    
    // Handle native SOL transfers
    for (const transfer of nativeTransfers) {
      const toAccount = transfer.toUserAccount?.toLowerCase();
      
      if (!ourAddresses.has(toAccount)) continue;
      
      const amount = transfer.amount / 1e9; // SOL has 9 decimals
      const fromAddress = transfer.fromUserAccount;
      
      console.log(`Detected SOL deposit: ${amount} from ${fromAddress}`);
      
      const { data: link } = await supabase
        .from("links")
        .select("user_id")
        .eq("address", fromAddress)
        .eq("chain", "SOLANA")
        .maybeSingle();
      
      if (!link) {
        console.log(`No user found for SOL deposit from ${fromAddress}`);
        continue;
      }
      
      await processConfirmedDeposit(supabase, link.user_id, signature, "SOL", amount, fromAddress, networks[0].id);
    }
  } catch (err: any) {
    console.error("Error processing Helius transaction:", err);
    throw err;
  }
}

async function getAssetIdBySymbol(supabase: any, symbol: string): Promise<number | null> {
  const { data: asset } = await supabase
    .from("assets")
    .select("id")
    .eq("symbol", symbol)
    .maybeSingle();
  return asset?.id || null;
}

async function processConfirmedDeposit(
  supabase: any, 
  userId: number, 
  txSignature: string, 
  assetSymbol: string, 
  amount: number, 
  fromAddress: string,
  networkId: number,
  networkChain?: string
) {
  console.log(`Processing confirmed deposit for user ${userId}: ${amount} ${assetSymbol}`);
  
  const assetId = await getAssetIdBySymbol(supabase, assetSymbol);
  if (!assetId) {
    throw new Error(`Asset ${assetSymbol} not found`);
  }
  
  // Get asset network for minimum deposit check
  const { data: assetNetwork } = await supabase
    .from("asset_networks")
    .select("*, network:networks(*)")
    .eq("asset_id", assetId)
    .eq("network_id", networkId)
    .maybeSingle();

  if (!assetNetwork) {
    throw new Error(`Asset network config not found for ${assetSymbol}`);
  }

  // Get the network chain from the network data if not provided
  const chain = networkChain || assetNetwork.network?.chain || "solana";

  if (amount < assetNetwork.min_deposit) {
    console.log(`Deposit ${amount} below minimum ${assetNetwork.min_deposit}`);
    // Still record but mark as below minimum
    await supabase.from("wallet_transactions").insert({
      user_id: userId,
      asset_id: assetId,
      network_id: networkId,
      tx_id: txSignature,
      amount,
      from_address: fromAddress,
      to_address: assetNetwork.network?.main_address,
      type: "Deposit",
      status: "BelowMinimum",
      memo: JSON.stringify({ minRequired: assetNetwork.min_deposit }),
    });
    return { status: "below_minimum", minRequired: assetNetwork.min_deposit };
  }

  // Credit user's wallet
  const walletResult = await modifyWallet(supabase, userId, amount, { assetId });
  if (!walletResult.success) {
    throw new Error(`Failed to credit wallet: ${walletResult.error}`);
  }

  // Create transaction record
  await supabase.from("wallet_transactions").insert({
    user_id: userId,
    asset_id: assetId,
    network_id: networkId,
    tx_id: txSignature,
    amount,
    from_address: fromAddress,
    to_address: assetNetwork.network?.main_address,
    type: "Deposit",
    status: "Completed",
  });

  console.log(`Deposit completed: ${amount} ${assetSymbol} credited to user ${userId}`);

  // Forward funds to AsterDEX (in background) with correct network
  EdgeRuntime.waitUntil(forwardToAsterDex(assetSymbol, amount, txSignature, userId, chain));
  // Check and activate referral bonus
  const { data: referral } = await supabase
    .from("referrals")
    .select("*")
    .eq("referee_id", userId)
    .eq("status", false)
    .maybeSingle();

  if (referral) {
    await supabase
      .from("referrals")
      .update({ status: true })
      .eq("id", referral.id);

    // Add referral bonus to both users
    await addStaticAmount(supabase, referral.referrer_id, 50);
    await addStaticAmount(supabase, userId, 50);
  }

  return { status: "completed", amount, assetSymbol };
}

async function verifyAndProcessSolanaDeposit(
  supabase: any, 
  userId: number, 
  txSignature: string,
  networkId?: number,
  assetId?: number
) {
  console.log(`Verifying Solana deposit: ${txSignature} for user ${userId}`);
  
  const heliusApiKey = Deno.env.get("HELIUS_API_KEY");
  if (!heliusApiKey) {
    throw new Error("Helius API key not configured");
  }

  // Check if transaction already processed
  const { data: existingTx } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("tx_id", txSignature)
    .maybeSingle();

  if (existingTx) {
    if (existingTx.user_id === userId) {
      return { status: "already_processed", transaction: existingTx };
    }
    throw new Error("Transaction already processed for another user");
  }

  // Get user's Solana address
  const { data: userLink } = await supabase
    .from("links")
    .select("address")
    .eq("user_id", userId)
    .eq("chain", "SOLANA")
    .maybeSingle();

  if (!userLink) {
    throw new Error("No Solana wallet linked to this account");
  }

  // Fetch transaction details from Helius
  const response = await fetch(`https://api.helius.xyz/v0/transactions/?api-key=${heliusApiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactions: [txSignature] }),
  });

  if (!response.ok) {
    throw new Error(`Helius API error: ${response.status}`);
  }

  const [txData] = await response.json();
  
  if (!txData) {
    throw new Error("Transaction not found or not confirmed yet");
  }

  console.log("Helius transaction data:", JSON.stringify(txData).substring(0, 500));

  // Get our deposit addresses
  const { data: networks } = await supabase
    .from("networks")
    .select("id, main_address, chain")
    .eq("chain", "solana")
    .eq("is_active", true);

  if (!networks || networks.length === 0) {
    throw new Error("No Solana network configured");
  }

  const ourAddresses = new Set(networks.map((n: any) => n.main_address?.toLowerCase()).filter(Boolean));
  const targetNetworkId = networkId || networks[0].id;

  // Check token transfers
  const tokenTransfers = txData.tokenTransfers || [];
  
  for (const transfer of tokenTransfers) {
    const toAccount = transfer.toUserAccount?.toLowerCase();
    const fromAccount = transfer.fromUserAccount?.toLowerCase();
    
    // Verify this is from the user's wallet to our address
    if (!ourAddresses.has(toAccount)) continue;
    if (fromAccount !== userLink.address.toLowerCase()) continue;
    
    const mint = transfer.mint;
    const tokenInfo = SOLANA_TOKEN_MINTS[mint];
    
    if (!tokenInfo) {
      console.log(`Unknown token mint: ${mint}`);
      continue;
    }
    
    const amount = transfer.tokenAmount || (transfer.rawTokenAmount?.tokenAmount / Math.pow(10, tokenInfo.decimals));
    
    console.log(`Verified ${tokenInfo.symbol} deposit: ${amount}`);
    
    return await processConfirmedDeposit(
      supabase, 
      userId, 
      txSignature, 
      tokenInfo.symbol, 
      amount, 
      userLink.address,
      targetNetworkId
    );
  }

  // Check native SOL transfers
  const nativeTransfers = txData.nativeTransfers || [];
  
  for (const transfer of nativeTransfers) {
    const toAccount = transfer.toUserAccount?.toLowerCase();
    const fromAccount = transfer.fromUserAccount?.toLowerCase();
    
    if (!ourAddresses.has(toAccount)) continue;
    if (fromAccount !== userLink.address.toLowerCase()) continue;
    
    const amount = transfer.amount / 1e9;
    
    console.log(`Verified SOL deposit: ${amount}`);
    
    return await processConfirmedDeposit(
      supabase, 
      userId, 
      txSignature, 
      "SOL", 
      amount, 
      userLink.address,
      targetNetworkId
    );
  }

  throw new Error("No valid deposit found in transaction");
}

// ==================== ASTERDEX API V3 INTEGRATION ====================
// Based on official docs: https://github.com/asterdex/api-docs/blob/master/aster-deposit-withdrawal.md
// 
// IMPORTANT: AsterDEX automatically detects on-chain deposits
// There is NO deposit credit API - deposits are processed when detected on-chain
// Supported networks: EVM (BSC/ETH/Arbitrum) and SOLANA only - NO TRON
//
// Network mapping to AsterDEX format:
// - EVM networks use chainId: 56 (BSC), 1 (ETH), 42161 (Arbitrum)
// - Solana uses chainId: 101

// Chain identifier to AsterDEX chainId mapping
const CHAIN_TO_ASTERDEX: Record<string, { chainId: number; network: string }> = {
  "solana": { chainId: 101, network: "SOLANA" },
  "sol": { chainId: 101, network: "SOLANA" },
  "bsc": { chainId: 56, network: "EVM" },
  "bnb": { chainId: 56, network: "EVM" },
  "eth": { chainId: 1, network: "EVM" },
  "ethereum": { chainId: 1, network: "EVM" },
  "arbitrum": { chainId: 42161, network: "EVM" },
  "arb": { chainId: 42161, network: "EVM" },
  // Note: TRON is NOT supported by AsterDEX
};

// HMAC-SHA256 signature helper for AsterDEX (Binance-like API)
async function signAsterDexRequest(params: Record<string, string | number>, apiSecret: string): Promise<string> {
  const queryString = new URLSearchParams(params as Record<string, string>).toString();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(apiSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(queryString));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Log deposit to AsterDEX - deposits are auto-detected on-chain
// This function logs the deposit for tracking and can notify internal systems
async function logAsterDexDeposit(
  assetSymbol: string, 
  amount: number, 
  txSignature: string, 
  userId: number,
  networkChain: string = "solana"
) {
  const apiKey = Deno.env.get("ASTERDEX_API_KEY");
  const apiSecret = Deno.env.get("ASTERDEX_API_SECRET");
  
  if (!apiKey || !apiSecret) {
    console.log("AsterDEX credentials not configured, skipping deposit log");
    return;
  }

  // Get AsterDEX network info
  const asterDexInfo = CHAIN_TO_ASTERDEX[networkChain.toLowerCase()];
  
  if (!asterDexInfo) {
    console.log(`Network ${networkChain} is not supported by AsterDEX (only EVM and Solana)`);
    return;
  }

  console.log(`[AsterDEX] Deposit detected: ${amount} ${assetSymbol} on ${asterDexInfo.network} (chainId: ${asterDexInfo.chainId})`);
  console.log(`[AsterDEX] TX: ${txSignature}, User: ${userId}`);
  
  // AsterDEX automatically detects on-chain deposits
  // The deposit will be credited when confirmed on the blockchain
  // We log this for tracking purposes
  
  try {
    // Check available deposit assets on AsterDEX to verify support
    const checkUrl = `https://www.asterdex.com/bapi/futures/v1/public/future/aster/deposit/assets?chainIds=${asterDexInfo.chainId}&networks=${asterDexInfo.network}&accountType=spot`;
    
    const response = await fetch(checkUrl);
    if (response.ok) {
      const data = await response.json();
      console.log(`[AsterDEX] Deposit assets for chain ${asterDexInfo.chainId}:`, 
        data.success ? `${data.data?.length || 0} assets available` : "API error");
    }
    
    console.log(`[AsterDEX] Deposit will be auto-credited when confirmed on-chain`);
  } catch (err: any) {
    console.error("[AsterDEX] Check error:", err.message);
    // Don't throw - this is just for logging
  }
}

// Transfer funds between Spot and Futures on AsterDEX
async function transferToAsterDexFutures(
  apiKey: string, 
  apiSecret: string, 
  asset: string, 
  amount: number,
  chainId: number
) {
  try {
    // Determine API base URL based on network
    const isEVM = chainId !== 101;
    const baseUrl = isEVM ? "https://fapi.asterdex.com" : "https://fapi.asterdex.com";
    
    // Universal Transfer endpoint (spot to futures)
    const params: Record<string, string | number> = {
      type: "SPOT_TO_PERP",
      asset: asset,
      amount: amount,
      timestamp: Date.now(),
      recvWindow: 60000,
    };

    const signature = await signAsterDexRequest(params, apiSecret);
    const queryString = new URLSearchParams(params as Record<string, string>).toString();

    const response = await fetch(`${baseUrl}/fapi/v1/asset/transfer?${queryString}&signature=${signature}`, {
      method: "POST",
      headers: {
        "X-MBX-APIKEY": apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AsterDEX] Transfer to futures failed: ${response.status} - ${errorText}`);
      return { success: false, error: errorText };
    }

    const result = await response.json();
    console.log("[AsterDEX] Transfer to futures result:", result);
    return { success: true, data: result };
  } catch (err: any) {
    console.error("[AsterDEX] Transfer error:", err.message);
    return { success: false, error: err.message };
  }
}

// Get account balances from AsterDEX - uses EIP-712 signing for v3 API
// Note: For server-side API calls, we need Agent Wallet credentials set up
async function getAsterDexBalance(apiKey: string, apiSecret: string, accountType: string = "spot") {
  try {
    const timestamp = Date.now();
    const params: Record<string, string | number> = {
      timestamp: timestamp,
      recvWindow: 60000,
    };

    const signature = await signAsterDexRequest(params, apiSecret);
    const queryString = new URLSearchParams(params as Record<string, string>).toString();

    // For spot: use sapi, for futures: use fapi
    const baseUrl = accountType === "spot" 
      ? "https://www.asterdex.com/api/v3"
      : "https://fapi.asterdex.com/fapi/v3";

    const response = await fetch(`${baseUrl}/account?${queryString}&signature=${signature}`, {
      method: "GET",
      headers: {
        "X-MBX-APIKEY": apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AsterDEX] Balance check failed: ${response.status} - ${errorText}`);
      return null;
    }

    const result = await response.json();
    return result;
  } catch (err: any) {
    console.error("[AsterDEX] Balance check error:", err.message);
    return null;
  }
}

// Main function to handle deposit forwarding
// Since AsterDEX auto-detects deposits, this logs and optionally transfers to futures
async function forwardToAsterDex(
  assetSymbol: string, 
  amount: number, 
  txSignature: string, 
  userId: number,
  networkChain: string = "solana"
) {
  // Log the deposit
  await logAsterDexDeposit(assetSymbol, amount, txSignature, userId, networkChain);
  
  // Optionally, after deposit is confirmed on AsterDEX, 
  // we could transfer from spot to futures if needed
  // This would require checking balance first and then transferring
  
  const apiKey = Deno.env.get("ASTERDEX_API_KEY");
  const apiSecret = Deno.env.get("ASTERDEX_API_SECRET");
  
  if (apiKey && apiSecret) {
    // Check if we should auto-transfer to futures (configurable)
    const autoTransferToFutures = false; // Set to true if needed
    
    if (autoTransferToFutures) {
      const asterDexInfo = CHAIN_TO_ASTERDEX[networkChain.toLowerCase()];
      if (asterDexInfo) {
        // Wait a bit for the deposit to be credited
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second delay
        await transferToAsterDexFutures(apiKey, apiSecret, assetSymbol, amount, asterDexInfo.chainId);
      }
    }
  }
}
