import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface BootstrapResult {
  originalCCI: number;
  bootstrapMeans: number[];
  ciLower: number;
  ciUpper: number;
  stdError: number;
}

export function BootstrapVisualizer() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BootstrapResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [sampleSize, setSampleSize] = useState(50);

  // Generate mock sample data
  const generateSampleData = (n: number): Array<{ satisfaction: number; exhaustion: number }> => {
    return Array.from({ length: n }, () => ({
      satisfaction: Math.max(1, Math.min(10, 5 + (Math.random() - 0.5) * 4)),
      exhaustion: Math.max(1, Math.min(10, 6 + (Math.random() - 0.5) * 4)),
    }));
  };

  const calculateCCI = (s: number, e: number): number => {
    return 10 * (0.4 * s + 0.6 * (10 - e));
  };

  const runBootstrap = async () => {
    setIsRunning(true);
    setProgress(0);
    
    const sampleData = generateSampleData(sampleSize);
    const originalCCI = sampleData.reduce((sum, d) => sum + calculateCCI(d.satisfaction, d.exhaustion), 0) / sampleData.length;
    
    const bootstrapMeans: number[] = [];
    const B = 2000; // Number of bootstrap resamples
    
    for (let i = 0; i < B; i++) {
      // Create bootstrap sample (sampling with replacement)
      const bootstrapSample = Array.from({ length: sampleData.length }, () => 
        sampleData[Math.floor(Math.random() * sampleData.length)]
      );
      
      const bootstrapCCI = bootstrapSample.reduce((sum, d) => sum + calculateCCI(d.satisfaction, d.exhaustion), 0) / bootstrapSample.length;
      bootstrapMeans.push(bootstrapCCI);
      
      // Update progress every 100 iterations
      if (i % 100 === 0) {
        setProgress((i / B) * 100);
        await new Promise(resolve => setTimeout(resolve, 0)); // Allow UI to update
      }
    }
    
    // Calculate 95% confidence interval
    bootstrapMeans.sort((a, b) => a - b);
    const ciLower = bootstrapMeans[Math.floor(B * 0.025)];
    const ciUpper = bootstrapMeans[Math.floor(B * 0.975)];
    const stdError = Math.sqrt(bootstrapMeans.reduce((sum, m) => sum + Math.pow(m - originalCCI, 2), 0) / B);
    
    setResult({
      originalCCI,
      bootstrapMeans,
      ciLower,
      ciUpper,
      stdError,
    });
    setIsRunning(false);
    setProgress(100);
  };

  // Prepare histogram data
  const histogramData = result ? result.bootstrapMeans.reduce((acc, val) => {
    const bin = Math.round(val * 10) / 10; // Round to 1 decimal
    const existing = acc.find(d => d.bin === bin);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ bin, count: 1 });
    }
    return acc;
  }, [] as Array<{ bin: number; count: number }>).sort((a, b) => a.bin - b.bin) : [];

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-2xl text-white">Bootstrap Confidence Intervals</CardTitle>
        <CardDescription className="text-gray-400">
          B = 2000 resamples, 95% confidence interval (2.5th to 97.5th percentile)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300">
              Sample Size: <span className="text-white">{sampleSize}</span>
            </label>
            <input
              type="range"
              min="20"
              max="200"
              value={sampleSize}
              onChange={(e) => setSampleSize(Number(e.target.value))}
              className="w-full mt-2"
              disabled={isRunning}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>20 (minimum)</span>
              <span>200</span>
            </div>
          </div>

          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-300 mb-1">Suppression Rule</h4>
                <p className="text-sm text-yellow-200">
                  If n &lt; 20, CCI is suppressed and shows as "Insufficient data". 
                  This protects individual privacy and ensures statistical reliability.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={runBootstrap}
            disabled={isRunning || sampleSize < 20}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isRunning ? `Running Bootstrap... ${progress.toFixed(0)}%` : 'Run Bootstrap Simulation'}
          </Button>
        </div>

        {result && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {result.originalCCI.toFixed(1)}
                </div>
                <div className="text-sm text-gray-400">Original CCI</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {result.ciLower.toFixed(1)}
                </div>
                <div className="text-sm text-gray-400">95% CI Lower</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {result.ciUpper.toFixed(1)}
                </div>
                <div className="text-sm text-gray-400">95% CI Upper</div>
              </div>
            </div>

            <div>
              <div className="text-center mb-2">
                <span className="text-lg font-semibold text-white">
                  CCI = {result.originalCCI.toFixed(1)}
                </span>
                <span className="text-blue-400">
                  {' '}± {((result.ciUpper - result.ciLower) / 2).toFixed(1)}
                </span>
              </div>
              <div className="text-sm text-gray-400 text-center">
                95% Confidence Interval: [{result.ciLower.toFixed(1)}, {result.ciUpper.toFixed(1)}]
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={histogramData}>
                  <XAxis 
                    dataKey="bin" 
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    label={{ value: 'CCI Score', position: 'insideBottom', fill: '#9ca3af' }}
                  />
                  <YAxis 
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#f3f4f6' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <ReferenceLine 
                    x={result.originalCCI} 
                    stroke="#ef4444" 
                    strokeDasharray="5 5"
                    label={{ value: "Original", fill: '#ef4444', position: 'top' }}
                  />
                  <ReferenceLine 
                    x={result.ciLower} 
                    stroke="#3b82f6" 
                    strokeDasharray="3 3"
                    label={{ value: "CI Lower", fill: '#3b82f6', position: 'bottom' }}
                  />
                  <ReferenceLine 
                    x={result.ciUpper} 
                    stroke="#3b82f6" 
                    strokeDasharray="3 3"
                    label={{ value: "CI Upper", fill: '#3b82f6', position: 'bottom' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Interpretation</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• <strong>Original CCI:</strong> The calculated index from the actual sample</li>
                <li>• <strong>Bootstrap distribution:</strong> Shows variability across 2000 resamples</li>
                <li>• <strong>95% CI:</strong> Range where true population parameter likely falls</li>
                <li>• <strong>Standard Error:</strong> {result.stdError.toFixed(2)} - measure of precision</li>
                <li>• <strong>Sample Size:</strong> {sampleSize} - larger samples yield narrower CIs</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}