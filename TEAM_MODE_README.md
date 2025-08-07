# Rock Paper Scissors Tournament - Team Mode

This application has been updated to support multi-team tournament participation! Teams can now access their own unique URLs to participate in real-time tournaments.

## Features

### 🏟️ Tournament Overview
- **Main Page** (`/`): View the complete tournament bracket and progress
- **Teams Page** (`/teams`): See all teams, their status, and access team-specific pages
- **Real-time Updates**: All pages update automatically to show current tournament status

### 👥 Team-Specific Participation
Each team gets their own dedicated page where they can:
- See their current match opponent
- Submit their move (rock, paper, or scissors)
- View match results in real-time
- Track their tournament progress

## How to Use

### For Tournament Organizers

1. **Start the Application**
   ```bash
   npm run dev
   ```

2. **Navigate to the Teams Page**: Visit `/teams` to:
   - Start a new tournament
   - View all team statuses
   - Access team-specific URLs

3. **Share Team URLs**: Give each team their unique URL:
   ```
   http://localhost:3001/team/[TeamName]
   ```

### For Teams

#### Option 1: Direct Team URL
Visit your team-specific URL:
```
http://localhost:3001/team/Owls
http://localhost:3001/team/Racoons
http://localhost:3001/team/Octopus
...etc
```

#### Option 2: URL Parameter
Visit the main page with your team name as a parameter:
```
http://localhost:3001/?team=Owls
```
This will automatically redirect you to your team page.

### Team Experience

When you visit your team page, you'll see:

1. **Waiting Screen**: If the tournament hasn't started or it's not your turn
2. **Match Interface**: When it's your turn to play:
   - Your team info and opponent details
   - Three buttons to select your move (🪨 Rock, 📄 Paper, ✂️ Scissors)
   - Real-time feedback when both teams have submitted moves
3. **Results**: See if you won, lost, or drew the round
4. **Tournament Status**: Track your progress through the bracket

## Available Teams

The following teams are available in the tournament:

| Team Name | Manager | Emoji |
|-----------|---------|-------|
| Owls | Rebecca | 🦉 |
| Racoons | Aaron | 🦝 |
| Octopus | Paul | 🐙 |
| Dolphins | Jamie | 🐬 |
| Orcas | Tim | 🐳 |
| Rakalis | Richard | 🐀 |
| Capybaras | Laura | 🐹 |
| Wombats | Carina | 🐨 |
| Bees | Victoria | 🐝 |
| Platypus | Simon | 🦫 |
| Senior Staff | Mark C and Andrew B. | 👑 |
| Associate Directors | Maddie M and Sharon S | 🧑‍💼 |
| Portfolio Managers | Alex F and Shaun McC | 📈 |
| Pandas | Leila | 🐼 |
| Team Rocket | Jessie & James | 🚀 |
| Team Go | Blanche | 🏃 |

## Technical Implementation

### Architecture Changes

The application has been updated from a single-user local storage system to a multi-user server-based system:

- **Backend API** (`/api/tournament`): Manages tournament state centrally
- **Real-time Polling**: Pages automatically update every 2-3 seconds
- **Team-Specific Routes**: Dynamic routing for each team
- **State Synchronization**: All participants see the same tournament state

### API Endpoints

- `GET /api/tournament`: Get current tournament state
- `POST /api/tournament`:
  - `{ action: 'start' }`: Start a new tournament
  - `{ action: 'reset' }`: Reset the tournament
  - `{ action: 'playMove', teamName: 'TeamName', move: 'rock|paper|scissors' }`: Submit a team's move

### Key Files

- `/app/page.tsx`: Main tournament overview page
- `/app/teams/page.tsx`: Team directory and admin interface
- `/app/team/[team]/page.tsx`: Individual team interface
- `/app/api/tournament/route.ts`: Tournament management API
- `/src/hooks/use-server-tournament.ts`: Hook for server-side tournament state

## Development

### Running the Application
```bash
npm run dev
```

The application will be available at `http://localhost:3001` (or the port specified).

### Testing Team Access

1. Start the server
2. Visit `/teams` and start a tournament
3. Test individual team URLs like `/team/Owls`
4. Try the URL parameter format `/?team=Owls`

## Deployment Notes

For production deployment:
- Replace the in-memory tournament storage with a persistent database
- Consider implementing WebSocket connections for real-time updates
- Add authentication/authorization if needed
- Update CORS settings for cross-origin requests

## Troubleshooting

### Common Issues

1. **"Team Not Found" Error**: Ensure the team name in the URL exactly matches the names in the constants file
2. **Tournament Not Starting**: Check the `/teams` page and click "Start Tournament"
3. **Moves Not Registering**: Verify both teams are accessing their correct URLs
4. **Page Not Updating**: The system polls every 2-3 seconds; allow time for updates

### Team Name Format

Team names in URLs should be URL-encoded. For teams with spaces or special characters:
- "Senior Staff" becomes `/team/Senior%20Staff`
- The application handles encoding automatically when using the provided links
