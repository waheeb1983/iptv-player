import React, { useState } from 'react';
import { Box, Container, TextField, Button, List, ListItem, ListItemText, Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import 'video.js/dist/video-js.css';
import videojs from 'video.js';

const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(4),
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
}));

const MainContent = styled(Box)({
  display: 'flex',
  flex: 1,
  gap: '20px',
  marginTop: '20px',
});

const PlayerContainer = styled(Paper)({
  flex: 2,
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
});

const UrlListContainer = styled(Paper)({
  flex: 1,
  padding: '20px',
  overflowY: 'auto',
});

interface SavedUrl {
  id: string;
  name: string;
  url: string;
}

function App() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [urlName, setUrlName] = useState('');
  const [savedUrls, setSavedUrls] = useState<SavedUrl[]>([]);
  const [player, setPlayer] = useState<any>(null);

  const handleAddUrl = () => {
    if (currentUrl && urlName) {
      const newUrl: SavedUrl = {
        id: Date.now().toString(),
        name: urlName,
        url: currentUrl,
      };
      setSavedUrls([...savedUrls, newUrl]);
      setCurrentUrl('');
      setUrlName('');
    }
  };

  const handlePlayUrl = (url: string) => {
    if (player) {
      player.dispose();
    }

    const videoElement = document.createElement('video-js');
    videoElement.className = 'video-js vjs-default-skin vjs-big-play-centered';
    videoElement.style.width = '100%';
    videoElement.style.height = '100%';

    const playerContainer = document.getElementById('player-container');
    if (playerContainer) {
      playerContainer.innerHTML = '';
      playerContainer.appendChild(videoElement);

      const newPlayer = videojs(videoElement, {
        controls: true,
        autoplay: true,
        preload: 'auto',
        sources: [{
          src: url,
          type: 'application/x-mpegURL'
        }]
      });

      setPlayer(newPlayer);
    }
  };

  return (
    <StyledContainer maxWidth="xl">
      <Typography variant="h4" component="h1" gutterBottom>
        IPTV Player
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="URL Name"
          value={urlName}
          onChange={(e) => setUrlName(e.target.value)}
          fullWidth
        />
        <TextField
          label="IPTV URL"
          value={currentUrl}
          onChange={(e) => setCurrentUrl(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          onClick={handleAddUrl}
          disabled={!currentUrl || !urlName}
        >
          Add URL
        </Button>
      </Box>

      <MainContent>
        <UrlListContainer>
          <Typography variant="h6" gutterBottom>
            Saved URLs
          </Typography>
          <List>
            {savedUrls.map((savedUrl) => (
              <ListItem
                key={savedUrl.id}
                button
                onClick={() => handlePlayUrl(savedUrl.url)}
              >
                <ListItemText primary={savedUrl.name} secondary={savedUrl.url} />
              </ListItem>
            ))}
          </List>
        </UrlListContainer>

        <PlayerContainer>
          <Typography variant="h6" gutterBottom>
            Player
          </Typography>
          <Box id="player-container" sx={{ flex: 1, minHeight: '400px' }} />
        </PlayerContainer>
      </MainContent>
    </StyledContainer>
  );
}

export default App; 