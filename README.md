# Image Valuation — Quick start & handoff

Short, copy-paste steps to get a new developer running and able to export data.

What this is
- A web experiment that shows food images (Phase 1) and asks memory/payment/confidence questions (Phase 2).
- Backend: `server.js` (Express + MongoDB). Frontend: `public/index.html` → `public/js/main.js` → `public/js/experiment/*`.

Quick start (local)
1. Install deps
```bash
npm install
```
2. Create `.env` (at repo root)
```env
MONGODB_URI="mongodb+srv://<user>:<pass>@cluster.example.mongodb.net/image_valuation"
PORT=3000
```
3. Start server
```bash
npm start
# or for dev with reload
npm run start:dev
```
Open http://localhost:3000

Developer helper scripts
- `npm run test-api` — posts a small JSON to `/api/save` (smoke test).
- `npm run debug-test` — local CSV/parse debug utility.
- `npm run crop-images` — crop images in `public/images/new-images` → `new-images-final-cropped` (uses `sharp`).

Quick test examples
- POST a phase1 JSON (saves to DB):
```bash
curl -X POST http://localhost:3000/api/save \
   -H 'Content-Type: application/json' \
   -d '{"collection":"phase1","format":"json","data":[{"participant_id":"test1","phase":1,"image_id":1,"filename":"img.jpg","image_size":"large","response_time":1.2}] }'
```
- Download exported CSV (direct or with password):
```bash
curl "http://localhost:3000/download/phase1?password=admin123" -o phase1.csv
```
(Note: `admin123` appears in code as a default fallback — rotate/remove in production.)

Where to look (fast)
- Change DB/CSV names or headers: `public/config.json` (`serverConfig` section).
- Client-side trial logic, timing, and stimuli: `public/js/experiment/` (main files: `Experiment.js`, `TrialManager.js`, `DataCollector.js`, `Pages.js`).
- Image lists: `public/js/shared-image-lists.js` and `public/images/...`.
- Save/export logic: `server.js` (`/api/save`, `/download/*`, `serveCsvResults`).

Data & exports
- Collections: `phase1`, `phase2`, `final_questionnaire`, `attention_checks` (see `public/config.json`).
- CSV filenames: `${filename_prefix}_<collection>_YYYY-MM-DD.csv`.
- CSV headers and field filtering are defined in `public/config.json` and enforced in `server.js`.

Deploy notes
- Start: `node server.js` (configured in `render.yaml`).
- Add `MONGODB_URI` to Render/Vercel project secrets. Use the provider UI to view logs and redeploy.

Suggested small additions
- Add `.env.example` and `DEPLOYMENT.md` with project links and exact env var names.

Owner / contact
- Owner: Christopher Dunlock

Want me to: (pick one)
- Fill the GitHub URL & latest commit SHA into this README.
- Add `.env.example` and `DEPLOYMENT.md` now.