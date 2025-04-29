import express, { Express, Request, Response } from 'express';
import { SpeechClient, protos } from '@google-cloud/speech';
import cors from 'cors';
import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';


const app: Express = express();
const port = 8080;

const server = http.createServer(app);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const speechClient = new SpeechClient({
  keyFilename: './google-credential-file.json', //add your google authentication file
});


app.post('/api/gcloud-live-speech', (req: Request, res: Response) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    const recognizeStream = speechClient.streamingRecognize({
      config: {
        encoding: protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.LINEAR16,
        sampleRateHertz: 44100,
        languageCode: 'en-US',
        enableAutomaticPunctuation: true,
        model: 'default',
      },
      interimResults: true,
    });

    req.on('data', (chunk) => {
      try {
        recognizeStream.write(chunk);
      } catch (err) {
        console.error('Write error:', err);
      }
    });

    recognizeStream.on('data', (data) => {
      const result = data.results[0];
      if (result?.alternatives[0]) {
        const transcription = {
          transcript: result.alternatives[0].transcript,
          isFinal: result.isFinal,
          stability: result.stability,
          confidence: result.alternatives[0].confidence,
        };
        res.write(`data: ${JSON.stringify(transcription)}\n\n`);
      }
    });

    recognizeStream.on('end', () => {
      console.log('Recognition stream ended');
      res.end();
    });

    recognizeStream.on('error', (err) => {
      console.error('Recognition stream error:', err);
      res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });

    req.on('close', () => {
      console.log('Client disconnected');
      recognizeStream.destroy();
    });

  } catch (err) {
    console.error('Setup error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Unknown error occurred',
      });
    }
  }
});

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  const request: protos.google.cloud.speech.v1.IStreamingRecognitionConfig = {
    config: {
      encoding: protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.LINEAR16,
      sampleRateHertz: 44100,
      languageCode: 'en-US',
      enableAutomaticPunctuation: false,
    },
    interimResults: true,
  };

  const recognizeStream = speechClient
    .streamingRecognize(request)
    .on('error', (err) => {
      console.error('Streaming error:', err);
      ws.send(JSON.stringify({ error: err.message }));
    })
    .on('data', (data) => {
      const result = data.results[0];
      const transcription = result?.alternatives[0]?.transcript || '';
      if (transcription) {
        console.log(`Transcription: ${transcription}`);
        ws.send(JSON.stringify({
          transcript: transcription,
          isFinal: result.isFinal,
        }));
      }
    });

  ws.on('message', (message: WebSocket.RawData) => {
    try {
        let audioBuffer: Buffer;

        if (Buffer.isBuffer(message)) {
          audioBuffer = message;
        } else if (message instanceof ArrayBuffer) {
          audioBuffer = Buffer.from(new Uint8Array(message));
        } else if (ArrayBuffer.isView(message)) {
          audioBuffer = Buffer.from(message.buffer);
        } else {
          audioBuffer = Buffer.from(message as unknown as Uint8Array);
        }
        

      recognizeStream.write(audioBuffer);
    } catch (err) {
      console.error('Audio handling error:', err);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    recognizeStream.end();
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`WebSocket server running at ws://localhost:${port}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
