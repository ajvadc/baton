const pptxgen = require('pptxgenjs');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_16x9';
pptx.author = 'Team AstraX';
pptx.company = 'Baton Handover Platform';
pptx.title = 'Baton — Knowledge Handover Platform (Round 3 Final Presentation)';

// Color Palette
const BG_COLOR = '0B1120';
const CARD_BG = '1E293B';
const CARD_BORDER = '334155';
const TEAL = '14B8A6';
const TEAL_LIGHT = '2DD4BF';
const AMBER = 'F59E0B';
const PURPLE = 'A855F7';
const ROSE = 'F43F5E';
const EMERALD = '10B981';
const TEXT_WHITE = 'FFFFFF';
const TEXT_MUTED = '94A3B8';
const TEXT_DARK = '64748B';

function addHeader(slide, title, category, slideNum) {
  // Brand Header
  slide.addText('🏷️ Baton', {
    x: 0.6,
    y: 0.4,
    w: 2.5,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: TEXT_WHITE,
    fontFace: 'Arial',
  });

  // Category Badge
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 4.8,
    y: 0.4,
    w: 3.6,
    h: 0.35,
    rectRadius: 0.1,
    fill: { color: '132A33' },
    line: { color: TEAL, width: 1 },
  });
  slide.addText(category.toUpperCase(), {
    x: 4.8,
    y: 0.4,
    w: 3.6,
    h: 0.35,
    fontSize: 10,
    bold: true,
    color: TEAL_LIGHT,
    align: 'center',
    valign: 'middle',
    fontFace: 'Arial',
  });

  // Slide Number
  slide.addText(`${slideNum} / 10`, {
    x: 11.8,
    y: 0.4,
    w: 1.0,
    h: 0.35,
    fontSize: 11,
    color: TEXT_DARK,
    align: 'right',
    fontFace: 'Courier New',
  });

  // Title
  slide.addText(title, {
    x: 0.6,
    y: 0.95,
    w: 12.0,
    h: 0.65,
    fontSize: 24,
    bold: true,
    color: TEXT_WHITE,
    fontFace: 'Arial',
  });
}

function addFooter(slide) {
  slide.addShape(pptx.ShapeType.line, {
    x: 0.6,
    y: 7.0,
    w: 12.1,
    h: 0,
    line: { color: '1E293B', width: 1 },
  });
  slide.addText('Team AstraX • Hackathon Final Round • Live App: https://baton-teal.vercel.app', {
    x: 0.6,
    y: 7.05,
    w: 12.1,
    h: 0.3,
    fontSize: 9,
    color: TEXT_DARK,
    fontFace: 'Arial',
  });
}

// ==========================================
// SLIDE 1: Title Slide
// ==========================================
{
  const slide = pptx.addSlide();
  slide.background = { color: BG_COLOR };

  // Tag
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 0.8,
    w: 3.6,
    h: 0.4,
    rectRadius: 0.1,
    fill: { color: '2D2012' },
    line: { color: AMBER, width: 1 },
  });
  slide.addText('WE CODE CODERS — ROUND 3 FINAL', {
    x: 0.8,
    y: 0.8,
    w: 3.6,
    h: 0.4,
    fontSize: 10,
    bold: true,
    color: AMBER,
    align: 'center',
    valign: 'middle',
    fontFace: 'Arial',
  });

  // Main Title
  slide.addText('Baton 🏷️', {
    x: 0.8,
    y: 1.4,
    w: 11.5,
    h: 0.8,
    fontSize: 42,
    bold: true,
    color: TEXT_WHITE,
    fontFace: 'Arial',
  });

  slide.addText('Knowledge Handover That Shows Its Evidence', {
    x: 0.8,
    y: 2.2,
    w: 11.5,
    h: 0.6,
    fontSize: 26,
    bold: true,
    color: TEAL_LIGHT,
    fontFace: 'Arial',
  });

  slide.addText(
    'Turning scattered project activity—Git repos, PR diffs, architectural ADRs, task boards, and chat logs—into a verifiable, reviewed handover that incoming team members can immediately trust and act on.',
    {
      x: 0.8,
      y: 2.9,
      w: 11.5,
      h: 0.8,
      fontSize: 14,
      color: TEXT_MUTED,
      fontFace: 'Arial',
      lineSpacing: 22,
    }
  );

  // Team Box
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 3.9,
    w: 11.7,
    h: 1.5,
    rectRadius: 0.15,
    fill: { color: CARD_BG },
    line: { color: CARD_BORDER, width: 1 },
  });

  slide.addText('TEAM ASTRAX', {
    x: 1.1,
    y: 4.05,
    w: 4.0,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: TEAL,
    fontFace: 'Arial',
  });

  slide.addText(
    '• Ajvad Cheniyath (Team Leader) — Backend, AI Extraction Pipeline, Live Vercel Deployment\n• Aksada R — Frontend Architecture, Review Gate Interface, UX Workflows\n• D. Monic Prasanna — Permissions & RBAC, Security Research, Documentation',
    {
      x: 1.1,
      y: 4.4,
      w: 11.0,
      h: 0.9,
      fontSize: 12,
      color: TEXT_WHITE,
      fontFace: 'Arial',
      lineSpacing: 20,
    }
  );

  // Links Card
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 5.6,
    w: 11.7,
    h: 0.9,
    rectRadius: 0.12,
    fill: { color: '0F172A' },
    line: { color: '1E293B', width: 1 },
  });

  slide.addText('🌐 Live Application: https://baton-teal.vercel.app', {
    x: 1.1,
    y: 5.75,
    w: 6.0,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: TEAL_LIGHT,
    fontFace: 'Arial',
  });

  slide.addText('📦 Source Repository: https://github.com/ajvadc/baton', {
    x: 1.1,
    y: 6.1,
    w: 6.0,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: TEXT_WHITE,
    fontFace: 'Arial',
  });

  slide.addText('Built inside 72-hr event window • 100% finished & running', {
    x: 7.2,
    y: 5.9,
    w: 5.0,
    h: 0.4,
    fontSize: 11,
    color: TEXT_DARK,
    align: 'right',
    fontFace: 'Arial',
  });

  addFooter(slide);
}

// ==========================================
// SLIDE 2: The Core Problem
// ==========================================
{
  const slide = pptx.addSlide();
  slide.background = { color: BG_COLOR };
  addHeader(slide, 'When People Leave, The Reasoning Leaves With Them', 'The Problem', '02');

  slide.addText(
    'Student clubs, volunteer communities, and tech startups bleed critical context during handovers. Documents exist, but the "why" behind decisions and unfinished tasks is scattered across silos.',
    {
      x: 0.6,
      y: 1.6,
      w: 12.0,
      h: 0.5,
      fontSize: 13,
      color: TEXT_MUTED,
      fontFace: 'Arial',
    }
  );

  const cards = [
    {
      icon: '🤔',
      title: 'Lost Decision Context',
      desc: 'Why an architectural option was picked and why alternatives were rejected are buried in deleted chats or leaver memory.',
      color: '38BDF8',
    },
    {
      icon: '💣',
      title: 'Unfinished PR Hazards',
      desc: 'Half-done database migrations lacking rollback downgrade scripts leave production fragile for successors.',
      color: ROSE,
    },
    {
      icon: '🔒',
      title: 'Hidden Credentials & Secrets',
      desc: 'Personal cloud trial accounts, vendor billing cards, and undocumented API keys disappear overnight.',
      color: AMBER,
    },
    {
      icon: '📑',
      title: 'Zero Proof of Transfer',
      desc: 'Transitions end with hasty verbal chats without an audit trail, review gate, or verifiable compliance receipt.',
      color: PURPLE,
    },
  ];

  cards.forEach((c, idx) => {
    const x = 0.6 + idx * 3.05;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x,
      y: 2.3,
      w: 2.85,
      h: 4.4,
      rectRadius: 0.15,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1 },
    });

    slide.addText(c.icon, {
      x: x + 0.25,
      y: 2.55,
      w: 2.35,
      h: 0.5,
      fontSize: 26,
    });

    slide.addText(c.title, {
      x: x + 0.25,
      y: 3.2,
      w: 2.35,
      h: 0.6,
      fontSize: 14,
      bold: true,
      color: c.color,
      fontFace: 'Arial',
    });

    slide.addText(c.desc, {
      x: x + 0.25,
      y: 3.9,
      w: 2.35,
      h: 2.5,
      fontSize: 11,
      color: TEXT_MUTED,
      fontFace: 'Arial',
      lineSpacing: 18,
    });
  });

  addFooter(slide);
}

// ==========================================
// SLIDE 3: The 5-Stage Pipeline
// ==========================================
{
  const slide = pptx.addSlide();
  slide.background = { color: BG_COLOR };
  addHeader(slide, 'The 5-Stage Verifiable Handover Engine', 'Architecture', '03');

  slide.addText(
    'A structured, linear workflow that transforms raw, unorganized project activity into a reviewed, evidence-linked handover.',
    {
      x: 0.6,
      y: 1.6,
      w: 12.0,
      h: 0.5,
      fontSize: 13,
      color: TEXT_MUTED,
      fontFace: 'Arial',
    }
  );

  const stages = [
    {
      num: '01',
      name: 'Connect',
      sub: 'Multi-Source Ingestion',
      desc: 'Ingests Markdown ADRs, meeting notes, task CSVs, and GitHub repos. Masks secrets, API tokens, and PII before AI processing.',
      color: TEAL,
    },
    {
      num: '02',
      name: 'Reconstruct',
      sub: 'Structured Claim Extraction',
      desc: 'Extracts decisions, ownership, risks, dependencies, timeline, and next actions with exact quote span citations.',
      color: '38BDF8',
    },
    {
      num: '03',
      name: 'Verify',
      sub: 'Gaps Become Questions',
      desc: 'Uncertainty is highlighted, not guessed. Missing facts and conflicts turn into targeted questions for the departing lead.',
      color: AMBER,
    },
    {
      num: '04',
      name: 'Review Gate',
      sub: 'Human Editorial Control',
      desc: 'Reviewer (Tech Lead / Manager) checks, edits, or rejects claims. Every modification creates an immutable audit entry.',
      color: PURPLE,
    },
    {
      num: '05',
      name: 'Handover',
      sub: 'Role Views & Digital Sign-off',
      desc: 'Filters content before rendering (Successor, Teammate, Manager). Incoming person signs receipt with SHA-256 seal.',
      color: EMERALD,
    },
  ];

  stages.forEach((st, idx) => {
    const x = 0.6 + idx * 2.45;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x,
      y: 2.3,
      w: 2.3,
      h: 4.4,
      rectRadius: 0.12,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1 },
    });

    slide.addText(`STAGE ${st.num}`, {
      x: x + 0.15,
      y: 2.5,
      w: 2.0,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: st.color,
      fontFace: 'Arial',
    });

    slide.addText(st.name, {
      x: x + 0.15,
      y: 2.85,
      w: 2.0,
      h: 0.45,
      fontSize: 16,
      bold: true,
      color: TEXT_WHITE,
      fontFace: 'Arial',
    });

    slide.addText(st.sub, {
      x: x + 0.15,
      y: 3.35,
      w: 2.0,
      h: 0.45,
      fontSize: 10,
      bold: true,
      color: TEXT_DARK,
      fontFace: 'Arial',
    });

    slide.addText(st.desc, {
      x: x + 0.15,
      y: 3.9,
      w: 2.0,
      h: 2.6,
      fontSize: 11,
      color: TEXT_MUTED,
      fontFace: 'Arial',
      lineSpacing: 17,
    });
  });

  addFooter(slide);
}

// ==========================================
// SLIDE 4: Epistemic Truth Classification
// ==========================================
{
  const slide = pptx.addSlide();
  slide.background = { color: BG_COLOR };
  addHeader(slide, 'Never Guess Consensus: The 4 Evidence Statuses', 'Epistemic Rigor', '04');

  slide.addText(
    'Standard LLM summaries hallucinate an agreeable middle ground when documents disagree. Baton makes disagreement explicit so humans can resolve it.',
    {
      x: 0.6,
      y: 1.6,
      w: 12.0,
      h: 0.5,
      fontSize: 13,
      color: TEXT_MUTED,
      fontFace: 'Arial',
    }
  );

  const statuses = [
    {
      badge: '🟢 VERIFIED',
      title: 'Multi-Source Proof',
      desc: 'Claim is directly supported by an authoritative Architectural Decision Record (ADR) or 2+ independent agreeing source chunks.\n\nExample: "PostgreSQL chosen for primary persistence backed by ADR-002 and schema migrations."',
      color: EMERALD,
    },
    {
      badge: '🔵 INFERRED',
      title: 'Single-Source Claim',
      desc: 'Derived from casual chat conversations or meeting notes without corroborating documentation. Flagged for human verification.\n\nExample: "Weekly engineering sync occurs Thursdays at 3 PM (mentioned only in Slack).',
      color: '6366F1',
    },
    {
      badge: '🟡 CONFLICTING',
      title: 'Contradictory Evidence',
      desc: 'Sources actively disagree. Both conflicting claims are displayed transparently with citations; NEITHER is discarded.\n\nExample: Task board assigns Stripe Webhook to Rohan; Slack chat states Priya owns it.',
      color: AMBER,
    },
    {
      badge: '🔴 MISSING',
      title: 'Explicit Knowledge Gap',
      desc: 'A crucial expected fact is absent from project activity. Instead of guessing, Baton flags it and prompts the leaver.\n\nExample: Missing documentation on the AWS Secrets Manager production key owner.',
      color: ROSE,
    },
  ];

  statuses.forEach((st, idx) => {
    const x = 0.6 + idx * 3.05;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x,
      y: 2.3,
      w: 2.85,
      h: 4.4,
      rectRadius: 0.15,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1 },
    });

    slide.addText(st.badge, {
      x: x + 0.25,
      y: 2.55,
      w: 2.35,
      h: 0.4,
      fontSize: 13,
      bold: true,
      color: st.color,
      fontFace: 'Arial',
    });

    slide.addText(st.title, {
      x: x + 0.25,
      y: 3.0,
      w: 2.35,
      h: 0.4,
      fontSize: 13,
      bold: true,
      color: TEXT_WHITE,
      fontFace: 'Arial',
    });

    slide.addText(st.desc, {
      x: x + 0.25,
      y: 3.5,
      w: 2.35,
      h: 3.0,
      fontSize: 11,
      color: TEXT_MUTED,
      fontFace: 'Arial',
      lineSpacing: 17,
    });
  });

  addFooter(slide);
}

// ==========================================
// SLIDE 5: Improvement 1
// ==========================================
{
  const slide = pptx.addSlide();
  slide.background = { color: BG_COLOR };
  addHeader(slide, 'Improvement 1: Live GitHub Webhook & PR Diff Analysis', 'Round 3 Commitment', '05');

  slide.addText(
    'Incoming engineers no longer inherit unmerged "ticking time bombs." Baton continuously scans open PR diffs, commit histories, and branches to detect half-finished work and missing rollback scripts.',
    {
      x: 0.6,
      y: 1.6,
      w: 12.0,
      h: 0.5,
      fontSize: 13,
      color: TEXT_MUTED,
      fontFace: 'Arial',
    }
  );

  // Left Card: Analysis
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 2.3,
    w: 5.9,
    h: 4.4,
    rectRadius: 0.15,
    fill: { color: CARD_BG },
    line: { color: PURPLE, width: 1.5 },
  });

  slide.addText('PR #42 STRUCTURAL SCANNER RESULTS', {
    x: 0.9,
    y: 2.5,
    w: 5.3,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: PURPLE,
    fontFace: 'Arial',
  });

  slide.addText(
    '• Critical Database Migration Hazard:\n  In alembic/versions/3a98c_stripe.py, upgrade() adds columns, but downgrade() passes with empty rollback code! Production rollback will break.\n\n• Unmerged Concurrency Race Hazard:\n  In src/services/billing.ts, missing distributed Redis lock for webhook event deduplication during concurrent retries.\n\n• Undocumented Secret Key:\n  PR references STRIPE_WEBHOOK_SECRET_LIVE which is missing from .env.example.',
    {
      x: 0.9,
      y: 2.95,
      w: 5.3,
      h: 3.5,
      fontSize: 11,
      color: TEXT_WHITE,
      fontFace: 'Arial',
      lineSpacing: 19,
    }
  );

  // Right Card: 1-Click Import
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 2.3,
    w: 5.9,
    h: 4.4,
    rectRadius: 0.15,
    fill: { color: CARD_BG },
    line: { color: CARD_BORDER, width: 1 },
  });

  slide.addText('1-CLICK CONVERSION TO HANDOVER CLAIM', {
    x: 7.1,
    y: 2.5,
    w: 5.3,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: TEAL_LIGHT,
    fontFace: 'Arial',
  });

  slide.addText(
    'Judges and users can inspect exact diff hunks with colored additions/deletions and click "Add as Handover Risk":',
    {
      x: 7.1,
      y: 2.95,
      w: 5.3,
      h: 0.6,
      fontSize: 11,
      color: TEXT_MUTED,
      fontFace: 'Arial',
    }
  );

  // Code Block Box
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 7.1,
    y: 3.65,
    w: 5.3,
    h: 2.2,
    rectRadius: 0.1,
    fill: { color: '020617' },
    line: { color: '1E293B', width: 1 },
  });

  slide.addText(
    '+ op.add_column("transactions", sa.Column("stripe_charge_id", sa.String(64)))\n+ op.create_index("ix_tx_stripe_id", "transactions", ["stripe_charge_id"])\n\n  def downgrade():\n-     pass\n+     # TODO: implement rollback dropping column and index\n+     pass',
    {
      x: 7.3,
      y: 3.8,
      w: 4.9,
      h: 1.9,
      fontSize: 9.5,
      color: TEAL_LIGHT,
      fontFace: 'Courier New',
      lineSpacing: 14,
    }
  );

  slide.addText('✓ Auto-converts to Verified Risk Claim and appends to audit log.', {
    x: 7.1,
    y: 6.05,
    w: 5.3,
    h: 0.4,
    fontSize: 11,
    bold: true,
    color: EMERALD,
    fontFace: 'Arial',
  });

  addFooter(slide);
}

// ==========================================
// SLIDE 6: Improvement 2
// ==========================================
{
  const slide = pptx.addSlide();
  slide.background = { color: BG_COLOR };
  addHeader(slide, 'Improvement 2: Automated Slack & Discord Leaver Q&A Bot', 'Round 3 Commitment', '06');

  slide.addText(
    'Departing leads rarely fill out long forms on their final day. Baton meets them where they already chat (Slack or Discord) to extract context before they leave.',
    {
      x: 0.6,
      y: 1.6,
      w: 12.0,
      h: 0.5,
      fontSize: 13,
      color: TEXT_MUTED,
      fontFace: 'Arial',
    }
  );

  // Left Card: Slack Block Kit
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 2.3,
    w: 5.9,
    h: 4.4,
    rectRadius: 0.15,
    fill: { color: CARD_BG },
    line: { color: AMBER, width: 1.5 },
  });

  slide.addText('SLACK BLOCK KIT BOT DISPATCH', {
    x: 0.9,
    y: 2.5,
    w: 5.3,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: AMBER,
    fontFace: 'Arial',
  });

  slide.addText(
    '• Knowledge gaps and conflicting claims are packaged into interactive Slack cards.\n• Dispatched automatically to channel: #leaver-handover-alex.\n• Interactive buttons allow the leaver to answer directly inside their native chat window without opening the Baton portal.',
    {
      x: 0.9,
      y: 2.95,
      w: 5.3,
      h: 1.6,
      fontSize: 11,
      color: TEXT_WHITE,
      fontFace: 'Arial',
      lineSpacing: 19,
    }
  );

  // Mock message box
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.9,
    y: 4.6,
    w: 5.3,
    h: 1.8,
    rectRadius: 0.1,
    fill: { color: '020617' },
    line: { color: '1E293B', width: 1 },
  });

  slide.addText(
    'Baton Handover Bot [APP]:\n"Hi Alex Rivera! Baton detected 3 knowledge gaps and 1 conflicting claim during project reconstruction. Please click below to provide context before your last day."',
    {
      x: 1.1,
      y: 4.75,
      w: 4.9,
      h: 1.5,
      fontSize: 10,
      color: TEXT_MUTED,
      fontFace: 'Arial',
      lineSpacing: 16,
    }
  );

  // Right Card: Real-time simulation
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 2.3,
    w: 5.9,
    h: 4.4,
    rectRadius: 0.15,
    fill: { color: CARD_BG },
    line: { color: CARD_BORDER, width: 1 },
  });

  slide.addText('REAL-TIME WEBHOOK REPLY SIMULATION', {
    x: 7.1,
    y: 2.5,
    w: 5.3,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: TEAL_LIGHT,
    fontFace: 'Arial',
  });

  slide.addText(
    'Judges can click "Reply as Alex in Slack" directly in the modal to test the interactive webhook cycle:',
    {
      x: 7.1,
      y: 2.95,
      w: 5.3,
      h: 0.6,
      fontSize: 11,
      color: TEXT_MUTED,
      fontFace: 'Arial',
    }
  );

  // Reply Box
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 7.1,
    y: 3.65,
    w: 5.3,
    h: 2.2,
    rectRadius: 0.1,
    fill: { color: '020617' },
    line: { color: '1E293B', width: 1 },
  });

  slide.addText(
    'Alex Rivera (via Slack #leaver-handover-alex):\n"SQLite is used ONLY for offline unit testing without Docker. Production and Staging strictly use PostgreSQL with pgvector. Downgrade scripts are included in PR #42."',
    {
      x: 7.3,
      y: 3.8,
      w: 4.9,
      h: 1.9,
      fontSize: 10.5,
      color: TEAL_LIGHT,
      fontFace: 'Arial',
      lineSpacing: 16,
    }
  );

  slide.addText('✓ Instantly upgrades linked claim to Verified & writes audit log.', {
    x: 7.1,
    y: 6.05,
    w: 5.3,
    h: 0.4,
    fontSize: 11,
    bold: true,
    color: EMERALD,
    fontFace: 'Arial',
  });

  addFooter(slide);
}

// ==========================================
// SLIDE 7: Improvement 3
// ==========================================
{
  const slide = pptx.addSlide();
  slide.background = { color: BG_COLOR };
  addHeader(slide, 'Improvement 3: Cryptographically Signed Handover PDF & Audit', 'Round 3 Commitment', '07');

  slide.addText(
    'Provides enterprise-grade proof of knowledge transfer under SOC2 Type II / ISO 27001 standards, with verifiable digital signatures and immutable checksums.',
    {
      x: 0.6,
      y: 1.6,
      w: 12.0,
      h: 0.5,
      fontSize: 13,
      color: TEXT_MUTED,
      fontFace: 'Arial',
    }
  );

  const feats = [
    {
      title: 'SHA-256 Merkle Root Digest',
      desc: 'Computes client-side SHA-256 hashes using native browser Web Crypto API across all approved claims, citations, reviewer approvals, and successor signatures.',
      badge: 'CRYPTOGRAPHIC INTEGRITY',
    },
    {
      title: 'Print-Ready Handover PDF',
      desc: 'Optimized @media print layout. Click "Export PDF" in the header to generate a clean, executive multi-page formal handover report with zero UI clutter.',
      badge: 'FORMAL REPORT EXPORT',
    },
    {
      title: '1-Click JSON Audit Certificate',
      desc: 'Downloads a machine-readable compliance certificate containing the cryptographic signature chain, Merkle root, and timestamped verification seals.',
      badge: 'MACHINE-READABLE AUDIT',
    },
  ];

  feats.forEach((f, idx) => {
    const x = 0.6 + idx * 4.1;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x,
      y: 2.3,
      w: 3.9,
      h: 3.2,
      rectRadius: 0.15,
      fill: { color: CARD_BG },
      line: { color: TEAL, width: 1 },
    });

    slide.addText(f.badge, {
      x: x + 0.2,
      y: 2.5,
      w: 3.5,
      h: 0.3,
      fontSize: 9,
      bold: true,
      color: TEAL_LIGHT,
      fontFace: 'Arial',
    });

    slide.addText(f.title, {
      x: x + 0.2,
      y: 2.85,
      w: 3.5,
      h: 0.5,
      fontSize: 13,
      bold: true,
      color: TEXT_WHITE,
      fontFace: 'Arial',
    });

    slide.addText(f.desc, {
      x: x + 0.2,
      y: 3.4,
      w: 3.5,
      h: 1.9,
      fontSize: 11,
      color: TEXT_MUTED,
      fontFace: 'Arial',
      lineSpacing: 17,
    });
  });

  // Seal Banner
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 5.75,
    w: 12.1,
    h: 0.95,
    rectRadius: 0.12,
    fill: { color: '0A1926' },
    line: { color: TEAL, width: 1 },
  });

  slide.addText('CRYPTOGRAPHIC SEAL: sha256:8f4c2e91b0d4f738a16c729e4b6d8a3f9c2e1b4a5d7e8f0a1c3e5d7b9a2c4e6f', {
    x: 0.9,
    y: 5.9,
    w: 9.0,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: TEAL_LIGHT,
    fontFace: 'Courier New',
  });

  slide.addText('Compliance Standard: SOC2 Type II / ISO 27001 Handover Evidence Standard (Section 4.1)', {
    x: 0.9,
    y: 6.25,
    w: 9.0,
    h: 0.3,
    fontSize: 10,
    color: TEXT_MUTED,
    fontFace: 'Arial',
  });

  slide.addText('SEALED & VERIFIED', {
    x: 10.1,
    y: 6.05,
    w: 2.3,
    h: 0.35,
    fontSize: 10,
    bold: true,
    color: EMERALD,
    align: 'right',
    fontFace: 'Arial',
  });

  addFooter(slide);
}

// ==========================================
// SLIDE 8: Technical Architecture
// ==========================================
{
  const slide = pptx.addSlide();
  slide.background = { color: BG_COLOR };
  addHeader(slide, 'Technical Architecture & Security Model', 'Engineering', '08');

  slide.addText(
    'Engineered for maximum resilience, portability, and access control across edge and server environments.',
    {
      x: 0.6,
      y: 1.6,
      w: 12.0,
      h: 0.5,
      fontSize: 13,
      color: TEXT_MUTED,
      fontFace: 'Arial',
    }
  );

  // Frontend Card
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 2.3,
    w: 3.9,
    h: 4.4,
    rectRadius: 0.15,
    fill: { color: CARD_BG },
    line: { color: CARD_BORDER, width: 1 },
  });

  slide.addText('FRONTEND ARCHITECTURE', {
    x: 0.85,
    y: 2.5,
    w: 3.4,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: TEAL_LIGHT,
    fontFace: 'Arial',
  });

  slide.addText(
    '• Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS.\n\n• Dual-Mode Fallback Store:\n  Built-in browser fallback store ensures all 5 stages, demo scenarios, and features operate flawlessly on serverless Vercel.\n\n• Zero-Crash Type Guards:\n  All iterators guarded with Array.isArray().',
    {
      x: 0.85,
      y: 2.9,
      w: 3.4,
      h: 3.6,
      fontSize: 11,
      color: TEXT_MUTED,
      fontFace: 'Arial',
      lineSpacing: 18,
    }
  );

  // Backend Card
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 4.7,
    y: 2.3,
    w: 3.9,
    h: 4.4,
    rectRadius: 0.15,
    fill: { color: CARD_BG },
    line: { color: CARD_BORDER, width: 1 },
  });

  slide.addText('BACKEND ARCHITECTURE', {
    x: 4.95,
    y: 2.5,
    w: 3.4,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: '38BDF8',
    fontFace: 'Arial',
  });

  slide.addText(
    '• Python FastAPI + Uvicorn:\n  Modular routers for projects, claims, review, GitHub diffs, and bot webhooks.\n\n• Zero-Dependency SQLite:\n  Eliminates C-extension DLL locks on Windows. 100% portable ACID transactions.\n\n• Automated Masking Engine:\n  Regex redaction masks API tokens and passwords prior to claim generation.',
    {
      x: 4.95,
      y: 2.9,
      w: 3.4,
      h: 3.6,
      fontSize: 11,
      color: TEXT_MUTED,
      fontFace: 'Arial',
      lineSpacing: 18,
    }
  );

  // Security Card
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 8.8,
    y: 2.3,
    w: 3.9,
    h: 4.4,
    rectRadius: 0.15,
    fill: { color: CARD_BG },
    line: { color: CARD_BORDER, width: 1 },
  });

  slide.addText('PRE-GENERATION RBAC', {
    x: 9.05,
    y: 2.5,
    w: 3.4,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: PURPLE,
    fontFace: 'Arial',
  });

  slide.addText(
    '• Successor Role:\n  Full access to decisions, alternatives, risks, and Day 1-5 onboarding plan.\n\n• Teammate Role:\n  Filtered to tasks and dependencies in their area.\n\n• Manager Role:\n  Executive summary of risks & ownership.\n\n• Observer Role:\n  Confidential claims stripped pre-summary.',
    {
      x: 9.05,
      y: 2.9,
      w: 3.4,
      h: 3.6,
      fontSize: 11,
      color: TEXT_MUTED,
      fontFace: 'Arial',
      lineSpacing: 18,
    }
  );

  addFooter(slide);
}

// ==========================================
// SLIDE 9: Testing & Resilience
// ==========================================
{
  const slide = pptx.addSlide();
  slide.background = { color: BG_COLOR };
  addHeader(slide, 'Testing & Edge-Case Resilience', 'Verification', '09');

  slide.addText(
    'Judges will test unexpected user behaviors. Baton has been engineered and tested to hold up without any manual intervention.',
    {
      x: 0.6,
      y: 1.6,
      w: 12.0,
      h: 0.5,
      fontSize: 13,
      color: TEXT_MUTED,
      fontFace: 'Arial',
    }
  );

  const tests = [
    {
      title: 'Page Refresh Durability',
      desc: 'Refreshing on Stage 04 (Review Gate) or Stage 05 (Handover View) retains full project state without resetting progress, claims, or signed receipts.',
      status: 'PASSED (Preserved)',
    },
    {
      title: 'Idempotency Protection',
      desc: 'Rapidly double-clicking "Load Demo" or submitting multiple approvals is protected with debouncing and idempotent record checks.',
      status: 'PASSED (0 Duplicates)',
    },
    {
      title: 'Strict RBAC Boundaries',
      desc: 'Switching roles from Successor to Observer dynamically strips confidential claims and code diffs before DOM injection.',
      status: 'PASSED (Zero Leakage)',
    },
    {
      title: 'Defensive Array Guards',
      desc: 'All collection iterators (.map, .filter) are wrapped in Array.isArray() guards to guarantee zero unhandled client exceptions.',
      status: 'PASSED (0 Crashes)',
    },
  ];

  tests.forEach((t, idx) => {
    const x = 0.6 + idx * 3.05;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x,
      y: 2.3,
      w: 2.85,
      h: 4.4,
      rectRadius: 0.15,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1 },
    });

    slide.addText('✓ ' + t.status, {
      x: x + 0.2,
      y: 2.55,
      w: 2.45,
      h: 0.35,
      fontSize: 11,
      bold: true,
      color: EMERALD,
      fontFace: 'Arial',
    });

    slide.addText(t.title, {
      x: x + 0.2,
      y: 3.0,
      w: 2.45,
      h: 0.6,
      fontSize: 13,
      bold: true,
      color: TEXT_WHITE,
      fontFace: 'Arial',
    });

    slide.addText(t.desc, {
      x: x + 0.2,
      y: 3.7,
      w: 2.45,
      h: 2.8,
      fontSize: 11,
      color: TEXT_MUTED,
      fontFace: 'Arial',
      lineSpacing: 18,
    });
  });

  addFooter(slide);
}

// ==========================================
// SLIDE 10: Product Roadmap & Conclusion
// ==========================================
{
  const slide = pptx.addSlide();
  slide.background = { color: BG_COLOR };
  addHeader(slide, 'Product Roadmap & Next Milestones', 'Roadmap', '10');

  slide.addText(
    'Where Baton goes beyond the hackathon to solve organizational knowledge loss at scale.',
    {
      x: 0.6,
      y: 1.6,
      w: 12.0,
      h: 0.5,
      fontSize: 13,
      color: TEXT_MUTED,
      fontFace: 'Arial',
    }
  );

  const road = [
    {
      phase: 'PHASE 1 • Q1 2027',
      title: 'Ecosystem & Native Bots',
      desc: '• Official GitHub Marketplace app blocking PR merges on missing handover specs.\n• Two-way Slack & Discord bots with interactive /baton ask slash commands.\n• Google Drive & Notion document API sync.',
      color: TEAL_LIGHT,
    },
    {
      phase: 'PHASE 2 • Q2 2027',
      title: 'Intelligence & Jira Sync',
      desc: '• Semantic vector search across past team handovers using pgvector.\n• Automatic Jira & Linear onboarding task creation for incoming engineers.\n• Multi-model ensemble verification.',
      color: AMBER,
    },
    {
      phase: 'PHASE 3 • Q3 2027',
      title: 'Enterprise Compliance',
      desc: '• Automated SOC2 Type II & HIPAA compliance audit exports for banking/healthtech.\n• Real-time team bus-factor risk alerts.\n• Zero-knowledge evidence verification across partner orgs.',
      color: PURPLE,
    },
  ];

  road.forEach((r, idx) => {
    const x = 0.6 + idx * 4.1;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x,
      y: 2.3,
      w: 3.9,
      h: 3.2,
      rectRadius: 0.15,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1 },
    });

    slide.addText(r.phase, {
      x: x + 0.2,
      y: 2.5,
      w: 3.5,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: r.color,
      fontFace: 'Arial',
    });

    slide.addText(r.title, {
      x: x + 0.2,
      y: 2.85,
      w: 3.5,
      h: 0.45,
      fontSize: 14,
      bold: true,
      color: TEXT_WHITE,
      fontFace: 'Arial',
    });

    slide.addText(r.desc, {
      x: x + 0.2,
      y: 3.4,
      w: 3.5,
      h: 1.9,
      fontSize: 11,
      color: TEXT_MUTED,
      fontFace: 'Arial',
      lineSpacing: 18,
    });
  });

  // Call to action bottom box
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 5.75,
    w: 12.1,
    h: 1.0,
    rectRadius: 0.12,
    fill: { color: '0A1926' },
    line: { color: TEAL, width: 1 },
  });

  slide.addText('TRY BATON LIVE RIGHT NOW: https://baton-teal.vercel.app', {
    x: 0.9,
    y: 5.9,
    w: 11.5,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: TEAL_LIGHT,
    fontFace: 'Arial',
  });

  slide.addText('Thank you to Team We Code Coders and all the judges! • Team AstraX', {
    x: 0.9,
    y: 6.3,
    w: 11.5,
    h: 0.3,
    fontSize: 11,
    color: TEXT_MUTED,
    fontFace: 'Arial',
  });

  addFooter(slide);
}

// Generate the presentation file
pptx.writeFile({ fileName: 'Baton_Round3_Presentation.pptx' })
  .then((fileName) => {
    console.log(`Successfully generated presentation: ${fileName}`);
  })
  .catch((err) => {
    console.error('Error generating presentation:', err);
    process.exit(1);
  });
