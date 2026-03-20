# 🪨📄✂️ RPS Pod Showdown

Welcome to the **RPS Pod Showdown**, the ultimate tactical Rock Paper Scissors tournament platform built for internal pod battles and competitive fun!

## 🏟️ Overview

The RPS Pod Showdown is a real-time tournament engine designed to handle multi-team participation. It features a nostalgic retro-gaming aesthetic, automated bracket management, and dedicated interfaces for every participating "pod."

## ✨ Key Features

### 🏆 Dynamic Tournament Bracket
- **Perfect 16-Team Seeding**: Automatically shuffles 14 human teams and 2 AI bots into a balanced single-elimination bracket.
- **Live Visuals**: A real-time bracket that updates as matches progress.
- **Match Results**: Instant notifications for winners, losers, and draw rematches.

### 🤖 Integrated AI Bots
- **The Competitors**: Features "Cox Travis" (The AI) and "Terminator" (Skynet).
- **Human Advantage**: Coded logic ensures human teams **always win** against AI bots on the first try to keep the focus on human competition.

### 👥 Team-Specific Participation
- **Unique URLs**: Each team has a dedicated page (e.g., `/team/Orcas`) to play their moves.
- **Interactive Interface**: Big, bold icons for selecting Rock, Paper, or Scissors.
- **Ready System**: The tournament only begins once pods have checked in as "Ready."
- **Auto-Play Timer**: A 60-second countdown to keep the tournament moving—if a team doesn't pick, a move is picked for them.

### 🎙️ Atmospheric Experience
- **Live Commentary**: A humorous "LEI Commentary" box that provides pod-specific jokes and general RPS trivia.
- **Retro Vibes**: Uses "Press Start 2P" fonts and a nostalgic "Loading..." sequence with progress bars.
- **Battle Music**: Integrated background music to set the stakes.

## 🚀 How to Run the Tournament

### 1. Initialization
- Navigate to the **Teams Page** (`/teams`).
- Click **"Start Tournament"** to generate the initial bracket.

### 2. Team Access
- Share the individual team links found on the Teams page with each Pod Manager.
- Managers must click **"Ready to Battle!"** to enter the seeding phase.

### 3. Match Play
- The system automatically cycles through playable matches.
- When it is a pod's turn, their page will transform into the **Battle Arena**.
- Both teams submit their moves; the first team to win the throw advances.

### 4. Tournament Report
- Once a champion is crowned, use the **"Export"** button to generate and download a PDF report of all match results.

## 🛠️ Technical Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: React Hooks with Server-Side Polling
- **PDF Generation**: [jsPDF](https://parall.ax/products/jspdf) & [html2canvas](https://html2canvas.hertzen.com/)

## 📜 Fairness & Integrity
- **Unbiased Shuffling**: Bracket seeding is randomized using `Math.random()` on every start.
- **Standard RPS Rules**: Human-vs-Human matchups are determined strictly by classic rules with no preference for any team.
- **Open Source**: The logic is transparent and available for review in the `src/app/api/tournament/route.ts` file.

---
Built with ❤️ for the LEI Community. Enjoy the battle!
