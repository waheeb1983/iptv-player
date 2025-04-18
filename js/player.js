class VideoPlayer {
    constructor() {
        this.video = document.getElementById('videoPlayer');
        this.errorMessage = document.getElementById('playerError');
        this.hls = null;

        this.initializePlayer();
    }

    initializePlayer() {
        // Set up error handling
        this.video.addEventListener('error', (e) => {
            console.error('Video error:', e);
            this.handleError();
        });

        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    playChannel(url) {
        // Hide any previous error message
        this.errorMessage.style.display = 'none';

        // Destroy previous HLS instance if it exists
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }

        // Check if URL is an HLS stream (.m3u8)
        if (url.endsWith('.m3u8') || url.includes('/hls/')) {
            this.playHLS(url);
        } else {
            this.playDirect(url);
        }
    }

    playHLS(url) {
        if (Hls.isSupported()) {
            this.hls = new Hls({
                maxBufferLength: 30,
                maxMaxBufferLength: 600,
                maxBufferSize: 60 * 1000 * 1000,
                maxBufferHole: 0.5,
                lowLatencyMode: true
            });

            this.hls.loadSource(url);
            this.hls.attachMedia(this.video);
            
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                this.video.play().catch(error => {
                    console.error('Playback failed:', error);
                    this.handleError();
                });
            });

            this.hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS error:', data);
                if (data.fatal) {
                    this.handleError();
                }
            });
        } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
            // For Safari, which has native HLS support
            this.playDirect(url);
        } else {
            this.handleError('HLS is not supported in your browser');
        }
    }

    playDirect(url) {
        this.video.src = url;
        this.video.load();
        this.video.play().catch(error => {
            console.error('Playback failed:', error);
            this.handleError();
        });
    }

    handleError(message = 'Playback error occurred') {
        console.error(message);
        this.errorMessage.style.display = 'block';
        
        // Stop any ongoing playback
        this.video.pause();
        this.video.removeAttribute('src');
        this.video.load();

        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.video.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'f':
                    this.toggleFullscreen();
                    break;
                case ' ':
                    if (this.video.paused) {
                        this.video.play();
                    } else {
                        this.video.pause();
                    }
                    break;
                case 'ArrowRight':
                    this.video.currentTime += 10;
                    break;
                case 'ArrowLeft':
                    this.video.currentTime -= 10;
                    break;
            }
        });
    }
} 