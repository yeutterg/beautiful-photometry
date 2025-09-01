import express from 'express';
import cors from 'cors';
import { SpectralData, SPD, Metrics } from './types/spectrum';
import { calculateAllMetrics } from './calculations/metrics';
import { calculateTM30 } from './calculations/tm30';

const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'ts-backend' });
});

// Calculate metrics for a single SPD
app.post('/api/metrics/single', (req, res) => {
  try {
    const { name, data }: { name: string; data: SpectralData } = req.body;
    
    if (!data || Object.keys(data).length === 0) {
      res.status(400).json({ error: 'Invalid spectral data' });
      return;
    }
    
    const metrics = calculateAllMetrics(name || 'SPD', data);
    res.json({ success: true, metrics });
  } catch (error) {
    console.error('Error calculating single metrics:', error);
    res.status(500).json({ error: 'Failed to calculate metrics' });
  }
});

// Calculate metrics for multiple SPDs
app.post('/api/metrics/multiple', (req, res) => {
  try {
    const { spds }: { spds: SPD[] } = req.body;
    
    if (!spds || spds.length === 0) {
      res.status(400).json({ error: 'No spectral data provided' });
      return;
    }
    
    const metricsArray: Metrics[] = spds.map(spd => 
      calculateAllMetrics(spd.name || spd.id, spd.data)
    );
    
    res.json({ success: true, metrics: metricsArray });
  } catch (error) {
    console.error('Error calculating multiple metrics:', error);
    res.status(500).json({ error: 'Failed to calculate metrics' });
  }
});

// Batch calculate metrics
app.post('/api/metrics/batch', (req, res) => {
  try {
    const { spds }: { spds: Array<{ id: string; name: string; data: SpectralData }> } = req.body;
    
    if (!spds || spds.length === 0) {
      res.status(400).json({ error: 'No spectral data provided' });
      return;
    }
    
    const results = spds.map(spd => ({
      id: spd.id,
      name: spd.name,
      metrics: calculateAllMetrics(spd.name, spd.data)
    }));
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Error in batch calculation:', error);
    res.status(500).json({ error: 'Failed to calculate metrics' });
  }
});

// TM-30 specific endpoints
app.post('/api/tm30/single', (req, res) => {
  try {
    const { name, data }: { name: string; data: SpectralData } = req.body;
    
    if (!data || Object.keys(data).length === 0) {
      res.status(400).json({ error: 'Invalid spectral data' });
      return;
    }
    
    const tm30Results = calculateTM30(data);
    res.json({ success: true, name: name || 'SPD', tm30: tm30Results });
  } catch (error) {
    console.error('Error calculating TM-30:', error);
    res.status(500).json({ error: 'Failed to calculate TM-30 metrics' });
  }
});

app.post('/api/tm30/batch', (req, res) => {
  try {
    const { spds }: { spds: Array<{ id: string; name: string; data: SpectralData }> } = req.body;
    
    if (!spds || spds.length === 0) {
      res.status(400).json({ error: 'No spectral data provided' });
      return;
    }
    
    const results = spds.map(spd => {
      try {
        const tm30Results = calculateTM30(spd.data);
        return {
          id: spd.id,
          name: spd.name,
          tm30: tm30Results,
          success: true
        };
      } catch (error) {
        console.error(`Error calculating TM-30 for ${spd.name}:`, error);
        return {
          id: spd.id,
          name: spd.name,
          tm30: null,
          success: false,
          error: 'Failed to calculate TM-30'
        };
      }
    });
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Error in TM-30 batch calculation:', error);
    res.status(500).json({ error: 'Failed to calculate TM-30 metrics' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`TypeScript backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});