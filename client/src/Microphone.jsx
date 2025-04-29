import React, { useState, useRef, useEffect } from 'react';
import { IconButton, CircularProgress, Tooltip } from '@mui/material';
import { Mic as MicIcon, MicOff as MicOffIcon } from '@mui/icons-material';

const Microphone = ({ setTranscript, stopSignal, onStopped }) => {
  const [recording, setRecording] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const socketRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);
  const audioContextRef = useRef(null);

  const initializeSocket = () => {
    setConnectionStatus('connecting');

    const socket = new WebSocket('ws://localhost:8080');
    socketRef.current = socket;

    socket.onopen = () => {
      setConnectionStatus('connected');
      startAudioCapture();
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.isFinal) {
        setTranscript(prev => prev ? prev + ' ' + data.transcript : data.transcript);
      }
    };

    socket.onerror = () => {
      setConnectionStatus('disconnected');
      stopRecording();
    };

    socket.onclose = () => {
      setConnectionStatus('disconnected');
      stopRecording();
    };
  };

  const startAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          const audioData = e.inputBuffer.getChannelData(0);
          const int16Data = convertFloat32ToInt16(audioData);
          socketRef.current.send(int16Data);
        }
      };

      setRecording(true);
    } catch (err) {
      console.error('Error starting audio capture:', err);
      setConnectionStatus('disconnected');
      stopRecording();
    }
  };

  const convertFloat32ToInt16 = (buffer) => {
    const l = buffer.length;
    const buf = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      buf[i] = Math.max(-1, Math.min(1, buffer[i])) * 0x7FFF;
    }
    return new Uint8Array(buf.buffer);
  };

  const toggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      initializeSocket();
    }
  };

  const stopRecording = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setRecording(false);
    if (onStopped) onStopped(); 
  };

  useEffect(() => {
    if (stopSignal && recording) {
      stopRecording();
    }
  }, [stopSignal]);

  useEffect(() => {
    return () => {
      if (recording) {
        stopRecording();
      }
    };
  }, []);

  return (
    <>
      <Tooltip title={recording ? 'Stop recording' : 'Start recording'}>
        <IconButton onClick={toggleRecording} color={recording ? 'error' : 'primary'}>
          {recording ? <MicOffIcon fontSize="large" /> : <MicIcon fontSize="large" />}
        </IconButton>
      </Tooltip>

      {connectionStatus === 'connecting' && (
        <CircularProgress size={24} sx={{ position: 'absolute', ml: 6 }} />
      )}
    </>
  );
};

export default Microphone;