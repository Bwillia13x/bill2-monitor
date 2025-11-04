import { useState } from "react";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, Send, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface StoryFormData {
  story: string;
  role: string;
  yearsOfService: string;
  region: string;
  consent: boolean;
}

const ROLES = [
  "Elementary Teacher",
  "Middle School Teacher",
  "High School Teacher",
  "Special Education Teacher",
  "ESL Teacher",
  "Counselor",
  "Administrator",
  "Support Staff",
  "Other"
];

const REGIONS = [
  "Edmonton area",
  "Calgary area",
  "Red Deer area",
  "Lethbridge area",
  "Medicine Hat area",
  "Grande Prairie area",
  "Fort McMurray area",
  "Rural Alberta",
  "Prefer not to say"
];

const YEARS_OPTIONS = [
  "0-5 years",
  "6-10 years",
  "11-15 years",
  "16-20 years",
  "21-25 years",
  "26+ years"
];

export function StorySubmission() {
  const [formData, setFormData] = useState<StoryFormData>({
    story: "",
    role: "",
    yearsOfService: "",
    region: "",
    consent: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const wordCount = formData.story.trim().split(/\s+/).filter(w => w.length > 0).length;
  const isValid = formData.story.trim().length >= 50 && formData.consent && wordCount <= 200;

  const handleSubmit = async () => {
    if (!isValid) {
      toast.error("Please complete all required fields");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success("Your story has been submitted for review!");
    }, 1500);
  };

  const handleReset = () => {
    setFormData({
      story: "",
      role: "",
      yearsOfService: "",
      region: "",
      consent: false
    });
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <Panel className="p-6">
        <div className="text-center space-y-6 py-8">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="size-8 text-green-500" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Thank You for Sharing Your Story</h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Your submission has been received and will be reviewed by our team. If approved, 
              it will be anonymized and featured to help humanize the movement.
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 max-w-xl mx-auto text-left">
            <h4 className="font-semibold text-sm mb-2">What happens next?</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>Our team will review your story within 48 hours</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>All identifying details will be generalized to protect your privacy</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>Approved stories will appear in the Story Carousel on the homepage</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>Your story may be shared with media (anonymously) to amplify educator voices</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3 justify-center">
            <Button onClick={handleReset} variant="outline">
              Submit Another Story
            </Button>
            <Button onClick={() => window.location.href = "/"}>
              Return to Homepage
            </Button>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            Share Your Story
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Help humanize the movement by sharing how the notwithstanding clause affects you
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-500/10 border-l-4 border-blue-500 rounded-lg p-4 flex items-start gap-3">
          <Shield className="size-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Your Privacy is Protected</p>
            <p className="text-muted-foreground">
              All stories are anonymized before publication. We remove or generalize any identifying 
              details including names, specific schools, and unique circumstances. Your story will be 
              attributed only with general information (role, years of service, region).
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Story Text */}
          <div className="space-y-2">
            <Label htmlFor="story">
              Your Story * 
              <span className="text-muted-foreground font-normal ml-2">
                ({wordCount}/200 words)
              </span>
            </Label>
            <Textarea
              id="story"
              value={formData.story}
              onChange={(e) => setFormData({ ...formData, story: e.target.value })}
              placeholder="Share your experience... How does the notwithstanding clause affect you, your students, or your community? What concerns do you have about Charter rights in education?"
              rows={8}
              className="resize-none"
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Minimum 50 words, maximum 200 words
              </span>
              {wordCount > 200 && (
                <span className="text-red-500 flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  Too long
                </span>
              )}
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Your Role (optional)</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Years of Service */}
          <div className="space-y-2">
            <Label htmlFor="years">Years of Service (optional)</Label>
            <Select value={formData.yearsOfService} onValueChange={(value) => setFormData({ ...formData, yearsOfService: value })}>
              <SelectTrigger id="years">
                <SelectValue placeholder="Select years of service" />
              </SelectTrigger>
              <SelectContent>
                {YEARS_OPTIONS.map((years) => (
                  <SelectItem key={years} value={years}>
                    {years}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Region */}
          <div className="space-y-2">
            <Label htmlFor="region">Region (optional)</Label>
            <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
              <SelectTrigger id="region">
                <SelectValue placeholder="Select your region" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Consent */}
          <div className="flex items-start gap-3 bg-muted/30 rounded-lg p-4">
            <Checkbox
              id="consent"
              checked={formData.consent}
              onCheckedChange={(checked) => setFormData({ ...formData, consent: checked === true })}
              className="mt-1"
            />
            <label htmlFor="consent" className="text-sm cursor-pointer leading-relaxed">
              I understand that my story will be anonymized and may be used in the Story Carousel, 
              shared with media, or included in advocacy materials. I confirm that I have not included 
              any identifying information about students or colleagues. *
            </label>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                <Send className="size-4 mr-2" />
                Submit Story for Review
              </>
            )}
          </Button>
        </div>

        {/* Guidelines */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2">Story Guidelines</h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span>Focus on how the notwithstanding clause affects you personally</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span>Be honest and authentic - personal stories are most impactful</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span>Avoid naming specific individuals, schools, or districts</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span>Keep language professional and respectful</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span>Stories are reviewed to ensure they align with the movement's lawful, non-coordinating nature</span>
            </li>
          </ul>
        </div>
      </div>
    </Panel>
  );
}
