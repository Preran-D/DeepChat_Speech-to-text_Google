import { useState } from 'react';
import { DeepChat } from 'deep-chat-react';
import Microphone from './Microphone.jsx';
import { Box, Typography, Button, TextField } from '@mui/material';

function App() {
  const [transcript, setTranscript] = useState('');
  const [conversation, setConversation] = useState([
    { role: 'ai', text: 'Hello! How can I help you today?' }
  ]);
  const [stopMic, setStopMic] = useState(false);

  const handleSubmit = () => {
    if (transcript.trim()) {
      setConversation(prev => [...prev, { role: 'user', text: transcript }]);
      setTranscript('');
      setStopMic(true); 
    }
  };

  const handleTranscriptChange = (e) => {
    setTranscript(e.target.value);
    if (stopMic) setStopMic(false); 
  };

  const handleMicStopped = () => {
    setStopMic(false); 
  };

  return (
    <Box sx={{ display: 'inline-flex', flexDirection: 'column', height: '100vh', p: 2, alignContent:'center' }}>
      <Typography variant="h5" component="h1" gutterBottom align="center" sx={{ mb: 2 }}>
        Voice Chat
      </Typography>

      <DeepChat
        demo={true}
        history={conversation}
        messageStyles={{
          default: {
            user: {
              showAvatar: true,
            },
            ai: {
              showAvatar: true,
            }
          }
        }}
        textInput={{ disabled: true, style: { display: 'none' } }}
      />

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
        <Microphone 
          setTranscript={setTranscript} 
          stopSignal={stopMic} 
          onStopped={handleMicStopped} 
        />
        <TextField
          value={transcript}
          onChange={handleTranscriptChange}
          placeholder="Type your message..."
          multiline
          minRows={1}
          maxRows={5}
          variant="outlined"
          size="small"
          sx={{ flexGrow: 1 }}
        />
        <Button 
          variant="contained" 
          onClick={handleSubmit} 
          disabled={!transcript.trim()}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
}

export default App;