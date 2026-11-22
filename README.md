# IPTV Player - Modern Streaming Experience

A cutting-edge web-based IPTV player with a stunning glassmorphism design and advanced features. This application provides a premium streaming experience with modern UI/UX, comprehensive channel management, and enhanced playback controls.

## ✨ Features

### 🎥 Core Streaming
- **Advanced Video Player** - HLS streaming support with adaptive bitrate
- **Multiple Playlist Support** - Load from URL or local M3U files
- **Picture-in-Picture** - Watch while browsing other content
- **Fullscreen Mode** - Immersive viewing experience
- **Volume Control** - Precise audio management with visual feedback

### 🎨 Modern Design
- **Glassmorphism UI** - Beautiful frosted glass effects and modern aesthetics
- **Dark/Light Themes** - Seamless theme switching with persistent preferences
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Smooth Animations** - Fluid transitions and micro-interactions
- **Custom Typography** - Inter font family for enhanced readability

### 📺 Channel Management
- **Smart Search** - Real-time channel filtering and search
- **Categories** - Organize channels by groups and categories
- **Favorites System** - Star channels for easy access
- **Channel Statistics** - Track total channels and favorites count

### 🎮 Enhanced Controls
- **Keyboard Shortcuts** - Full keyboard navigation support
- **Touch Gestures** - Mobile-optimized touch interactions
- **Volume Slider** - Hover-activated volume control
- **Playback Controls** - Play, pause, seek, and quality adjustment
- **Notification System** - Real-time feedback and status updates

### 🔧 Advanced Features
- **Playlist History** - Remember and reload previous playlists
- **Error Handling** - Comprehensive error management with user-friendly messages
- **Loading States** - Beautiful loading animations and progress indicators
- **Local Storage** - Persistent settings and data storage
- **CORS Support** - Cross-origin playlist loading with fallback options

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/iptv-player.git
cd iptv-player
```

2. From the project folder, start a local web server:
```bash
python -m http.server 8000
```
3. Open `http://localhost:8000` in your browser. The app reloads the default playlist from `Channels/merged_playlist.m3u`; serving it over HTTP lets playlist edits appear after refresh.

## 🚀 Usage

### Getting Started
1. **Load Playlist** - Choose from:
   - Enter M3U URL in the input field
   - Enter a direct Xtream `.m3u8` stream URL to play it immediately
   - Upload local M3U file using the file button
   - Use the default playlist (auto-loaded)

2. **Browse Channels** - Explore channels in the sidebar with:
   - Real-time search functionality
   - Category filtering
   - Recent channels history
   - Favorites management

3. **Watch Content** - Enjoy streaming with:
   - Click any channel to start playback
   - Use keyboard shortcuts for quick control
   - Adjust volume with the hover slider
   - Enable picture-in-picture mode

### 🎮 Keyboard Shortcuts
- **Space** - Play/Pause
- **F** - Toggle fullscreen
- **P** - Picture-in-picture
- **M** - Mute/Unmute
- **↑/↓** - Volume up/down
- **←/→** - Seek backward/forward (10s)

### 📱 Mobile Features
- **Touch Gestures** - Swipe and tap interactions
- **Responsive Layout** - Optimized for all screen sizes
- **Mobile Menu** - Collapsible sidebar for small screens
- **Touch Controls** - Easy-to-use mobile controls

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Video Streaming**: HLS.js with adaptive bitrate
- **UI Framework**: Custom CSS with modern features
- **Icons**: Font Awesome 6.4.0
- **Typography**: Inter font family
- **Storage**: LocalStorage for persistence
- **Animations**: CSS3 animations and transitions

## 🌐 Browser Support

- **Chrome** 90+ (Recommended)
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+
- **Mobile Browsers** - iOS Safari, Chrome Mobile

## 🎨 Design Features

- **Glassmorphism** - Modern frosted glass aesthetic
- **Gradient Backgrounds** - Dynamic color schemes
- **Smooth Animations** - 60fps transitions and micro-interactions
- **Responsive Grid** - Adaptive layouts for all devices
- **Custom Scrollbars** - Styled scrollbars matching the theme
- **Loading States** - Beautiful loading animations and spinners

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 