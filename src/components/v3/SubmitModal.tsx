import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Shield, Lock } from "lucide-react";

interface SubmitModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: number, role?: string, region?: string) => void;
}

export function SubmitModal({ open, onClose, onSubmit }: SubmitModalProps) {
  const [sliderValue, setSliderValue] = useState([50]);
  const [role, setRole] = useState<string>();
  const [region, setRegion] = useState<string>();

  const handleSubmit = () => {
    onSubmit(sliderValue[0], role, region);
  };

  const getSliderLabel = (value: number) => {
    if (value === 0) return "No dissatisfaction";
    if (value <= 20) return "Minimal concern";
    if (value <= 40) return "Some concern";
    if (value <= 60) return "Significant concern";
    if (value <= 80) return "High dissatisfaction";
    if (value < 100) return "Severe dissatisfaction";
    return "Maximum dissatisfaction";
  };

  const getSliderColor = (value: number) => {
    if (value <= 33) return "#3b82f6"; // blue
    if (value <= 66) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md bg-gray-900 border-gray-700 text-gray-100"
        aria-describedby="submit-modal-description"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Add Your Anonymous Signal
          </DialogTitle>
        </DialogHeader>

        <div id="submit-modal-description" className="space-y-6 py-4">
          {/* Privacy notice */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm text-gray-300">
              <p className="font-medium text-blue-300 mb-1">Your signal is anonymous</p>
              <p className="text-gray-400">
                We only publish aggregates when groups meet our privacy threshold (n≥20). 
                Your individual response is never shared.
              </p>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-4">
            <label 
              htmlFor="dissatisfaction-slider"
              className="block text-sm font-medium text-gray-300"
            >
              How dissatisfied are you with the notwithstanding clause use?
            </label>
            
            <div className="space-y-3">
              {/* Current value display */}
              <div className="text-center">
                <div 
                  className="text-5xl font-bold tabular-nums mb-2"
                  style={{ color: getSliderColor(sliderValue[0]) }}
                  aria-live="polite"
                >
                  {sliderValue[0]}
                </div>
                <div className="text-sm text-gray-400">
                  {getSliderLabel(sliderValue[0])}
                </div>
              </div>

              {/* Slider input */}
              <Slider
                id="dissatisfaction-slider"
                value={sliderValue}
                onValueChange={setSliderValue}
                min={0}
                max={100}
                step={1}
                className="py-4"
                aria-label="Dissatisfaction level from 0 to 100"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={sliderValue[0]}
                aria-valuetext={`${sliderValue[0]}, ${getSliderLabel(sliderValue[0])}`}
              />

              {/* Anchor labels */}
              <div className="flex justify-between text-xs text-gray-500">
                <span>No dissatisfaction</span>
                <span>Maximum dissatisfaction</span>
              </div>
            </div>
          </div>

          {/* Optional metadata */}
          <details className="group">
            <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 flex items-center gap-2">
              <span>Optional: Add role & region (stored locally until threshold met)</span>
            </summary>
            
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="role-select" className="block text-sm font-medium text-gray-300 mb-2">
                  Role
                </label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role-select" className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select role (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="support-staff">Support Staff</SelectItem>
                    <SelectItem value="administrator">Administrator</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="region-select" className="block text-sm font-medium text-gray-300 mb-2">
                  Region
                </label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger id="region-select" className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select region (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="calgary">Calgary</SelectItem>
                    <SelectItem value="edmonton">Edmonton</SelectItem>
                    <SelectItem value="central">Central Alberta</SelectItem>
                    <SelectItem value="northern">Northern Alberta</SelectItem>
                    <SelectItem value="southern">Southern Alberta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </details>

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            className="w-full py-6 text-lg font-semibold rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
            }}
          >
            <Lock className="w-5 h-5 mr-2" aria-hidden="true" />
            Submit Signal
          </Button>

          {/* Footer note */}
          <p className="text-xs text-center text-gray-500">
            By submitting, you acknowledge this is evidence-based and non-coordinative
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
