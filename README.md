# Proof Learning Coach

Build Proof, a polished interactive AI learning coach for a UTD hackathon. User authorized implementation. Main priority: an exceptional learning simulation and presentation demo. Create app now, name Proof. Use light ivory background, deep navy typography, teal accents, sophisticated editorial typography, subtle motion, excellent responsive layout. No generic landing-page-only result. Main CTA Try the simulation immediately enters real interactive scenario.

Build flagship "The Revenue Mirage" for a FICTIONAL retailer Northstar Supply. Accurate deterministic data: previous month revenue $500. Current orders O101 $120, O102 $80, O103 $120, O104 $180 (total $500); each order has exactly two line items, whose amounts sum to its total: 50+70,30+50,40+80,100+80. Faulty join SUM(orders.total) across 8 line items returns $1000, false +100%; true revenue stays $500, 0% growth. SUM(DISTINCT orders.total) is WRONG $380 because two different orders share $120; show why. Correct options aggregate at order grain or sum line amounts. Never invent real-company incidents.

Flow: receive CFO brief about apparent revenue growth and marketing decision; predict result using 3 curated choices and confidence; interactive tables click order to highlight matching items; animate join rows to output with reduced-motion and keyboard controls; click inflated total to trace duplicate contributions; repair query choosing validated alternatives (no arbitrary SQL execution); explain correction/teach back to AI colleague; fresh transfer challenge on inventory (two warehouses quantities 30 and 20, each duplicated by 2 supplier rows; wrong total100 true50). Progress map and evidence history. Hints 3 levels, record assistance. High-confidence incorrect answer triggers misconception follow-up; low-confidence incorrect gets prerequisite scaffold. Assisted success not mastery. Persist demo in localStorage with reset and clear label browser-only until backend ready, don't imply real AI if unavailable. Correct calculations via pure functions with meaningful unit tests covering duplicate amounts and transfer. Source code modular.

Screens / home, /learn interactive simulation, /evidence learning evidence, /instructor (clearly labeled sample dashboard unless authenticated real data), /present full-screen 8-slide keyboard-controlled pitch with speaker notes toggle and 90-second demo cue. Pitch: plausible wrong business decision, learning gap, Proof experience, live demo, adaptive learning paths, architecture, validation/pilot proposal (no fabricated metrics), closing. Presentation must truthfully distinguish implemented vs roadmap. Add replayable animation, no dead buttons, empty/error/loading states.

External Supabase project has just been created for this app: ref vyaydusrhhcazxshadxv. Do NOT provision a second database or substitute Lovable Cloud. Build frontend and backend-ready service interfaces now. We will provide publishable key/url next and manage schema via Supabase MCP. Real teaching API must be server-side; don't expose secrets. Do not claim backend/auth/AI completed without actual integration and verification. If connecting external Supabase requires user dashboard action, identify exact blocker while finishing frontend. Provide test results and implementation summary.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://proof-learning-coach.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/25cd456b-a1ba-496d-9f5b-2887b65879bd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
