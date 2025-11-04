import { useState } from "react";
import { Panel } from "@/components/Panel";
import { Download, Share2, Image, FileText, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface ShareableTemplate {
  id: string;
  type: "image" | "text" | "qr";
  name: string;
  description: string;
  preview: string;
}

const TEMPLATES: ShareableTemplate[] = [
  {
    id: "personal-card",
    type: "image",
    name: "Personal Impact Card",
    description: "Show your contribution to the movement",
    preview: "🎯 I'm educator #145 standing up for Charter rights"
  },
  {
    id: "stats-card",
    type: "image",
    name: "Movement Stats Card",
    description: "Share current movement statistics",
    preview: "📊 145 Alberta educators have spoken"
  },
  {
    id: "quote-card",
    type: "image",
    name: "Teacher Quote Card",
    description: "Share powerful educator testimonials",
    preview: "💬 'How can I teach democracy when rights are suspended?'"
  },
  {
    id: "referral-qr",
    type: "qr",
    name: "QR Code Card",
    description: "Printable card with your referral QR code",
    preview: "📱 Scan to add your voice"
  }
];

const CAPTIONS = [
  {
    platform: "Twitter/X",
    text: "I've joined 145 Alberta educators standing up for our Charter rights. The notwithstanding clause affects us all. Add your voice anonymously: [link] #ABed #CharterRights #DigitalStrike"
  },
  {
    platform: "Facebook",
    text: "As an Alberta educator, I'm deeply concerned about the use of the notwithstanding clause to override our Charter rights. I've added my anonymous signature to show that we stand together for fairness and democracy. If you're an educator in Alberta, please consider adding your voice too. Together, we can demonstrate the scale of our collective concern. [link]"
  },
  {
    platform: "Instagram",
    text: "Standing with 145+ Alberta educators for our Charter rights 🎓✊\n\nThe notwithstanding clause affects every teacher, every student, every family.\n\nLink in bio to add your anonymous voice.\n\n#ABed #TeachersOfInstagram #CharterRights #DigitalStrike #AlbertaEducation"
  },
  {
    platform: "Email",
    text: "Hi,\n\nI wanted to share something important with you. I've joined a growing movement of Alberta educators who are concerned about the use of the notwithstanding clause to override our Charter rights.\n\nThis digital platform allows teachers to anonymously express their concerns while maintaining complete privacy. So far, 145 educators have added their voices, and the number is growing daily.\n\nIf you're an educator in Alberta and share these concerns, I encourage you to learn more and consider adding your anonymous signature: [link]\n\nTogether, we can show the scale of our collective concern.\n\nBest regards"
  }
];

export function ShareableGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<ShareableTemplate>(TEMPLATES[0]);
  const [copiedCaption, setCopiedCaption] = useState<string | null>(null);

  const handleDownload = (template: ShareableTemplate) => {
    // In production, this would generate and download the actual image
    toast.success(`Generating ${template.name}...`);
    setTimeout(() => {
      toast.success(`${template.name} ready for download!`);
    }, 1500);
  };

  const handleCopyCaption = (platform: string, text: string) => {
    navigator.clipboard.writeText(text.replace("[link]", window.location.origin));
    setCopiedCaption(platform);
    toast.success(`${platform} caption copied!`);
    setTimeout(() => setCopiedCaption(null), 2000);
  };

  const handleQuickShare = (platform: "twitter" | "facebook") => {
    const caption = CAPTIONS.find(c => 
      platform === "twitter" ? c.platform === "Twitter/X" : c.platform === "Facebook"
    );
    
    const text = caption?.text.replace("[link]", "") || "";
    const url = window.location.origin;

    if (platform === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        "_blank"
      );
    } else {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
        "_blank"
      );
    }
  };

  return (
    <Panel className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Share2 className="size-5 text-primary" />
            Social Sharing Toolkit
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Download ready-made graphics and copy pre-written captions
          </p>
        </div>

        <Tabs defaultValue="graphics" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="graphics">Graphics</TabsTrigger>
            <TabsTrigger value="captions">Captions</TabsTrigger>
          </TabsList>

          {/* Graphics Tab */}
          <TabsContent value="graphics" className="space-y-4">
            {/* Template Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`
                    text-left p-4 rounded-xl border-2 transition-all
                    ${selectedTemplate.id === template.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {template.type === "image" && <Image className="size-5 text-primary" />}
                      {template.type === "text" && <FileText className="size-5 text-primary" />}
                      {template.type === "qr" && <QrCode className="size-5 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">{template.name}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                      <div className="text-xs bg-muted/50 rounded px-2 py-1 font-mono">
                        {template.preview}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Preview & Download */}
            <div className="bg-gradient-to-br from-primary/5 to-background rounded-xl p-6 ring-1 ring-border">
              <div className="space-y-4">
                <h4 className="font-semibold">Preview: {selectedTemplate.name}</h4>
                
                {/* Mock preview */}
                <div className="aspect-square max-w-md mx-auto bg-gradient-to-br from-primary via-primary/80 to-primary/60 rounded-xl p-8 flex flex-col items-center justify-center text-white shadow-2xl">
                  <div className="text-center space-y-4">
                    <div className="text-6xl mb-4">
                      {selectedTemplate.type === "qr" ? "📱" : "🎓"}
                    </div>
                    <div className="text-2xl font-bold leading-tight">
                      {selectedTemplate.preview}
                    </div>
                    <div className="text-sm opacity-90">
                      Digital Strike · Alberta Educators
                    </div>
                    {selectedTemplate.type === "qr" && (
                      <div className="w-32 h-32 bg-white rounded-lg mx-auto mt-4 flex items-center justify-center">
                        <QrCode className="size-16 text-primary" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Download buttons */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    onClick={() => handleDownload(selectedTemplate)}
                    className="gap-2"
                  >
                    <Download className="size-4" />
                    Download PNG
                  </Button>
                  <Button
                    onClick={() => handleDownload(selectedTemplate)}
                    variant="outline"
                    className="gap-2"
                  >
                    <Download className="size-4" />
                    Download for Instagram (1080x1080)
                  </Button>
                  <Button
                    onClick={() => handleDownload(selectedTemplate)}
                    variant="outline"
                    className="gap-2"
                  >
                    <Download className="size-4" />
                    Download for Stories (1080x1920)
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Captions Tab */}
          <TabsContent value="captions" className="space-y-4">
            <div className="space-y-4">
              {CAPTIONS.map((caption) => (
                <div
                  key={caption.platform}
                  className="bg-muted/30 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{caption.platform}</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyCaption(caption.platform, caption.text)}
                    >
                      {copiedCaption === caption.platform ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3 text-sm whitespace-pre-wrap font-mono">
                    {caption.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick share buttons */}
            <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-xl p-4 border-l-4 border-primary">
              <h4 className="font-semibold text-sm mb-3">Quick Share</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleQuickShare("twitter")}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Share2 className="size-4" />
                  Share on Twitter/X
                </Button>
                <Button
                  onClick={() => handleQuickShare("facebook")}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Share2 className="size-4" />
                  Share on Facebook
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Hashtag suggestions */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2">Recommended Hashtags</h4>
          <div className="flex flex-wrap gap-2">
            {["#ABed", "#CharterRights", "#DigitalStrike", "#AlbertaEducation", "#TeachersVoices"].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  navigator.clipboard.writeText(tag);
                  toast.success(`${tag} copied!`);
                }}
                className="px-3 py-1 bg-primary/10 hover:bg-primary/20 rounded-full text-xs font-medium text-primary transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}
