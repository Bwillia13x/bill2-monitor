import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

interface CCICalculationProps {
  satisfaction?: number;
  exhaustion?: number;
}

export function CCICalculation({ satisfaction = 5, exhaustion = 5 }: CCICalculationProps) {
  const [sat, setSat] = useState([satisfaction]);
  const [exh, setExh] = useState([exhaustion]);

  // CCI = 10 × (0.4 × job_satisfaction + 0.6 × (10 − work_exhaustion))
  const calculateCCI = (s: number, e: number): number => {
    return 10 * (0.4 * s + 0.6 * (10 - e));
  };

  const cci = calculateCCI(sat[0], exh[0]);
  
  const getCCIColor = (value: number) => {
    if (value >= 60) return "text-green-500";
    if (value >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  const getCCILabel = (value: number) => {
    if (value >= 60) return "Positive Climate";
    if (value >= 40) return "Neutral Climate";
    return "Challenging Climate";
  };

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-2xl text-white">CCI Calculation Formula</CardTitle>
        <CardDescription className="text-gray-400">
          Climate Conditions Index = 10 × (0.4 × job_satisfaction + 0.6 × (10 − work_exhaustion))
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300">
              Job Satisfaction (1-10): <span className="text-white">{sat[0]}</span>
            </label>
            <Slider
              value={sat}
              onValueChange={setSat}
              min={1}
              max={10}
              step={0.1}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Very Dissatisfied</span>
              <span>Very Satisfied</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300">
              Work Exhaustion (1-10): <span className="text-white">{exh[0]}</span>
            </label>
            <Slider
              value={exh}
              onValueChange={setExh}
              min={1}
              max={10}
              step={0.1}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Not Exhausted</span>
              <span>Completely Exhausted</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <div className="text-center">
            <div className={`text-5xl font-bold ${getCCIColor(cci)}`}>
              {cci.toFixed(1)}
            </div>
            <div className="text-lg text-gray-300 mt-2">
              {getCCILabel(cci)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Range: 0-100 (50 = Neutral)
            </div>
          </div>
        </div>

        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
          <h4 className="font-semibold text-blue-300 mb-2">How to read CCI:</h4>
          <ul className="text-sm text-blue-200 space-y-1">
            <li>• <strong>0-39:</strong> Challenging climate - significant concerns</li>
            <li>• <strong>40-59:</strong> Neutral climate - mixed conditions</li>
            <li>• <strong>60-100:</strong> Positive climate - favorable conditions</li>
            <li>• <strong>50:</strong> True neutral - balanced positive/negative</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}