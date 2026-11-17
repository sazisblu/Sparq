# Project Specification: 2-Player Accountability & "Anti-Zombie" PWA

## 1. Project Overview & Philosophy
* **Core Mission:** Break free from the "technological zombie" lifestyle (doomscrolling, passive consumption, lack of deliberate action) by replacing mindless habits with intentional, mindful, and high-effort actions.
* **Target Audience:** Strictly a **2-player closed ecosystem** (User A & User B). No public feeds, no bloat—just pure, high-stakes peer accountability.
* **Design Philosophy ("Zero-Friction"):** Logging an action (good or bad) must take **under 3 seconds** (1 to 2 taps). No mandatory journaling or complex forms.
* **Tone & Vibe:** High-contrast, tactile, arcade-meets-minimalist aesthetic (e.g., Dark Mode default, crisp typography, haptic-like visual feedback, and competitive 1v1 energy).

---

## 2. Tech Stack & Architecture
* **Frontend Framework:** Next.js (App Router) or React (Vite) + TypeScript.
* **Styling & UI:** Tailwind CSS + Framer Motion (for tactile button presses, tug-of-war animations, and micro-interactions) + Lucide Icons.
* **Backend & Database:** Supabase (PostgreSQL, Supabase Auth, Supabase Storage for screenshot proofs, and Supabase Realtime for instant live updates when the friend logs something).
* **PWA (Progressive Web App):** `next-pwa` or `vite-plugin-pwa` with a strict `manifest.json`, custom app icons, and Service Worker so both users can "Add to Home Screen" on iOS/Android for a native app feel.

---

## 3. Core Features & Mechanics

### A. Frictionless "Tap-to-Log" Grid (The Core Loop)
Instead of text inputs, the home screen features a responsive grid of large, tactile action tiles categorized into **Deliberate Acts (+XP)** and **Zombie Slip-ups (-XP)**.
* **1-Tap Logging:** Tapping a tile immediately logs the event with a default point value, triggers a satisfying animation/sound, and updates the live feed.
* **Optional Proof & Context (Post-Tap Toast):** Immediately after tapping a tile, a non-intrusive bottom drawer/toast appears for 4 seconds with two optional buttons: `[ 📸 Attach Screenshot ]` (e.g., Strava map, Screen Time graph, book page) and `[ ✏️ Add Quick Note ]`. If ignored, the log stands as-is.
* **Custom Tile Creator (`+` Button):** A persistent "+" tile allowing either user to quickly create a new reusable button (choosing an Emoji/Icon, Title, Point Value, and Type: Positive/Negative) so the system evolves with their habits.

### B. Suggested Pre-Loaded Action Tiles
**The "Deliberate & Mindful" Tiles (Positive XP):**
* 🏃 **Sweat / Strava Run** (+30 XP) — *Physical exertion.*
* 📖 **Deep Reading (15+ mins)** (+20 XP) — *Analog or focused reading.*
* 🧠 **Skill / Deep Learning** (+25 XP) — *Coding, language, instrument, studying.*
* 🧹 **Environment Reset (Chores)** (+15 XP) — *Cleaning room, dishes, laundry.*
* 📵 **Screen Time Win** (+25 XP) — *Under daily phone limit / phone-free morning.*
* 🧘 **Stillness / Meditation** (+15 XP) — *Sitting with thoughts, zero stimulation.*
* ❄️ **Hard Thing / Cold Shower** (+20 XP) — *Doing something uncomfortable.*

**The "Zombie Slip-Up" Tiles (Negative XP / Damage):**
* 🧟 **Doomscroll Trap (30m+)** (-20 XP) — *Mindless short-form video/feed scrolling.*
* 🛌 **Bed-Rotting / Oversleeping** (-15 XP) — *Wasting morning momentum.*
* 🍔 **Junk / Mindless Eating** (-10 XP) — *Eating out of boredom.*
* ⏰ **Procrastinated Priority** (-20 XP) — *Avoided the main task of the day.*

### C. 1v1 Gamification & Dueling Mechanics
To evoke friendly rivalry, urgency, and emotional investment:
1. **The Weekly Tug-of-War Bar (Hero UI Element):**
   * At the top of the screen is a live, dynamic **Tug-of-War meter** showing Player A vs. Player B's net XP for the current week.
   * When Player A logs a "+30 XP Run," the bar physically pushes into Player B's territory.
2. **Real-Time "Vibe Check" & Taunts (Nudges):**
   * If a player hasn't logged anything in 12+ hours, the opponent gets a **"Ping / Wake Up"** button that sends a push notification / prominent banner: *"Are you becoming a zombie? Log something."*
   * **Verify / Dispute Reactions:** On the shared activity feed, players can react to each other's logs with quick badges: `🔥 Respect`, `🧢 Cap? (Request Proof)`, or `💀 RIP` (on negative logs).
3. **Combo Multipliers & Streaks:**
   * **Daily Ignition:** Logging at least 3 positive actions and 0 negative actions in a day grants a "Clean Day" shield and a `1.2x` multiplier for the next day.
4. **Weekly Stakes / Bounty System:**
   * A pinned card at the top where the two players set the **Weekly Stake** (e.g., *"Loser buys coffee," "Loser does 100 pushups on video," "Winner picks Saturday's hangout"*). Resets every Sunday at midnight with a "Weekly Winner" Hall of Fame archive.

---

## 4. Supabase Database Schema

The AI agent should execute the following SQL setup in Supabase:

```sql
-- 1. Profiles (Strictly 2 users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  color_hex TEXT DEFAULT '#10B981', -- Distinct color per player for the Tug-of-War bar
  current_streak INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Reusable Action Tiles (Buttons)
CREATE TABLE action_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  emoji TEXT NOT NULL,
  points INT NOT NULL, -- Positive for good habits, negative for zombie habits
  category TEXT CHECK (category IN ('mindful', 'physical', 'productivity', 'zombie')),
  is_archived BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Activity Logs (The Shared Repo)
CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES action_templates(id),
  custom_title TEXT NOT NULL,
  emoji TEXT NOT NULL,
  points INT NOT NULL,
  note TEXT,
  proof_image_url TEXT, -- Stored in Supabase Storage bucket 'proofs'
  opponent_reaction TEXT, -- e.g., '🔥', '🧢', '💀'
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Weekly Arena / Stakes
CREATE TABLE weekly_battles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL,
  stake_description TEXT NOT NULL,
  winner_id UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- Enable Realtime on activity_logs and weekly_battles
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE weekly_battles;
```

### Storage & Security (RLS)
* Create a public/authenticated Storage bucket named `proofs` for activity screenshots.
* **Row Level Security (RLS):** Enable RLS on all tables. Policy: Allow `SELECT`, `INSERT`, `UPDATE` for all authenticated users (since the app is restricted to just the 2 whitelisted user IDs via Supabase Auth).

---

## 5. UI/UX Screen Architecture (Mobile-First PWA)

1. **Screen 1: The Arena (Home / Main Tab)**
   * **Top Header:** Weekly Stake Banner + Live 1v1 Tug-of-War Score Bar (e.g., *You: 340 XP* vs *Friend: 310 XP*).
   * **Middle Section (The Grid):** 2-column or 3-column grid of chunky, tactile action buttons. Color-coded subtly (Emerald/Cyan borders for positive, Crimson/Amber borders for negative).
   * **Bottom Section:** "Quick Custom Log" button for one-off actions not on the grid.
2. **Screen 2: The Shared Feed (Live Log Repo)**
   * Chronological timeline of both players' actions.
   * Displays timestamp, user avatar, action badge, XP delta (`+25 XP`), optional note, and inline expandable screenshot proof (Strava/Screen time).
   * Interactive 1-tap reaction buttons (`🔥`, `🧢`, `💀`) for the opponent to acknowledge or call out the log.
3. **Screen 3: Stats & Zombie Autopsy (Analytics)**
   * Side-by-side comparison: *Clean Days*, *Most Frequent Good Habit*, *Biggest Zombie Weakness*, and a GitHub-style contribution heatmap comparing both players' consistency.

---

## 6. PWA Requirements (Critical for Mobile)
To ensure this feels like a native iOS/Android app without using a browser bar:
1. **`manifest.json`:**
   * `"display": "standalone"`
   * `"orientation": "portrait"`
   * `"background_color": "#09090B"`
   * `"theme_color": "#09090B"`
   * Include `192x192` and `512x512` maskable icons.
2. **Apple Meta Tags (in `<head>`):**
   * `<meta name="apple-mobile-web-app-capable" content="yes">`
   * `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
3. **Image Compression:** Client-side compress uploaded screenshots (e.g., via `browser-image-compression`) before uploading to Supabase Storage so photo uploads happen in <1 second on cellular data.

---

## 7. Step-by-Step Build Plan for the AI Agent
1. **Initialize Project:** Scaffold Next.js (TypeScript + Tailwind) and configure PWA manifest + Service Worker.
2. **Supabase Setup:** Connect `@supabase/supabase-js`, set up Auth (Magic Link or Email/Password for the 2 users), and run the SQL schema + Storage bucket setup.
3. **Build Core Components:**
   * `TugOfWarHeader.tsx`: Real-time score calculation for the current week + stake display.
   * `ActionGrid.tsx`: Tactile button grid with optimistic UI updates + post-tap bottom drawer for optional screenshot upload & note.
   * `SharedFeed.tsx`: Real-time subscribed list of logs with image lightbox and opponent reaction toggles.
   * `CreateTileModal.tsx`: Form to add new custom buttons to `action_templates`.
4. **Polish & Micro-interactions:** Add Framer Motion spring physics on button taps, sound effects (optional toggle), and empty states.