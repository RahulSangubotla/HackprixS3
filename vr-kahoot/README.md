# VR Kahoot

A multiplayer VR quiz game inspired by Kahoot, built with A-Frame, FastAPI, Socket.IO, and Networked-AFrame. Players join a virtual theater, answer questions, and see avatars of other players in real time.

## Features
- Multiplayer VR quiz experience
- Real-time avatars using Networked-AFrame and EasyRTC
- Host control panel for managing questions and rounds
- Works in desktop and VR browsers

## Project Structure
```
main.py                # FastAPI + Socket.IO game server
requirements.txt       # Python dependencies
avatar-server/         # Node.js EasyRTC signaling server for avatars
  ├── package.json
  └── server.js
static/                # Frontend static files
  ├── index.html       # Lobby (enter name, join game)
  ├── host.html        # Host control panel
  ├── theater.html     # Main VR scene
  └── assets/          # 3D/VR assets
```

## Quick Start

Just run the `run.sh` script to install dependencies and start both servers.

```bash
./run.sh
```

This will:
1. Install Python dependencies.
2. Install Node.js dependencies.
3. Start the avatar server.
4. Start the game server.

When you stop the script (with Ctrl+C), it will stop both servers.

### Manual Start

If you prefer to run the servers manually:

### 1. Install Dependencies

**Python:**
```bash
pip install -r requirements.txt
```

**Node.js:**
```bash
cd avatar-server
npm install
cd ..
```

### 2. Start Servers

**Avatar Server (Terminal 1):**
```bash
cd avatar-server
node server.js
```

**Game Server (Terminal 2):**
```bash
python main.py
```

### 3. Open in Browser
- Lobby: [http://localhost:8000/](http://localhost:8000/)
- Host Panel: [http://localhost:8000/host.html](http://localhost:8000/host.html)
- VR Theater: [http://localhost:8000/theater.html?username=YourName](http://localhost:8000/theater.html?username=YourName)

## Game Flow
1. Host starts the game from the host panel
2. Players join via the lobby and enter their names
3. Host advances questions and shows results
4. Players answer using VR controllers or mouse/keyboard
5. Scores are tracked and displayed

## Troubleshooting
- **White/Black Screen:** Ensure both servers are running (ports 8000 and 8081). Refresh after servers are up.
- **TypeError: Cannot read properties of undefined (reading 'emit'):** Usually means the game server is not connected. Check server logs and browser console.
- **No Avatars/Networking:** The game works in single-player mode if the avatar server is down.
- **VR Mode Issues:** Use a VR-compatible browser (Chrome, Firefox, Edge). Some VR features require HTTPS.

## Credits
- [A-Frame](https://aframe.io/)
- [Networked-AFrame](https://github.com/networked-aframe/networked-aframe)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Socket.IO](https://socket.io/)
- [EasyRTC](https://github.com/open-easyrtc/easyrtc)

---

MIT License
