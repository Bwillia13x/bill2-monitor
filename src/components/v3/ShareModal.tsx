import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Facebook, Mail, Copy, Check, Download } from "lucide-react";
import { toast } from "sonner";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  meterValue: number;
  daysRemaining: number;
  referralCode: string;
}

type CardTheme = "meter" | "countdown";

export function ShareModal({ 
  open, 
  onClose, 
  meterValue, 
  daysRemaining,
  referralCode 
}: ShareModalProps) {
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>("meter");
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const shareUrl = `${window.location.origin}?ref=${referralCode}`;
  const shareText = "I added my anonymous signal to the Alberta Teacher Conditions Index — independent measurement platform. Participate here:"

  // Generate share card on canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1200;
    canvas.height = 630;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    if (selectedTheme === "meter") {
      gradient.addColorStop(0, '#1e3a8a');
      gradient.addColorStop(1, '#111827');
    } else {
      gradient.addColorStop(0, '#7f1d1d');
      gradient.addColorStop(1, '#111827');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Main value
    ctx.fillStyle = selectedTheme === "meter" ? '#60a5fa' : '#ef4444';
    ctx.font = 'bold 180px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const mainValue = selectedTheme === "meter" ? meterValue.toString() : daysRemaining.toString();
    ctx.fillText(mainValue, canvas.width / 2, canvas.height / 2 - 40);

    // Label
    ctx.fillStyle = '#d1d5db';
    ctx.font = 'bold 48px Inter, sans-serif';
    const label = selectedTheme === "meter" ? 'Teacher Conditions Index' : 'Days Until Strike Window';
    ctx.fillText(label, canvas.width / 2, canvas.height / 2 + 100);

    // Subtitle
    ctx.fillStyle = '#9ca3af';
    ctx.font = '32px Inter, sans-serif';
    ctx.fillText('Alberta Educators Standing Up', canvas.width / 2, canvas.height / 2 + 160);

    // Hashtag
    ctx.fillStyle = selectedTheme === "meter" ? '#3b82f6' : '#dc2626';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillText('#DigitalStrike', canvas.width / 2, canvas.height - 60);

    // Date
    ctx.fillStyle = '#6b7280';
    ctx.font = '24px Inter, sans-serif';
    ctx.textAlign = 'left';
    const today = new Date().toLocaleDateString('en-CA');
    ctx.fillText(today, 40, canvas.height - 40);

    // URL
    ctx.textAlign = 'right';
    ctx.fillText('digitalstrike.ca', canvas.width - 40, canvas.height - 40);

  }, [selectedTheme, meterValue, daysRemaining]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `digital-strike-${selectedTheme}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    });
  };

  const handleShare = (platform: 'twitter' | 'facebook' | 'whatsapp' | 'email') => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);

    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&hashtags=DigitalStrike,ABed,CharterRights`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'email':
        url = `mailto:?subject=Join%20Digital%20Strike&body=${encodedText}%20${encodedUrl}`;
        break;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-2xl bg-gray-900 border-gray-700 text-gray-100 max-h-[90vh] overflow-y-auto"
        aria-describedby="share-modal-description"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Amplify the Movement
          </DialogTitle>
        </DialogHeader>

        <div id="share-modal-description" className="space-y-6 py-4">
          {/* Theme selector */}
          <div className="flex gap-3 justify-center">
            <Button
              variant={selectedTheme === "meter" ? "default" : "outline"}
              onClick={() => setSelectedTheme("meter")}
              className="flex-1"
            >
              Meter Card
            </Button>
            <Button
              variant={selectedTheme === "countdown" ? "default" : "outline"}
              onClick={() => setSelectedTheme("countdown")}
              className="flex-1"
            >
              Countdown Card
            </Button>
          </div>

          {/* Preview */}
          <div className="relative rounded-lg overflow-hidden border border-gray-700 bg-gray-800">
            <canvas
              ref={canvasRef}
              className="w-full h-auto"
              aria-label={`Share card preview showing ${selectedTheme === "meter" ? "dissatisfaction meter" : "countdown"}`}
            />
          </div>

          {/* Download button */}
          <Button
            onClick={handleDownload}
            variant="outline"
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Image
          </Button>

          {/* Share buttons */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-300 text-center">
              Share with your network
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleShare('twitter')}
                className="bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
              >
                <X className="w-4 h-4 mr-2" />
                Twitter/X
              </Button>
              
              <Button
                onClick={() => handleShare('facebook')}
                className="bg-[#1877F2] hover:bg-[#166fe5] text-white"
              >
                <Facebook className="w-4 h-4 mr-2" />
                Facebook
              </Button>
              
              <Button
                onClick={() => handleShare('whatsapp')}
                className="bg-[#25D366] hover:bg-[#22c55e] text-white"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp
              </Button>
              
              <Button
                onClick={() => handleShare('email')}
                variant="outline"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            </div>
          </div>

          {/* Referral link */}
          <div className="space-y-2">
            <label htmlFor="referral-link" className="text-sm font-medium text-gray-300">
              Your personal referral link
            </label>
            <div className="flex gap-2">
              <Input
                id="referral-link"
                value={shareUrl}
                readOnly
                className="bg-gray-800 border-gray-700 text-gray-300"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Track your impact: referrals through this link are attributed to you
            </p>
          </div>

          {/* Prefilled copy */}
          <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
            <p className="text-sm text-gray-300 italic">
              "{shareText}"
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
