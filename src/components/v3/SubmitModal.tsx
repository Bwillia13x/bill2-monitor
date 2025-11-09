import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Shield, Lock, TrendingUp, Minus, TrendingDown } from "lucide-react";
import { GeoFenceWarning } from "@/components/geolocation/GeoFenceWarning";
import { checkGeoFence } from "@/lib/geolocation/ipGeolocation";

type WeeklyComparison = 'better' | 'same' | 'worse';

interface SubmitModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    weeklyComparison: WeeklyComparison;
    satisfaction: number;
    exhaustion: number;
    role?: string;
    district?: string;
  }) => void;
}

export function SubmitModal({ open, onClose, onSubmit }: SubmitModalProps) {
  const [weeklyComparison, setWeeklyComparison] = useState<WeeklyComparison>('same');
  const [satisfaction, setSatisfaction] = useState([5]);
  const [exhaustion, setExhaustion] = useState([5]);
  const [role, setRole] = useState<string>();
  const [district, setDistrict] = useState<string>();
  const [geoCheck, setGeoCheck] = useState<any>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [showGeoWarning, setShowGeoWarning] = useState(false);

  // Check location when modal opens
  useEffect(() => {
    if (open) {
      setGeoLoading(true);
      checkGeoFence().then(result => {
        setGeoCheck(result);
        setGeoLoading(false);
        // Show warning if not in Alberta
        if (result && !result.is_alberta) {
          setShowGeoWarning(true);
        }
      });
    } else {
      // Reset when modal closes
      setShowGeoWarning(false);
      setGeoCheck(null);
    }
  }, [open]);

  const handleSubmit = () => {
    onSubmit({
      weeklyComparison,
      satisfaction: satisfaction[0],
      exhaustion: exhaustion[0],
      role,
      district,
    });
  };

  const handleContinueAnyway = () => {
    setShowGeoWarning(false);
  };

  const getComparisonColor = (comparison: WeeklyComparison) => {
    if (comparison === 'better') return 'border-blue-500 bg-blue-500/10';
    if (comparison === 'worse') return 'border-red-500 bg-red-500/10';
    return 'border-amber-500 bg-amber-500/10';
  };

  const getScaleColor = (value: number, isExhaustion = false) => {
    if (isExhaustion) {
      // Higher exhaustion = worse (red)
      if (value >= 7) return "#ef4444";
      if (value >= 4) return "#f59e0b";
      return "#3b82f6";
    }
    // Higher satisfaction = better (blue)
    if (value >= 7) return "#3b82f6";
    if (value >= 4) return "#f59e0b";
    return "#ef4444";
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
              <p className="font-medium text-blue-300 mb-1">100% Anonymous</p>
              <p className="text-gray-400">
                We only publish aggregates when n≥20. Your response is never individually identifiable.
              </p>
            </div>
          </div>

          {/* Geo-fence warning */}
          {showGeoWarning && geoCheck && !geoCheck.is_alberta && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300">
                <p className="font-medium text-yellow-300 mb-1">Location Notice</p>
                <p className="text-gray-400 mb-2">
                  <strong>Your location:</strong> {geoCheck.location}
                </p>
                <p className="text-gray-400 mb-2">
                  This platform is for Alberta teachers. Data from outside Alberta may be excluded.
                </p>
                {geoCheck.warning && (
                  <p className="text-yellow-300 text-xs">{geoCheck.warning}</p>
                )}
              </div>
            </div>
          )}

          {/* Q1: Weekly Comparison */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Compared with last week, your classroom conditions are:
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setWeeklyComparison('better')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  weeklyComparison === 'better'
                    ? getComparisonColor('better')
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                <div className="text-sm font-medium">Better</div>
              </button>
              <button
                type="button"
                onClick={() => setWeeklyComparison('same')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  weeklyComparison === 'same'
                    ? getComparisonColor('same')
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <Minus className="w-6 h-6 mx-auto mb-2 text-amber-400" />
                <div className="text-sm font-medium">Same</div>
              </button>
              <button
                type="button"
                onClick={() => setWeeklyComparison('worse')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  weeklyComparison === 'worse'
                    ? getComparisonColor('worse')
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <TrendingDown className="w-6 h-6 mx-auto mb-2 text-red-400" />
                <div className="text-sm font-medium">Worse</div>
              </button>
            </div>
          </div>

          {/* Q2: Satisfaction */}
          <div className="space-y-3">
            <label htmlFor="satisfaction-slider" className="block text-sm font-medium text-gray-300">
              Overall job satisfaction today:
            </label>
            <div className="space-y-2">
              <div className="text-center">
                <div
                  className="text-4xl font-bold tabular-nums"
                  style={{ color: getScaleColor(satisfaction[0], false) }}
                  aria-live="polite"
                >
                  {satisfaction[0]}/10
                </div>
              </div>
              <Slider
                id="satisfaction-slider"
                value={satisfaction}
                onValueChange={setSatisfaction}
                min={0}
                max={10}
                step={1}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Very dissatisfied</span>
                <span>Very satisfied</span>
              </div>
            </div>
          </div>

          {/* Q3: Exhaustion */}
          <div className="space-y-3">
            <label htmlFor="exhaustion-slider" className="block text-sm font-medium text-gray-300">
              Emotional exhaustion today:
            </label>
            <div className="space-y-2">
              <div className="text-center">
                <div
                  className="text-4xl font-bold tabular-nums"
                  style={{ color: getScaleColor(exhaustion[0], true) }}
                  aria-live="polite"
                >
                  {exhaustion[0]}/10
                </div>
              </div>
              <Slider
                id="exhaustion-slider"
                value={exhaustion}
                onValueChange={setExhaustion}
                min={0}
                max={10}
                step={1}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Not at all exhausted</span>
                <span>Completely exhausted</span>
              </div>
            </div>
          </div>

          {/* Optional metadata */}
          <details className="group">
            <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 flex items-center gap-2">
              <span>Optional: Add role & district (helps with breakdowns when n≥20)</span>
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
                    <SelectItem value="Teacher">Teacher</SelectItem>
                    <SelectItem value="EA">Educational Assistant</SelectItem>
                    <SelectItem value="Admin">Administrator</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="district-select" className="block text-sm font-medium text-gray-300 mb-2">
                  District
                </label>
                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger id="district-select" className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select district (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="Calgary 1">Calgary 1</SelectItem>
                    <SelectItem value="Calgary 2">Calgary 2</SelectItem>
                    <SelectItem value="Edmonton 1">Edmonton 1</SelectItem>
                    <SelectItem value="Edmonton 2">Edmonton 2</SelectItem>
                    <SelectItem value="Red Deer">Red Deer</SelectItem>
                    <SelectItem value="Lethbridge">Lethbridge</SelectItem>
                    <SelectItem value="Medicine Hat">Medicine Hat</SelectItem>
                    <SelectItem value="Grande Prairie">Grande Prairie</SelectItem>
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
            Takes ~1 minute • Privacy-safe • Non-coordinative
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
