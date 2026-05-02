# Rummy Session Manager 🎴

> [!NOTE]
> This is a **vibe coding** project created as an experiment to try out [Antigravity](https://antigravity.google). It is purely a demonstration of AI-assisted development and is not intended for actual production use.

A robust, private, and AI-powered session management tool for Rummy enthusiasts. Track scores, visualize performance, and use AI vision to calculate penalty points from your camera.

## ✨ Features

- **Private Sessions**: Join or resume games using unique 8-character alphanumeric codes. No public session lists.
- **AI Vision Scoring**: Snap a photo of your hand at the end of a match, and the integrated AI will calculate your penalty points automatically.
- **Live Scoreboard**: Real-time tracking of player totals with a leader indicator (👑).
- **Session Insights**: Live visualizations including cumulative score progression charts and key statistics (Avg Penalty, Highest Penalty).
- **Bulk History Entry**: Log several matches at once when starting a new session to catch up quickly.
- **Editable History**: Mistake in a previous round? Edit any historical score directly in the sidebar; totals and charts recalculate instantly.
- **Self-Hosted Ready**: Optimized for deployment via Docker or NixOS.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- [Google Gemini API Key](https://aistudio.google.com/app/apikey) (for AI vision scoring)

### Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:rajeevmen0n/rummy.git
   cd rummy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   Create a `.env.local` file:
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to start your first session.

## 🐳 Deployment

### Docker

The project includes a `Dockerfile` for standalone production builds.
```bash
docker build -t rummy .
docker run -p 3000:3000 -e GEMINI_API_KEY=your_key -v rummy_data:/opt/rummy rummy
```

### NixOS

If you use NixOS, check the `nixos/` directory in the [Nix configuration repository](https://github.com/rajeevmen0n/nix) for a complete module that automates the build, containerization, and Nginx reverse proxy setup.

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: SQLite (via `sqlite3` and `sqlite` wrapper)
- **AI**: Google Gemini Flash (Vision API)
- **Charts**: Recharts
- **Styling**: Vanilla CSS (Modern aesthetic with Glassmorphism)

---
Built with ❤️ for Rummy players.
