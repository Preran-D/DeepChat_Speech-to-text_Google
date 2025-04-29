import express, { Express, Request, Response } from 'express';
import { SpeechClient, protos } from '@google-cloud/speech';
import dotenv from 'dotenv';
import multer from 'multer';
import cors from 'cors';

dotenv.config();

const upload = multer();
const app: Express = express();
const port = 8080;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const client = new SpeechClient({
  keyFilename: './affable-envoy-457610-v0-07e1b78753b6.json', // Update with your actual credentials path
});

app.post('/api/gcloud-speech', async (req: Request, res: Response) => {
  try {
    const audioContent = req.body.audio;
    if (!audioContent) {
      return res.status(400).json({ error: 'No audio content provided' });
    }

    const requestConfig = {
      config: {
        encoding: protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.WEBM_OPUS,
        sampleRateHertz: 48000, 
        languageCode: 'en-US'
      },
      audio: {
        content: audioContent
      }
    };
    

    const [response] = await client.recognize(requestConfig);

    console.log("Full transcription response:", JSON.stringify(response, null, 2));

    const transcription = response.results?.length
      ? response.results.map(result => result.alternatives?.[0]?.transcript).filter(Boolean).join('\n')
      : '';

    return res.json({ message: transcription || 'No speech recognized' });
  } catch (err) {
    console.error('Transcription error:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error occurred' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
