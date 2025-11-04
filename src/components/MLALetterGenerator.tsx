import { useState } from "react";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Mail, Copy, Check } from "lucide-react";
import { toast } from "sonner";

// Mock MLA data - in production, this would come from a database
const ALBERTA_MLAS = [
  { riding: "Edmonton-Centre", name: "Hon. David Shepherd", email: "edmonton.centre@assembly.ab.ca" },
  { riding: "Calgary-Buffalo", name: "Hon. Joe Ceci", email: "calgary.buffalo@assembly.ab.ca" },
  { riding: "Edmonton-Strathcona", name: "Rakhi Pancholi", email: "edmonton.strathcona@assembly.ab.ca" },
  { riding: "Calgary-Mountain View", name: "Kathleen Ganley", email: "calgary.mountainview@assembly.ab.ca" },
  { riding: "Edmonton-Highlands-Norwood", name: "Janis Irwin", email: "edmonton.highlandsnorwood@assembly.ab.ca" },
  // Add more MLAs as needed
];

const LETTER_TEMPLATE = `Dear [MLA_NAME],

I am writing to you as an educator in Alberta to express my deep concern about the use of the notwithstanding clause to override Charter rights in matters affecting education and collective bargaining.

As someone who has dedicated my career to serving Alberta's students and communities, I believe that suspending fundamental Charter rights sets a dangerous precedent that affects not only educators but all Albertans. The Charter of Rights and Freedoms exists to protect us all, and its use should not be taken lightly.

[PERSONAL_STORY]

I am one of [SIGNATURE_COUNT] Alberta educators who have anonymously expressed concern through the Digital Strike platform. This represents a significant portion of our education community, and our collective voice deserves to be heard.

I respectfully urge you to:

1. Advocate against the use of the notwithstanding clause in education-related matters
2. Support fair and respectful collective bargaining processes
3. Recognize the vital role educators play in Alberta's future
4. Protect Charter rights for all Albertans

I would appreciate the opportunity to discuss this matter further and to hear your position on this important issue.

Thank you for your attention to this matter and for your service to our community.

Sincerely,
[YOUR_NAME]
[YOUR_CONTACT]`;

export function MLALetterGenerator() {
  const [selectedRiding, setSelectedRiding] = useState("");
  const [yourName, setYourName] = useState("");
  const [yourEmail, setYourEmail] = useState("");
  const [personalStory, setPersonalStory] = useState("");
  const [includeStats, setIncludeStats] = useState(true);
  const [copied, setCopied] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState("");

  const selectedMLA = ALBERTA_MLAS.find(mla => mla.riding === selectedRiding);
  const signatureCount = 145; // Mock count - would be dynamic in production

  const generateLetter = () => {
    if (!selectedRiding || !yourName) {
      toast.error("Please fill in required fields");
      return;
    }

    let letter = LETTER_TEMPLATE
      .replace("[MLA_NAME]", selectedMLA?.name || "")
      .replace("[YOUR_NAME]", yourName)
      .replace("[YOUR_CONTACT]", yourEmail || "");

    if (personalStory.trim()) {
      letter = letter.replace("[PERSONAL_STORY]", personalStory);
    } else {
      letter = letter.replace("[PERSONAL_STORY]", "The notwithstanding clause affects my ability to serve my students effectively and undermines the democratic principles I teach in my classroom.");
    }

    if (includeStats) {
      letter = letter.replace("[SIGNATURE_COUNT]", signatureCount.toLocaleString());
    } else {
      letter = letter.replace("I am one of [SIGNATURE_COUNT] Alberta educators who have anonymously expressed concern through the Digital Strike platform. This represents a significant portion of our education community, and our collective voice deserves to be heard.\n\n", "");
    }

    setGeneratedLetter(letter);
    toast.success("Letter generated successfully!");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLetter);
      setCopied(true);
      toast.success("Letter copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy letter");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedLetter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `letter-to-${selectedRiding.toLowerCase().replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Letter downloaded!");
  };

  const handleEmail = () => {
    if (!selectedMLA) return;
    
    const subject = encodeURIComponent("Concerns About the Notwithstanding Clause in Education");
    const body = encodeURIComponent(generatedLetter);
    window.location.href = `mailto:${selectedMLA.email}?subject=${subject}&body=${body}`;
  };

  return (
    <Panel className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            Letter to Your MLA
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Generate a personalized letter to your Member of the Legislative Assembly
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-500/10 border-l-4 border-blue-500 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Important:</strong> This tool helps you draft a letter, but you must review and send it yourself. 
            We never send letters on your behalf without your explicit confirmation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="riding">Your Riding *</Label>
              <Select value={selectedRiding} onValueChange={setSelectedRiding}>
                <SelectTrigger id="riding">
                  <SelectValue placeholder="Select your riding" />
                </SelectTrigger>
                <SelectContent>
                  {ALBERTA_MLAS.map((mla) => (
                    <SelectItem key={mla.riding} value={mla.riding}>
                      {mla.riding} - {mla.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMLA && (
                <p className="text-xs text-muted-foreground">
                  MLA: {selectedMLA.name} ({selectedMLA.email})
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Your Name *</Label>
              <Input
                id="name"
                value={yourName}
                onChange={(e) => setYourName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Your Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={yourEmail}
                onChange={(e) => setYourEmail(e.target.value)}
                placeholder="your.email@example.com"
              />
              <p className="text-xs text-muted-foreground">
                Include if you'd like your MLA to respond
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="story">Personal Story (optional)</Label>
              <Textarea
                id="story"
                value={personalStory}
                onChange={(e) => setPersonalStory(e.target.value)}
                placeholder="Share how the notwithstanding clause affects you personally..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Personal stories make your letter more impactful
              </p>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="stats"
                checked={includeStats}
                onCheckedChange={(checked) => setIncludeStats(checked === true)}
                className="mt-1"
              />
              <label htmlFor="stats" className="text-sm cursor-pointer">
                Include statistics from Digital Strike (shows collective voice of {signatureCount.toLocaleString()} educators)
              </label>
            </div>

            <Button
              onClick={generateLetter}
              className="w-full"
              size="lg"
              disabled={!selectedRiding || !yourName}
            >
              Generate Letter
            </Button>
          </div>

          {/* Preview/Output */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Letter Preview</Label>
              <div className="bg-muted/30 rounded-lg p-4 min-h-[400px] max-h-[500px] overflow-y-auto">
                {generatedLetter ? (
                  <pre className="text-sm whitespace-pre-wrap font-sans text-foreground">
                    {generatedLetter}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Fill in the form and click "Generate Letter" to see your personalized letter here
                  </div>
                )}
              </div>
            </div>

            {generatedLetter && (
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="size-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Download className="size-4" />
                  Download
                </Button>
                <Button
                  onClick={handleEmail}
                  className="flex-1 gap-2"
                >
                  <Mail className="size-4" />
                  Send via Email
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2">Tips for Effective Letters</h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Be respectful and professional in tone</li>
            <li>Include personal experiences to make your letter memorable</li>
            <li>Be specific about what actions you want your MLA to take</li>
            <li>Keep it concise - aim for one page</li>
            <li>Follow up if you don't receive a response within 2 weeks</li>
            <li>Consider sending a physical letter in addition to email for greater impact</li>
          </ul>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground text-center border-t border-border pt-4">
          This tool generates a draft letter for your review. You are responsible for reviewing, 
          editing, and sending the letter. Digital Strike does not send letters on your behalf.
        </div>
      </div>
    </Panel>
  );
}
