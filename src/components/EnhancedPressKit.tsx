import { useState } from "react";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Code, FileText, Image as ImageIcon, Quote, Mail, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface MediaAsset {
  id: string;
  type: "image" | "chart" | "logo" | "infographic";
  title: string;
  description: string;
  formats: string[];
  size?: string;
}

const MEDIA_ASSETS: MediaAsset[] = [
  {
    id: "logo-primary",
    type: "logo",
    title: "Digital Strike Logo",
    description: "Primary logo in full color",
    formats: ["PNG", "SVG", "EPS"],
    size: "High-res"
  },
  {
    id: "meter-chart",
    type: "chart",
    title: "Dissatisfaction Meter Chart",
    description: "Current sentiment gauge visualization",
    formats: ["PNG", "SVG", "PDF"],
    size: "Print-ready"
  },
  {
    id: "growth-chart",
    type: "chart",
    title: "Growth Timeline Chart",
    description: "Historical signature growth over time",
    formats: ["PNG", "SVG", "CSV"],
    size: "Data included"
  },
  {
    id: "heatmap",
    type: "image",
    title: "Provincial Heatmap",
    description: "Geographic distribution across Alberta",
    formats: ["PNG", "SVG"],
    size: "High-res"
  },
  {
    id: "infographic",
    type: "infographic",
    title: "Key Statistics Infographic",
    description: "One-page overview of movement stats",
    formats: ["PNG", "PDF"],
    size: "Print-ready"
  }
];

const EMBED_CODES = {
  meter: `<iframe src="${window.location.origin}/embed/meter" width="400" height="300" frameborder="0"></iframe>`,
  chart: `<iframe src="${window.location.origin}/embed/chart" width="600" height="400" frameborder="0"></iframe>`,
  counter: `<iframe src="${window.location.origin}/embed/counter" width="300" height="150" frameborder="0"></iframe>`
};

const SAMPLE_QUOTES = [
  {
    text: "The notwithstanding clause undermines the very rights I teach my students about. How can I explain democracy when their government suspends our Charter rights?",
    attribution: "High School Social Studies Teacher, 15 years experience, Edmonton area"
  },
  {
    text: "I've dedicated my career to public education. Using the notwithstanding clause to override our collective bargaining rights feels like a betrayal of everything we've worked for.",
    attribution: "Elementary Teacher, 22 years experience, Calgary area"
  },
  {
    text: "My students deserve educators who are valued and respected. When the government uses the notwithstanding clause, it sends a message that teachers don't matter.",
    attribution: "Middle School Teacher, 8 years experience, Red Deer area"
  }
];

export function EnhancedPressKit() {
  const [copiedEmbed, setCopiedEmbed] = useState<string | null>(null);
  const [copiedQuote, setCopiedQuote] = useState<number | null>(null);

  const handleCopyEmbed = async (type: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedEmbed(type);
      toast.success("Embed code copied!");
      setTimeout(() => setCopiedEmbed(null), 2000);
    } catch (err) {
      toast.error("Failed to copy embed code");
    }
  };

  const handleCopyQuote = async (index: number, text: string, attribution: string) => {
    try {
      await navigator.clipboard.writeText(`"${text}"\n\n— ${attribution}`);
      setCopiedQuote(index);
      toast.success("Quote copied!");
      setTimeout(() => setCopiedQuote(null), 2000);
    } catch (err) {
      toast.error("Failed to copy quote");
    }
  };

  const handleDownloadAsset = (asset: MediaAsset, format: string) => {
    toast.success(`Downloading ${asset.title} (${format})...`);
    // In production, this would trigger actual download
  };

  const handleContactPress = () => {
    window.location.href = "mailto:press@digitalstrike.ca?subject=Media Inquiry";
  };

  return (
    <Panel className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              Press Kit & Media Resources
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Everything journalists need to cover the Digital Strike movement
            </p>
          </div>
          <Button onClick={handleContactPress} variant="outline" className="gap-2">
            <Mail className="size-4" />
            Contact Press Team
          </Button>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="embeds">Live Embeds</TabsTrigger>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
            <TabsTrigger value="data">Data Access</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-6 space-y-4">
              <h4 className="font-semibold text-lg">About Digital Strike</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Digital Strike is a privacy-preserving platform that allows Alberta educators to anonymously 
                express their concerns about the use of the notwithstanding clause in education-related matters. 
                The platform aggregates sentiment data while protecting individual privacy through rigorous 
                anonymization (n≥20 threshold) and secure data handling.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">145</div>
                  <div className="text-xs text-muted-foreground">Total Signatures</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">62%</div>
                  <div className="text-xs text-muted-foreground">Dissatisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">12</div>
                  <div className="text-xs text-muted-foreground">Districts</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">23</div>
                  <div className="text-xs text-muted-foreground">Days Active</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Key Messages</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>145 Alberta educators have anonymously expressed concern about the notwithstanding clause</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>The platform uses privacy-by-design principles with n≥20 aggregation thresholds</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>This is not a call for job action, but a lawful expression of collective sentiment</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>The movement represents educators from across Alberta's diverse school districts</span>
                </li>
              </ul>
            </div>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MEDIA_ASSETS.map((asset) => (
                <div key={asset.id} className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="size-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-sm mb-1">{asset.title}</h5>
                      <p className="text-xs text-muted-foreground">{asset.description}</p>
                      {asset.size && (
                        <p className="text-xs text-primary mt-1">{asset.size}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {asset.formats.map((format) => (
                      <Button
                        key={format}
                        onClick={() => handleDownloadAsset(asset, format)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Download className="size-3" />
                        {format}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-500/10 border-l-4 border-blue-500 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Usage Rights:</strong> All media assets are provided 
                for editorial use in coverage of the Digital Strike movement. Please credit "Digital Strike" 
                and include a link to digitalstrike.ca when possible.
              </p>
            </div>
          </TabsContent>

          {/* Live Embeds Tab */}
          <TabsContent value="embeds" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Embed live, updating visualizations directly into your articles. These embeds update in real-time 
              as new data comes in.
            </p>

            <div className="space-y-4">
              {Object.entries(EMBED_CODES).map(([type, code]) => (
                <div key={type} className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold capitalize">{type} Embed</h5>
                    <Button
                      onClick={() => handleCopyEmbed(type, code)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      {copiedEmbed === type ? (
                        <>
                          <Check className="size-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Code className="size-4" />
                          Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                  <Textarea
                    value={code}
                    readOnly
                    rows={3}
                    className="font-mono text-xs bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    Responsive and updates automatically. No API key required.
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-amber-500/10 border-l-4 border-amber-500 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Note:</strong> Embeds respect our privacy thresholds 
                and will only display data when n≥20 participants are represented.
              </p>
            </div>
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Anonymized quotes from Alberta educators. All identifying details have been generalized 
              to protect participant privacy.
            </p>

            <div className="space-y-4">
              {SAMPLE_QUOTES.map((quote, index) => (
                <div key={index} className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Quote className="size-5 text-primary flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <blockquote className="text-sm italic mb-2">
                        "{quote.text}"
                      </blockquote>
                      <p className="text-xs text-muted-foreground">
                        — {quote.attribution}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleCopyQuote(index, quote.text, quote.attribution)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {copiedQuote === index ? (
                      <>
                        <Check className="size-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-4" />
                        Copy Quote
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Button variant="outline" onClick={handleContactPress}>
                Request Additional Quotes
              </Button>
            </div>
          </TabsContent>

          {/* Data Access Tab */}
          <TabsContent value="data" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Access aggregated data for analysis and visualization in your reporting.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h5 className="font-semibold">Daily Aggregates (CSV)</h5>
                <p className="text-xs text-muted-foreground">
                  Daily signature counts, sentiment averages, and velocity metrics
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="size-4" />
                    Last 30 Days
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="size-4" />
                    All Time
                  </Button>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h5 className="font-semibold">Geographic Distribution (JSON)</h5>
                <p className="text-xs text-muted-foreground">
                  District-level aggregates (n≥20 threshold applied)
                </p>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="size-4" />
                  Download JSON
                </Button>
              </div>

              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h5 className="font-semibold">API Access</h5>
                <p className="text-xs text-muted-foreground">
                  Real-time API for live data integration
                </p>
                <Button variant="outline" size="sm" onClick={handleContactPress}>
                  Request API Key
                </Button>
              </div>

              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h5 className="font-semibold">Methodology Document</h5>
                <p className="text-xs text-muted-foreground">
                  Detailed explanation of data collection and privacy measures
                </p>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="size-4" />
                  Download PDF
                </Button>
              </div>
            </div>

            <div className="bg-blue-500/10 border-l-4 border-blue-500 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Privacy Commitment:</strong> All data exports respect 
                our n≥20 aggregation threshold. We never provide data that could identify individual participants.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Contact Info */}
        <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-lg p-4 border-l-4 border-primary">
          <h4 className="font-semibold text-sm mb-2">Media Contact</h4>
          <p className="text-sm text-muted-foreground mb-3">
            For interviews, additional information, or custom data requests:
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleContactPress} className="gap-2">
              <Mail className="size-4" />
              press@digitalstrike.ca
            </Button>
            <Button variant="outline">
              Download Full Press Kit (PDF)
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );
}
