import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to create HMAC token
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
            .select("id")
            .eq("id", refId)
            .maybeSingle();

          if (referrer) {
            await supabase.from("referrals").insert({
              referrer_id: referrer.id,
              referee_id: newUser.id,
            });
            await supabase
              .from("users")
              .update({ friends: referrer.id })
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

    // ==================== TRADE ROUTES ====================
    if (path === "/trade/pairs" && method === "GET") {
      const { data: pairs } = await supabase
        .from("trading_pairs")
        .select("*")
        .eq("active", true);

      return success(pairs || []);
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

    if (path.startsWith("/tokens/") && method === "GET") {
      const slug = path.replace("/tokens/", "");
      const { data: token } = await supabase
        .from("airdrop_tokens")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!token) return error("Token not found", 404);
      return success(token);
    }

    if (path === "/tokens/claim" && method === "POST") {
      const user = await getAuthUser(supabase, token!);
      if (!user) return error("Unauthorized", 401);

      const { tokenId } = await req.json();

      // Get token info
      const { data: airdropToken } = await supabase
        .from("airdrop_tokens")
        .select("*")
        .eq("id", tokenId)
        .maybeSingle();

      if (!airdropToken) return error("Token not found", 404);

      // Check if already claimed
      const { data: existing } = await supabase
        .from("user_tokens")
        .select("*")
        .eq("user_id", user.id)
        .eq("token_id", tokenId)
        .maybeSingle();

      const now = new Date();
      const multiplier = user.level || 1;

      if (existing) {
        // Check if 24h has passed since last claim
        const lastAction = new Date(existing.last_action_at);
        const hoursSince = (now.getTime() - lastAction.getTime()) / (1000 * 60 * 60);

        if (hoursSince < 24) {
          return error("Can only claim once per 24 hours");
        }

        // Update balance with daily reward
        const reward = airdropToken.daily_reward * multiplier;
        await supabase
          .from("user_tokens")
          .update({
            balance: existing.balance + reward,
            last_action_at: now.toISOString(),
          })
          .eq("id", existing.id);

        return success({ claimed: reward, balance: existing.balance + reward });
      } else {
        // First time claim - give initial airdrop
        const reward = airdropToken.initial_airdrop * multiplier;
        await supabase.from("user_tokens").insert({
          user_id: user.id,
          token_id: tokenId,
          balance: reward,
          last_action_at: now.toISOString(),
        });

        return success({ claimed: reward, balance: reward });
      }
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
        .maybeSingle();

      if (!mission) return error("Mission not found", 404);

      // Mark as completed
      await supabase.from("user_missions").insert({
        user_id: user.id,
        mission_id: missionId,
      });

      // Get user tokens and return
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
