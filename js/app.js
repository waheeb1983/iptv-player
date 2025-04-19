class IPTVApp {
    constructor() {
        this.parser = new M3UParser();
        this.player = new VideoPlayer();
        this.setupEventListeners();
        this.setupTheme();
        this.loadDefaultChannels();
        this.setupSidebar();
        this.setupSwipeHandlers();
        this.updateStats();
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
            const url = document.getElementById('m3uUrl').value;
            if (url.startsWith('file://')) {
                alert('Please use the "Load File" button for local files');
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

        // Add new event listeners
        document.getElementById('videoPlayer').addEventListener('play', () => {
            this.updateCurrentChannel();
        });

        document.getElementById('videoPlayer').addEventListener('error', () => {
            this.updateCurrentChannel('Error playing channel');
        });

        // Reset channels button
        document.getElementById('resetChannels').addEventListener('click', () => {
            this.resetChannels();
        });
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
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
            channelElement.dataset.url = channel.url;
            
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
                this.player.playChannel(channel.url);
                this.updateCurrentChannel(channel.info.title);
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
        // Show loading indicator
        const channelsList = document.getElementById('channelsList');
        channelsList.innerHTML = '<div class="loading-message">Loading channels...</div>';

        const possiblePaths = [
            'https://raw.githubusercontent.com/waheeb1983/iptv-player/master/Channels/merged_playlist.m3u',
            'Channels/merged_playlist.m3u',
            './Channels/merged_playlist.m3u',
            '/Channels/merged_playlist.m3u',
            'channels/merged_playlist.m3u',
            './channels/merged_playlist.m3u',
            '/channels/merged_playlist.m3u',
            'merged_playlist.m3u'
        ];

        let lastError = null;
        let lastResponse = null;
        
        for (const path of possiblePaths) {
            try {
                console.log(`Trying to load playlist from: ${path}`);
                const response = await fetch(path);
                lastResponse = response;
                
                if (response.ok) {
                    const content = await response.text();
                    if (content.includes('#EXTM3U')) {
                        this.processM3UContent(content);
                        return;
                    } else {
                        throw new Error('Invalid M3U format');
                    }
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            } catch (error) {
                console.error(`Failed to load from ${path}:`, error);
                lastError = error;
            }
        }

        // If we get here, all attempts failed
        console.error('All attempts to load default playlist failed:', lastError);
        
        // Show error message to user with more specific details
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        
        let errorDetails = 'Could not load default playlist from any location';
        if (lastError) {
            errorDetails = lastError.message;
        } else if (lastResponse) {
            errorDetails = `HTTP error! status: ${lastResponse.status}`;
        }

        errorMessage.innerHTML = `
            <p>Failed to load default channels. Please try:</p>
            <ul>
                <li>Loading a playlist manually using the URL or file upload</li>
                <li>Checking your internet connection</li>
                <li>Refreshing the page</li>
            </ul>
            <p>Error details: ${errorDetails}</p>
            <button class="retry-button" onclick="app.loadDefaultChannels()">Retry Loading</button>
        `;
        channelsList.innerHTML = '';
        channelsList.appendChild(errorMessage);
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

    updateCurrentChannel(name = '') {
        const currentChannelElement = document.getElementById('currentChannel');
        if (name) {
            currentChannelElement.textContent = name;
        } else {
            const currentChannel = this.parser.channels.find(channel => 
                channel.url === this.player.video.src
            );
            currentChannelElement.textContent = currentChannel ? currentChannel.info.title : 'No channel selected';
        }
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
}

// Initialize the application
const app = new IPTVApp(); 