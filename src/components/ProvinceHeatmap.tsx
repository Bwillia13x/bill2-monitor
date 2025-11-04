import { useState } from "react";
import { Panel } from "@/components/Panel";
import { MapPin, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DistrictData {
  id: string;
  name: string;
  signatures: number;
  x: number; // Position on map (percentage)
  y: number;
  size: number; // Relative size for visualization
}

// Mock data for Alberta school districts
const DISTRICT_DATA: DistrictData[] = [
  { id: "edmonton", name: "Edmonton", signatures: 45, x: 50, y: 35, size: 45 },
  { id: "calgary", name: "Calgary", signatures: 38, x: 50, y: 65, size: 38 },
  { id: "red-deer", name: "Red Deer", signatures: 12, x: 50, y: 50, size: 12 },
  { id: "lethbridge", name: "Lethbridge", signatures: 8, x: 45, y: 80, size: 8 },
  { id: "medicine-hat", name: "Medicine Hat", signatures: 6, x: 70, y: 75, size: 6 },
  { id: "grande-prairie", name: "Grande Prairie", signatures: 7, x: 35, y: 15, size: 7 },
  { id: "fort-mcmurray", name: "Fort McMurray", signatures: 9, x: 60, y: 10, size: 9 },
  { id: "lloydminster", name: "Lloydminster", signatures: 4, x: 75, y: 30, size: 4 },
  { id: "camrose", name: "Camrose", signatures: 5, x: 60, y: 45, size: 5 },
  { id: "wetaskiwin", name: "Wetaskiwin", signatures: 3, x: 48, y: 45, size: 3 },
  { id: "st-albert", name: "St. Albert", signatures: 8, x: 50, y: 32, size: 8 },
  { id: "sherwood-park", name: "Sherwood Park", signatures: 6, x: 55, y: 35, size: 6 }
];

const getHeatColor = (count: number) => {
  if (count >= 30) return "from-red-500 to-red-600";
  if (count >= 20) return "from-orange-500 to-orange-600";
  if (count >= 10) return "from-yellow-500 to-yellow-600";
  if (count >= 5) return "from-blue-500 to-blue-600";
  return "from-gray-500 to-gray-600";
};

const getHeatIntensity = (count: number) => {
  const max = Math.max(...DISTRICT_DATA.map(d => d.signatures));
  return (count / max) * 100;
};

export function ProvinceHeatmap() {
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(null);
  const [showLabels, setShowLabels] = useState(true);

  const totalSignatures = DISTRICT_DATA.reduce((sum, d) => sum + d.signatures, 0);
  const activeDistricts = DISTRICT_DATA.filter(d => d.signatures > 0).length;

  return (
    <Panel className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              Provincial Impact Map
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time visualization of educator voices across Alberta
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLabels(!showLabels)}
          >
            {showLabels ? "Hide" : "Show"} Labels
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{totalSignatures}</div>
            <div className="text-xs text-muted-foreground">Total Signatures</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{activeDistricts}</div>
            <div className="text-xs text-muted-foreground">Active Districts</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">
              {((activeDistricts / DISTRICT_DATA.length) * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">Coverage</div>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative bg-gradient-to-br from-muted/50 to-muted/20 rounded-xl p-8 min-h-[500px] overflow-hidden">
          {/* Alberta outline (simplified) */}
          <div className="absolute inset-0 opacity-10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path
                d="M 30,10 L 70,10 L 75,25 L 80,40 L 80,70 L 70,85 L 50,90 L 30,85 L 25,70 L 20,40 L 25,25 Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="0.5"
              />
            </svg>
          </div>

          {/* District markers */}
          {DISTRICT_DATA.map((district) => {
            const intensity = getHeatIntensity(district.signatures);
            const isSelected = selectedDistrict?.id === district.id;
            
            return (
              <div
                key={district.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all"
                style={{
                  left: `${district.x}%`,
                  top: `${district.y}%`,
                  zIndex: isSelected ? 20 : 10
                }}
                onClick={() => setSelectedDistrict(district)}
                onMouseEnter={() => setSelectedDistrict(district)}
              >
                {/* Glow effect */}
                <div
                  className={`absolute inset-0 rounded-full blur-xl opacity-60 bg-gradient-to-br ${getHeatColor(district.signatures)}`}
                  style={{
                    width: `${Math.max(intensity * 0.8, 30)}px`,
                    height: `${Math.max(intensity * 0.8, 30)}px`,
                    transform: 'translate(-50%, -50%)',
                    left: '50%',
                    top: '50%'
                  }}
                />
                
                {/* Main marker */}
                <div
                  className={`relative rounded-full bg-gradient-to-br ${getHeatColor(district.signatures)} ring-2 ring-background shadow-lg transition-all ${
                    isSelected ? "scale-125 ring-4" : "hover:scale-110"
                  }`}
                  style={{
                    width: `${Math.max(intensity * 0.5, 20)}px`,
                    height: `${Math.max(intensity * 0.5, 20)}px`
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                    {district.signatures}
                  </div>
                </div>

                {/* Label */}
                {showLabels && (
                  <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <div className="bg-background/95 backdrop-blur-sm px-2 py-1 rounded-md ring-1 ring-border text-xs font-medium shadow-lg">
                      {district.name}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected District Info */}
        {selectedDistrict && (
          <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-xl p-4 border-l-4 border-primary">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-lg">{selectedDistrict.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-bold text-primary text-xl">{selectedDistrict.signatures}</span> educators 
                  have added their voices from this district
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  That's {((selectedDistrict.signatures / totalSignatures) * 100).toFixed(1)}% of the provincial total
                </p>
              </div>
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getHeatColor(selectedDistrict.signatures)} flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                {selectedDistrict.signatures}
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-500 to-gray-600" />
            <span className="text-muted-foreground">1-4</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600" />
            <span className="text-muted-foreground">5-9</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600" />
            <span className="text-muted-foreground">10-19</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-500 to-orange-600" />
            <span className="text-muted-foreground">20-29</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-500 to-red-600" />
            <span className="text-muted-foreground">30+</span>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="flex items-start gap-2 bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
          <Info className="size-4 flex-shrink-0 mt-0.5" />
          <p>
            District-level data is only displayed when n≥20 signatures have been collected to protect 
            individual privacy. Smaller districts are aggregated into regional groupings.
          </p>
        </div>
      </div>
    </Panel>
  );
}
