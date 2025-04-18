class M3UParser {
    constructor() {
        this.channels = [];
        this.favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        this.savedPlaylists = JSON.parse(localStorage.getItem('savedPlaylists') || '[]');
    }

    parseM3U(content) {
        this.channels = [];
        const lines = content.split('\n');
        let currentChannel = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('#EXTINF:')) {
                currentChannel = {
                    info: this.parseExtInf(line),
                    url: lines[i + 1]?.trim() || '',
                    isFavorite: this.favorites.includes(lines[i + 1]?.trim() || '')
                };
                this.channels.push(currentChannel);
            }
        }

        // Save the parsed channels
        this.saveChannels();
        return this.channels;
    }

    parseExtInf(line) {
        const info = {
            duration: -1,
            title: '',
            group: '',
            logo: '',
            tvgId: ''
        };

        // Extract duration and title
        const titleMatch = line.match(/#EXTINF:(-?\d+),(.*)/);
        if (titleMatch) {
            info.duration = parseInt(titleMatch[1]);
            info.title = titleMatch[2].trim();
        }

        // Extract tvg-id
        const tvgIdMatch = line.match(/tvg-id="([^"]+)"/);
        if (tvgIdMatch) {
            info.tvgId = tvgIdMatch[1];
        }

        // Extract group and logo
        const groupMatch = line.match(/group-title="([^"]+)"/);
        if (groupMatch) {
            info.group = groupMatch[1];
        }

        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
        if (logoMatch) {
            info.logo = logoMatch[1];
        }

        // If title is empty, use tvg-id or URL as fallback
        if (!info.title) {
            info.title = info.tvgId || 'Unknown Channel';
        }

        return info;
    }

    saveChannels() {
        // Save current channels to localStorage
        localStorage.setItem('lastLoadedChannels', JSON.stringify(this.channels));
    }

    loadSavedChannels() {
        const savedChannels = JSON.parse(localStorage.getItem('lastLoadedChannels') || '[]');
        this.channels = savedChannels;
        return this.channels;
    }

    toggleFavorite(channelUrl) {
        const index = this.favorites.indexOf(channelUrl);
        if (index === -1) {
            this.favorites.push(channelUrl);
        } else {
            this.favorites.splice(index, 1);
        }
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        
        // Update channel favorite status
        const channel = this.channels.find(c => c.url === channelUrl);
        if (channel) {
            channel.isFavorite = !channel.isFavorite;
        }
    }

    getFavorites() {
        return this.channels.filter(channel => channel.isFavorite);
    }

    filterChannels(searchTerm) {
        if (!searchTerm) return this.channels;
        const term = searchTerm.toLowerCase();
        return this.channels.filter(channel => 
            channel.info.title.toLowerCase().includes(term) ||
            channel.info.group.toLowerCase().includes(term) ||
            channel.info.tvgId.toLowerCase().includes(term)
        );
    }
} 