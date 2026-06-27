import express from "express";
import supabase from "../db/postgres.js";
import { requireCampaignManager } from "../middleware/auth.js";
import crypto from "crypto";
import { runSafeAI } from "../ai/gateway/aiGateway.js";
import { sendEmail } from "../services/email.js";

const router = express.Router();

const ai = await runSafeAI({
  role: "merchant",
  task: "Explain dashboard performance",
  language: "ar",
  input: {
    businessName: "Coco Bubble Tea",
    wallet: 12.5,
    directLeads: 15,
    categoryLeads: 8,
  },
});

console.log(ai);

// GET dashboard overview
router.get("/dashboard", requireCampaignManager, async (req, res) => {
  try {
    const ownerId = req.campaignOwner.ownerId;

    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("owner_id", ownerId);

    if (error) throw error;

    const totalBudget = (campaigns || []).reduce(
      (sum, c) => sum + Number(c.total_budget || 0),
      0
    );

    const remainingBudget = (campaigns || []).reduce(
      (sum, c) => sum + Number(c.remaining_budget || 0),
      0
    );

    const usedBudget = totalBudget - remainingBudget;

    return res.json({
      ok: true,
      overview: {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter((c) => c.status === "active").length,
        totalBudget,
        usedBudget,
        remainingBudget,
      },
      campaigns,
    });
  } catch (err) {
    console.error("CAMPAIGN DASHBOARD ERROR:", err);
    return res.status(500).json({ error: "Failed to load dashboard" });
  }
});

// CREATE campaign
router.post("/campaigns", requireCampaignManager, async (req, res) => {
  try {
    const ownerId = req.campaignOwner.ownerId;

    const {
      name,
      totalBudget = 0,
      currency = "JOD",
      creditPerBusiness = 20,
      startsAt = null,
      expiresAt = null,
    } = req.body || {};

    if (!name) {
      return res.status(400).json({ error: "Campaign name is required" });
    }

    const budget = Number(totalBudget || 0);

    if (!Number.isFinite(budget) || budget <= 0) {
      return res.status(400).json({ error: "Invalid campaign budget" });
    }

    const { data: campaign, error } = await supabase
      .from("campaigns")
      .insert({
        owner_id: ownerId,
        name: String(name).trim(),
        total_budget: budget,
        remaining_budget: budget,
        currency,
        credit_per_business: Number(creditPerBusiness || 20),
        starts_at: startsAt,
        expires_at: expiresAt,
       status: "pending_approval",
approval_status: "pending",
approved_by: null,
approved_at: null,
      })
      .select("*")
      .single();

    if (error) throw error;

   return res.status(201).json({
  ok: true,
  campaign,
  message: "Campaign submitted for admin approval",
});
  } catch (err) {
    console.error("CREATE CAMPAIGN ERROR:", err);
    return res.status(500).json({ error: "Failed to create campaign" });
  }
});

// LIST campaigns
router.get("/campaigns", requireCampaignManager, async (req, res) => {
  try {
    const ownerId = req.campaignOwner.ownerId;

    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({
      ok: true,
      campaigns: campaigns || [],
    });
  } catch (err) {
    console.error("LIST CAMPAIGNS ERROR:", err);
    return res.status(500).json({ error: "Failed to load campaigns" });
  }
});

// UPDATE campaign status
router.patch("/campaigns/:id/status", requireCampaignManager, async (req, res) => {
  try {
    const ownerId = req.campaignOwner.ownerId;
    const campaignId = req.params.id;
    const { status } = req.body || {};

  const allowed = ["paused", "completed", "cancelled"];

    if (status === "active") {
  return res.status(403).json({
    error: "Campaign activation requires admin approval",
  });
}

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const { data: campaign, error } = await supabase
      .from("campaigns")
      .update({ status })
      .eq("id", campaignId)
      .eq("owner_id", ownerId)
      .select("*")
      .single();

    if (error) throw error;

    return res.json({
      ok: true,
      campaign,
    });
  } catch (err) {
    console.error("UPDATE CAMPAIGN STATUS ERROR:", err);
    return res.status(500).json({ error: "Failed to update campaign" });
  }
});

// LIST campaign participants
router.get("/participants", requireCampaignManager, async (req, res) => {
  try {
    const ownerId = req.campaignOwner.ownerId;

    const { data: campaigns, error: campaignsError } = await supabase
      .from("campaigns")
      .select("id")
      .eq("owner_id", ownerId);

    if (campaignsError) throw campaignsError;

    const campaignIds = (campaigns || []).map((c) => c.id);

    if (!campaignIds.length) {
      return res.json({
        ok: true,
        participants: [],
        totalCredits: 0,
        activeParticipants: 0,
      });
    }

    const { data: fundingCodes, error: codesError } = await supabase
      .from("funding_codes")
      .select("id, code, campaign_id")
      .in("campaign_id", campaignIds);

    if (codesError) throw codesError;

    const fundingCodeIds = (fundingCodes || []).map((c) => c.id);

    if (!fundingCodeIds.length) {
      return res.json({
        ok: true,
        participants: [],
        totalCredits: 0,
        activeParticipants: 0,
      });
    }

    const { data: claims, error: claimsError } = await supabase
      .from("campaign_claims")
      .select(`
        id,
        funding_code_id,
        business_id,
        claimed_amount,
        created_at
      `)
      .in("funding_code_id", fundingCodeIds)
      .order("created_at", { ascending: false });

    if (claimsError) throw claimsError;

    const businessIds = [
      ...new Set((claims || []).map((c) => c.business_id).filter(Boolean)),
    ];

    let businesses = [];

    if (businessIds.length) {
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select(`
          id,
          name,
          name_ar,
          whatsapp,
          country_code,
          sponsored_balance,
          sponsored_status,
          wallet_currency
        `)
        .in("id", businessIds);

      if (businessError) throw businessError;

      businesses = businessData || [];
    }

    const businessMap = new Map(businesses.map((b) => [b.id, b]));
    const codeMap = new Map((fundingCodes || []).map((c) => [c.id, c]));

    const participants = (claims || []).map((claim) => {
      const business = businessMap.get(claim.business_id);
      const code = codeMap.get(claim.funding_code_id);

      return {
        id: claim.id,
        business_id: claim.business_id,
        name: business?.name || "-",
        name_ar: business?.name_ar || business?.name || "-",
        whatsapp: business?.whatsapp || "-",
        country: business?.country_code || "-",
        sponsored_balance:
          Number(business?.sponsored_balance ?? claim.claimed_amount ?? 0),
        sponsored_status: business?.sponsored_status || "active",
        wallet_currency: business?.wallet_currency || "JOD",
        code: code?.code || "-",
        claimed_at: claim.created_at,
      };
    });

    return res.json({
      ok: true,
      participants,
      totalCredits: participants.reduce(
        (sum, p) => sum + Number(p.sponsored_balance || 0),
        0
      ),
      activeParticipants: participants.filter(
        (p) => p.sponsored_status === "active"
      ).length,
    });
  } catch (err) {
    console.error("CAMPAIGN PARTICIPANTS ERROR:", err);
    return res.status(500).json({
      error: "Failed to load participants",
    });
  }
});

// INVITE team member
router.post("/team/invite", requireCampaignManager, async (req, res) => {
  try {
    const ownerId = req.campaignOwner.ownerId;
    const { email, role = "manager" } = req.body || {};

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const allowedRoles = ["manager", "admin", "viewer"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    const inviteToken =
      crypto.randomUUID() + "-" + Date.now();

    const { data, error } = await supabase
      .from("campaign_team_invites")
      .insert({
        owner_id: ownerId,
        email: email.toLowerCase().trim(),
        role,
        token: inviteToken,
        status: "pending",
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
      .select("*")
      .single();

    if (error) throw error;

    const inviteUrl = `${
      process.env.FRONTEND_BASE_URL || "https://trustedlinks.net"
    }/campaign/accept-invite?token=${inviteToken}`;

   await sendEmail({
  to: email,
  subject: "You're invited to TrustedLinks Campaign",
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
      <h2>You've been invited</h2>

      <p>You have been invited to join the TrustedLinks Campaign team.</p>

      <p>
        Click the button below to accept your invitation.
      </p>

      <p style="margin:35px 0">
        <a
          href="${inviteUrl}"
          style="
            background:#16a34a;
            color:#fff;
            padding:14px 26px;
            text-decoration:none;
            border-radius:8px;
            display:inline-block;
            font-weight:bold;
          "
        >
          Accept Invitation
        </a>
      </p>

      <p>
        Or copy this link:
      </p>

      <p>
        ${inviteUrl}
      </p>

      <hr>

      <small>
        This invitation expires in 7 days.
      </small>
    </div>
  `,
  text: inviteUrl,
});

console.log("Invitation email sent:", email);
  return res.json({
  ok: true,
  message: "Invitation email sent successfully",
});
  } catch (err) {
    console.error("CAMPAIGN TEAM INVITE ERROR:", err);

    return res.status(500).json({
      message: "Failed to send invitation",
    });
  }
});

// ACCEPT team invite
router.post("/team/accept", async (req, res) => {
  try {
    const { token } = req.body || {};

    if (!token) {
      return res.status(400).json({
        message: "Invitation token is required",
      });
    }

    const { data: invite, error: inviteError } = await supabase
      .from("campaign_team_invites")
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .single();

    if (inviteError || !invite) {
      return res.status(404).json({
        message: "Invalid or expired invitation",
      });
    }

    if (new Date(invite.expires_at) < new Date()) {
      await supabase
        .from("campaign_team_invites")
        .update({ status: "expired" })
        .eq("id", invite.id);

      return res.status(410).json({
        message: "Invitation has expired",
      });
    }

    const email = invite.email.toLowerCase().trim();

    const { data: member, error: memberError } = await supabase
      .from("campaign_team_members")
      .upsert(
        {
          owner_id: invite.owner_id,
          email,
          role: invite.role,
          status: "active",
          invited_at: invite.created_at,
          joined_at: new Date().toISOString(),
        },
        {
          onConflict: "owner_id,email",
        }
      )
      .select("*")
      .single();

    if (memberError) throw memberError;

    await supabase
      .from("campaign_team_invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    return res.json({
      ok: true,
      member,
      message: "Invitation accepted successfully",
    });
  } catch (err) {
    console.error("ACCEPT CAMPAIGN INVITE ERROR:", err);

    return res.status(500).json({
      message: "Failed to accept invitation",
    });
  }
});

// LIST team members
router.get("/team/members", requireCampaignManager, async (req, res) => {
  try {
    const ownerId = req.campaignOwner.ownerId;

    const { data: members, error } = await supabase
      .from("campaign_team_members")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return res.json({
      ok: true,
      members: members || [],
    });
  } catch (err) {
    console.error("LIST CAMPAIGN TEAM MEMBERS ERROR:", err);

    return res.status(500).json({
      message: "Failed to load team members",
    });
  }
});

export default router;
