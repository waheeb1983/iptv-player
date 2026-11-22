class IPTVApp {
    constructor() {
        this.parser = new M3UParser();
        this.player = new VideoPlayer();
        localStorage.removeItem('recentChannels');
        this.currentCategory = 'All';
        this.setupEventListeners();
        this.setupTheme();
        this.loadDefaultChannels();
        this.setupSidebar();
        this.setupSwipeHandlers();
        this.updateStats();
        this.displayCategories();
    }

    setupSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            sidebar.classList.remove('active');
        } else {
            sidebar.classList.add('active');
        }
        
        // Always make the channels section visible
        document.getElementById('channelsSection').classList.add('active');
    }

    setupEventListeners() {
        const sidebar = document.querySelector('.sidebar');
        const menuToggle = document.getElementById('menuToggle');
        const mainContent = document.querySelector('.main-content');
        const isMobile = window.innerWidth <= 768;

        // Menu toggle
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event from bubbling up
            if (isMobile) {
                sidebar.classList.toggle('active');
            }
        });

        // Click outside to close sidebar in mobile mode
        document.addEventListener('click', (e) => {
            if (isMobile && sidebar.classList.contains('active')) {
                // Check if click is outside sidebar and menu toggle
                if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.setupSidebar();
        });

        // Channel search
        document.getElementById('channelSearch').addEventListener('input', (e) => {
            this.filterChannels(e.target.value);
        });

        // M3U URL loader
        document.getElementById('loadUrl').addEventListener('click', () => {
            const url = document.getElementById('m3uUrl').value.trim();
            if (url.startsWith('file://')) {
                alert('Please use the "Load File" button for local files');
                return;
            }

            if (this.isDirectHlsStreamUrl(url)) {
                this.player.playChannel(url);
                document.getElementById('currentChannelName').textContent = 'Direct Stream';
                document.getElementById('currentChannelGroup').textContent = 'Xtream HLS';
                this.showNotification('Playing direct stream', 'success');
                return;
            }

            this.loadM3UFromUrl(url);
        });

        // M3U file loader
        document.getElementById('loadFile').addEventListener('click', () => {
            document.getElementById('m3uFile').click();
        });

        document.getElementById('m3uFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadM3UFromFile(file);
            }
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Reset channels button
        document.getElementById('resetChannels').addEventListener('click', () => {
            this.resetChannels();
        });

        // Volume control
        document.getElementById('volumeBtn').addEventListener('click', () => {
            this.toggleMute();
        });

        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            this.setVolume(e.target.value);
        });

        // Picture in Picture
        document.getElementById('pipBtn').addEventListener('click', () => {
            this.togglePictureInPicture();
        });

        // Fullscreen
        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            this.toggleFullscreen();
        });
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    isDirectHlsStreamUrl(url) {
        try {
            const parsedUrl = new URL(url);
            return (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') &&
                parsedUrl.pathname.toLowerCase().endsWith('.m3u8');
        } catch {
            return false;
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('#themeToggle i');
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    async loadM3UFromUrl(url) {
        try {
            // Check if URL is valid
            if (!url) {
                throw new Error('Please enter a valid URL');
            }

            // Convert GitHub URL to raw content URL if needed
            if (url.includes('github.com')) {
                url = url.replace('github.com', 'raw.githubusercontent.com')
                        .replace('/blob/', '/');
            }

            let response;
            try {
                // Try direct fetch first
                response = await fetch(url);
            } catch (directError) {
                console.log('Direct fetch failed, trying CORS proxy...');
                // If direct fetch fails, try with CORS proxy
                const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
                response = await fetch(proxyUrl);
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const content = await response.text();
            
            // Validate M3U content
            if (!content.includes('#EXTM3U')) {
                throw new Error('Invalid M3U playlist format');
            }

            this.processM3UContent(content);
        } catch (error) {
            console.error('Error loading M3U from URL:', error);
            
            let errorMessage = `Failed to load M3U playlist: ${error.message}\n\n`;
            
            if (error.message.includes('403')) {
                errorMessage += 'The server is blocking access to this playlist. Try:\n';
                errorMessage += '1. Using the "Load File" button to load a local M3U file\n';
                errorMessage += '2. Using a different playlist URL\n';
                errorMessage += '3. Checking if the URL requires authentication';
            } else if (error.message.includes('CORS')) {
                errorMessage += 'The server is blocking cross-origin requests. Try:\n';
                errorMessage += '1. Using the "Load File" button to load a local M3U file\n';
                errorMessage += '2. Using a different playlist URL';
            }
            
            alert(errorMessage);
        }
    }

    loadM3UFromFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.processM3UContent(e.target.result);
            } catch (error) {
                console.error('Error processing M3U file:', error);
                alert('Failed to process M3U file. Please make sure it\'s a valid M3U playlist.');
            }
        };
        reader.onerror = () => {
            alert('Error reading file. Please try again.');
        };
        reader.readAsText(file);
    }

    processM3UContent(content) {
        const channels = this.parser.parseM3U(content);
        this.displayChannels(channels);
    }

    loadSavedChannels() {
        const channels = this.parser.loadSavedChannels();
        if (channels.length > 0) {
            this.displayChannels(channels);
        }
    }

    displayChannels(channels) {
        const channelsList = document.getElementById('channelsList');
        channelsList.innerHTML = '';
        this.displayChannelList(channels, channelsList);
        this.displayFavorites(); // Always update favorites when channels are updated
    }

    displayFavorites() {
        const favoritesList = document.getElementById('favoritesList');
        favoritesList.innerHTML = '';
        const favorites = this.parser.getFavorites();
        
        if (favorites.length === 0) {
            // Show a message when there are no favorites
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-favorites-message';
            emptyMessage.innerHTML = '<p>No favorite channels yet. Add favorites by clicking the star icon on any channel.</p>';
            favoritesList.appendChild(emptyMessage);
        } else {
            this.displayChannelList(favorites, favoritesList);
        }
    }

    displayChannelList(channels, container) {
        container.innerHTML = '';
        channels.forEach(channel => {
            const channelElement = document.createElement('div');
            channelElement.className = `channel-item ${channel.isFavorite ? 'favorite' : ''}`;
            
            // Store the URL in a non-visible property instead of a data attribute
            // Create a unique ID for each channel
            const channelId = 'channel_' + btoa(channel.url).replace(/=/g, '');
            channelElement.id = channelId;
            
            // Store the channel URL in a JavaScript object rather than the DOM
            if (!window.channelUrls) window.channelUrls = {};
            window.channelUrls[channelId] = channel.url;
            
            const channelInfo = document.createElement('div');
            channelInfo.className = 'channel-info';
            
            if (channel.info.logo) {
                const logo = document.createElement('img');
                logo.src = channel.info.logo;
                logo.alt = channel.info.title;
                logo.className = 'channel-logo';
                logo.onerror = () => {
                    logo.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2NjYyIgZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgMThjLTQuNDEgMC04LTMuNTktOC04czMuNTktOCA4LTggOCAzLjU5IDggOC0zLjU5IDgtOCA4em0tNS01aDEwdjJIN3YtMnoiLz48L3N2Zz4=';
                };
                channelInfo.appendChild(logo);
            }
            
            const titleGroup = document.createElement('div');
            titleGroup.className = 'title-group';
            
            const title = document.createElement('span');
            title.className = 'channel-title';
            title.textContent = channel.info.title;
            
            const group = document.createElement('span');
            group.className = 'channel-group';
            group.textContent = channel.info.group ? ` (${channel.info.group})` : '';
            
            titleGroup.appendChild(title);
            titleGroup.appendChild(group);
            channelInfo.appendChild(titleGroup);
            
            const favoriteBtn = document.createElement('button');
            favoriteBtn.className = `favorite-btn ${channel.isFavorite ? 'active' : ''}`;
            favoriteBtn.innerHTML = '<i class="fas fa-star"></i>';
            favoriteBtn.title = channel.isFavorite ? 'Remove from favorites' : 'Add to favorites';
            favoriteBtn.setAttribute('aria-label', channel.isFavorite ? 'Remove from favorites' : 'Add to favorites');
            favoriteBtn.onclick = (e) => {
                e.stopPropagation();
                this.toggleFavorite(channel.url);
            };
            
            channelElement.appendChild(channelInfo);
            channelElement.appendChild(favoriteBtn);
            
            channelElement.onclick = () => {
                this.player.playChannel(window.channelUrls[channelId]);
                this.updateCurrentChannelInfo(channel);
            };
            
            container.appendChild(channelElement);
        });
        
        this.updateStats();
    }

    filterChannels(searchTerm) {
        const channels = this.parser.filterChannels(searchTerm);
        const container = document.getElementById('channelsList');
        container.innerHTML = '';
        this.displayChannelList(channels, container);
    }

    toggleFavorite(channelUrl) {
        this.parser.toggleFavorite(channelUrl);
        this.displayChannels(this.parser.channels);
        this.displayFavorites();
        this.updateStats();
    }

    async loadDefaultChannels() {
        try {
            const response = await fetch('Channels/merged_playlist.m3u', { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const content = await response.text();
            if (!content.includes('#EXTM3U')) {
                throw new Error('Invalid M3U playlist format');
            }

            this.processM3UContent(content);
            this.displayCategories();
        } catch (error) {
            console.error('Could not reload the default playlist:', error);
            const savedChannels = this.parser.loadSavedChannels();
            if (savedChannels.length > 0) {
                this.displayChannels(savedChannels);
                this.displayCategories();
            } else {
                const content = `#EXTM3U
#EXTINF:-1 tvg-id="AlGhadPlus2222.eg",Al Ghad Plus
http://annkel.com/live/8743987625/8871252355/32298.m3u8`;
                this.processM3UContent(content);
                this.displayCategories();
            }
            this.showNotification(
                'Could not reload the playlist file. Use a local web server or Load File to include your latest edits.',
                'warning',
                7000
            );
        }
    }

    setupSwipeHandlers() {
        const channelsList = document.getElementById('channelsList');
        let touchStartX = 0;
        let touchEndX = 0;
        let isSwiping = false;

        channelsList.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            isSwiping = true;
        }, false);

        channelsList.addEventListener('touchend', (e) => {
            if (!isSwiping) return;
            
            touchEndX = e.changedTouches[0].screenX;
            const channelItem = e.target.closest('.channel-item');
            
            if (channelItem) {
                // No need to reset transform since we're not setting it anymore
                // No sliding animation is applied
            }
            
            isSwiping = false;
        }, false);
    }

    updateStats() {
        const totalChannels = this.parser.channels.length;
        const favoritesCount = this.parser.getFavorites().length;
        
        document.getElementById('totalChannels').textContent = `${totalChannels} Channels`;
        document.getElementById('favoritesCount').textContent = `${favoritesCount} Favorites`;
    }

    async resetChannels() {
        // Show loading indicator
        const channelsList = document.getElementById('channelsList');
        channelsList.innerHTML = '<div class="loading-message">Resetting channels...</div>';

        try {
            // Clear any saved channels
            localStorage.removeItem('savedChannels');
            localStorage.removeItem('favorites');

            // Reload default channels
            await this.loadDefaultChannels();

            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.innerHTML = `
                <p>Channels have been reset successfully!</p>
                <p>Default playlist has been reloaded.</p>
            `;
            channelsList.appendChild(successMessage);

            // Remove success message after 3 seconds
            setTimeout(() => {
                successMessage.remove();
            }, 3000);

        } catch (error) {
            console.error('Error resetting channels:', error);
            
            // Show error message
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.innerHTML = `
                <p>Failed to reset channels. Please try again.</p>
                <p>Error details: ${error.message}</p>
            `;
            channelsList.appendChild(errorMessage);
        }
    }

    // Add this method to handle getting channel URL by ID
    getChannelUrlById(channelId) {
        return window.channelUrls ? window.channelUrls[channelId] : null;
    }

    // Volume control methods
    toggleMute() {
        const video = document.getElementById('videoPlayer');
        const volumeBtn = document.getElementById('volumeBtn');
        const volumeSlider = document.getElementById('volumeSlider');
        
        if (video.muted) {
            video.muted = false;
            volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            volumeSlider.value = video.volume * 100;
        } else {
            video.muted = true;
            volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        }
    }

    setVolume(value) {
        const video = document.getElementById('videoPlayer');
        const volumeBtn = document.getElementById('volumeBtn');
        
        video.volume = value / 100;
        video.muted = false;
        
        if (value == 0) {
            volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else if (value < 50) {
            volumeBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
        } else {
            volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    }

    // Picture in Picture
    async togglePictureInPicture() {
        const video = document.getElementById('videoPlayer');
        const pipBtn = document.getElementById('pipBtn');
        
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                pipBtn.innerHTML = '<i class="fas fa-expand-arrows-alt"></i>';
            } else {
                await video.requestPictureInPicture();
                pipBtn.innerHTML = '<i class="fas fa-compress-arrows-alt"></i>';
            }
        } catch (error) {
            console.error('Picture-in-Picture error:', error);
        }
    }

    // Fullscreen
    toggleFullscreen() {
        const video = document.getElementById('videoPlayer');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        
        if (!document.fullscreenElement) {
            video.requestFullscreen().then(() => {
                fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
            }).catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen().then(() => {
                fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
            });
        }
    }

    // Categories functionality
    displayCategories() {
        const categoriesList = document.getElementById('categoriesList');
        const categories = this.getCategories();
        
        categoriesList.innerHTML = '';
        
        // Add "All" category
        const allCategory = document.createElement('div');
        allCategory.className = `category-item ${this.currentCategory === 'All' ? 'active' : ''}`;
        allCategory.textContent = 'All';
        allCategory.onclick = () => this.filterByCategory('All');
        categoriesList.appendChild(allCategory);
        
        // Add other categories
        categories.forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.className = `category-item ${this.currentCategory === category ? 'active' : ''}`;
            categoryElement.textContent = category;
            categoryElement.onclick = () => this.filterByCategory(category);
            categoriesList.appendChild(categoryElement);
        });
    }

    getCategories() {
        const categories = new Set();
        this.parser.channels.forEach(channel => {
            if (channel.info.group) {
                categories.add(channel.info.group);
            }
        });
        return Array.from(categories).sort();
    }

    filterByCategory(category) {
        this.currentCategory = category;
        this.displayCategories();
        
        if (category === 'All') {
            this.displayChannels(this.parser.channels);
        } else {
            const filteredChannels = this.parser.channels.filter(channel => 
                channel.info.group === category
            );
            this.displayChannels(filteredChannels);
        }
    }

    // Update current channel info
    updateCurrentChannelInfo(channel) {
        document.getElementById('currentChannelName').textContent = channel.info.title;
        document.getElementById('currentChannelGroup').textContent = channel.info.group || 'No category';
        this.showNotification(`Now playing: ${channel.info.title}`, 'success');
    }

    // Notification system
    showNotification(message, type = 'info', duration = 3000) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-radius: var(--border-radius);
            padding: 1rem 1.5rem;
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            animation: slideInUp 0.3s ease-out;
            max-width: 300px;
        `;

        // Add color based on type
        const colors = {
            success: 'var(--success-color)',
            error: 'var(--error-color)',
            warning: 'var(--warning-color)',
            info: 'var(--primary-color)'
        };
        
        notification.style.borderLeftColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideInUp 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    }
}

// Initialize the application
const app = new IPTVApp(); 