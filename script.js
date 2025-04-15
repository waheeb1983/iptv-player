let player = null;
let savedUrls = JSON.parse(localStorage.getItem('savedUrls') || '[]');

// Initialize the player
function initPlayer() {
    player = videojs('player', {
        controls: true,
        autoplay: true,
        preload: 'auto'
    });
}

// Add a new URL
function addUrl() {
    const urlName = document.getElementById('urlName').value;
    const iptvUrl = document.getElementById('iptvUrl').value;

    if (urlName && iptvUrl) {
        const newUrl = {
            id: Date.now().toString(),
            name: urlName,
            url: iptvUrl,
            isFavorite: false
        };

        savedUrls.push(newUrl);
        localStorage.setItem('savedUrls', JSON.stringify(savedUrls));
        updateUrlList();
        
        // Clear inputs
        document.getElementById('urlName').value = '';
        document.getElementById('iptvUrl').value = '';
    }
}

// Handle M3U file upload
function handleM3UFile() {
    const fileInput = document.getElementById('m3uFile');
    const file = fileInput.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            parseM3UFile(content);
        };
        reader.readAsText(file);
    }
}

// Parse M3U file content
function parseM3UFile(content) {
    const lines = content.split('\n');
    let currentChannel = null;

    for (let line of lines) {
        line = line.trim();
        
        if (line.startsWith('#EXTINF:')) {
            // Extract channel name
            const nameMatch = line.match(/,(.*)$/);
            if (nameMatch) {
                currentChannel = {
                    name: nameMatch[1].trim(),
                    url: '',
                    isFavorite: false
                };
            }
        } else if (line && !line.startsWith('#') && currentChannel) {
            // This is the URL line
            currentChannel.url = line.trim();
            currentChannel.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            
            savedUrls.push(currentChannel);
            currentChannel = null;
        }
    }

    localStorage.setItem('savedUrls', JSON.stringify(savedUrls));
    updateUrlList();
    document.getElementById('m3uFile').value = ''; // Clear file input
}

// Toggle favorite status
function toggleFavorite(id, event) {
    event.stopPropagation(); // Prevent the click from triggering the play action
    savedUrls = savedUrls.map(url => {
        if (url.id === id) {
            return { ...url, isFavorite: !url.isFavorite };
        }
        return url;
    });
    localStorage.setItem('savedUrls', JSON.stringify(savedUrls));
    updateUrlList();
}

// Delete a channel
function deleteChannel(id, event) {
    event.stopPropagation(); // Prevent the click from triggering the play action
    savedUrls = savedUrls.filter(url => url.id !== id);
    localStorage.setItem('savedUrls', JSON.stringify(savedUrls));
    updateUrlList();
}

// Create a channel list item
function createChannelListItem(url) {
    const li = document.createElement('li');
    const channelInfo = document.createElement('div');
    channelInfo.className = 'channel-info';
    
    const name = document.createElement('strong');
    name.textContent = url.name;
    
    const hint = document.createElement('small');
    hint.textContent = 'Click to play';
    
    channelInfo.appendChild(name);
    channelInfo.appendChild(hint);
    
    const favoriteBtn = document.createElement('button');
    favoriteBtn.className = 'favorite-btn';
    favoriteBtn.innerHTML = url.isFavorite ? '★' : '☆';
    favoriteBtn.onclick = (e) => toggleFavorite(url.id, e);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = (e) => deleteChannel(url.id, e);
    
    li.appendChild(channelInfo);
    li.appendChild(favoriteBtn);
    li.appendChild(deleteBtn);
    
    // Add click event for playing
    li.addEventListener('click', () => playUrl(url.url));
    
    return li;
}

// Filter channels based on search input
function filterChannels() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const urlList = document.getElementById('savedUrls');
    const favoriteList = document.getElementById('favoriteUrls');
    urlList.innerHTML = '';
    favoriteList.innerHTML = '';

    const filteredUrls = savedUrls.filter(url => 
        url.name.toLowerCase().includes(searchInput)
    );

    filteredUrls.forEach(url => {
        const li = createChannelListItem(url);
        
        if (url.isFavorite) {
            const favoriteLi = createChannelListItem(url);
            favoriteList.appendChild(favoriteLi);
        } else {
            urlList.appendChild(li);
        }
    });
}

// Update the URL list
function updateUrlList() {
    const urlList = document.getElementById('savedUrls');
    const favoriteList = document.getElementById('favoriteUrls');
    urlList.innerHTML = '';
    favoriteList.innerHTML = '';

    savedUrls.forEach(url => {
        const li = createChannelListItem(url);
        
        if (url.isFavorite) {
            const favoriteLi = createChannelListItem(url);
            favoriteList.appendChild(favoriteLi);
        } else {
            urlList.appendChild(li);
        }
    });
}

// Play a URL
function playUrl(url) {
    if (player) {
        player.src({
            src: url,
            type: 'application/x-mpegURL'
        });
        player.play();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initPlayer();
    updateUrlList();
}); 