import { useRef, useEffect } from "react";

interface District {
  name: string;
  count: number;
  unlocked: boolean;
}

interface PressTileGeneratorProps {
  meterValue: number;
  delta7d: number;
  districts: District[];
  onGenerated?: (blob: Blob) => void;
}

export function PressTileGenerator({
  meterValue,
  delta7d,
  districts,
  onGenerated,
}: PressTileGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (Twitter/Facebook optimal)
    canvas.width = 1200;
    canvas.height = 630;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1e3a8a');
    gradient.addColorStop(0.5, '#111827');
    gradient.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#d1d5db';
    ctx.font = 'bold 42px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Alberta Educator', canvas.width / 2, 60);
    ctx.fillText('Dissatisfaction Signals', canvas.width / 2, 115);

    // Main number
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 200px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(meterValue.toString(), canvas.width / 2, 320);

    // Delta
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillText(`+${delta7d.toFixed(1)} (7-day avg)`, canvas.width / 2, 450);

    // Mini map visualization (simplified)
    const unlockedCount = districts.filter(d => d.unlocked).length;
    const totalCount = districts.length;
    
    ctx.fillStyle = '#9ca3af';
    ctx.font = '28px Inter, sans-serif';
    ctx.fillText(
      `${unlockedCount}/${totalCount} districts unlocked (n≥20)`,
      canvas.width / 2,
      510
    );

    // Date stamp
    ctx.fillStyle = '#6b7280';
    ctx.font = '24px Inter, sans-serif';
    ctx.textAlign = 'left';
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-CA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    ctx.fillText(dateStr, 40, canvas.height - 50);

    // URL
    ctx.textAlign = 'right';
    ctx.fillText('digitalstrike.ca', canvas.width - 40, canvas.height - 50);

    // Hashtag
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('#DigitalStrike', canvas.width / 2, canvas.height - 50);

    // Generate blob if callback provided
    if (onGenerated) {
      canvas.toBlob((blob) => {
        if (blob) onGenerated(blob);
      });
    }
  }, [meterValue, delta7d, districts, onGenerated]);

  return (
    <canvas
      ref={canvasRef}
      className="hidden"
      aria-hidden="true"
    />
  );
}

// Hook for downloading press tile
export function usePressTileDownload(
  meterValue: number,
  delta7d: number,
  districts: District[]
) {
  const download = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1200;
    canvas.height = 630;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1e3a8a');
    gradient.addColorStop(0.5, '#111827');
    gradient.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#d1d5db';
    ctx.font = 'bold 42px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Alberta Educator', canvas.width / 2, 60);
    ctx.fillText('Dissatisfaction Signals', canvas.width / 2, 115);

    // Main number
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 200px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(meterValue.toString(), canvas.width / 2, 320);

    // Delta
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillText(`+${delta7d.toFixed(1)} (7-day avg)`, canvas.width / 2, 450);

    // Districts
    const unlockedCount = districts.filter(d => d.unlocked).length;
    const totalCount = districts.length;
    
    ctx.fillStyle = '#9ca3af';
    ctx.font = '28px Inter, sans-serif';
    ctx.fillText(
      `${unlockedCount}/${totalCount} districts unlocked (n≥20)`,
      canvas.width / 2,
      510
    );

    // Date stamp
    ctx.fillStyle = '#6b7280';
    ctx.font = '24px Inter, sans-serif';
    ctx.textAlign = 'left';
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-CA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    ctx.fillText(dateStr, 40, canvas.height - 50);

    // URL
    ctx.textAlign = 'right';
    ctx.fillText('digitalstrike.ca', canvas.width - 40, canvas.height - 50);

    // Hashtag
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('#DigitalStrike', canvas.width / 2, canvas.height - 50);

    // Download
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `digital-strike-press-${today.toISOString().split('T')[0]}.png`;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return download;
}
