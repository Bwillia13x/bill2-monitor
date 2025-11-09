import { useState, useEffect } from "react";
import { AlertTriangle, MapPin, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { checkGeoFence, GeoFenceCheck } from "@/lib/geolocation/ipGeolocation";

interface GeoFenceWarningProps {
  onContinue: () => void;
  onCancel: () => void;
}

export function GeoFenceWarning({ onContinue, onCancel }: GeoFenceWarningProps) {
  const [geoCheck, setGeoCheck] = useState<GeoFenceCheck | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkGeoFence().then(result => {
      setGeoCheck(result);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-gray-400">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
            Checking your location...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!geoCheck) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-yellow-400">
            <AlertTriangle className="w-5 h-5" />
            <span>Unable to verify location. You can still submit data.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If in Alberta, no warning needed
  if (geoCheck.is_alberta) {
    return null;
  }

  // Show warning for non-Alberta locations
  return (
    <Card className="bg-yellow-900/20 border-yellow-700">
      <CardHeader>
        <CardTitle className="text-yellow-300 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location Notice
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div className="space-y-2">
            <p className="text-yellow-200">
              <strong>Your location:</strong> {geoCheck.location}
            </p>
            <p className="text-yellow-200">
              This platform is designed for Alberta teachers only. Data from outside Alberta may be excluded from analysis.
            </p>
            {geoCheck.warning && (
              <p className="text-yellow-300 text-sm">{geoCheck.warning}</p>
            )}
          </div>
        </div>

        <div className="bg-yellow-950/30 rounded-lg p-3 border border-yellow-800">
          <div className="flex items-center gap-2 text-yellow-300 text-sm">
            <Shield className="w-4 h-4" />
            <span>Privacy Note: Location is checked for validation only and is not stored.</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={onContinue}
            variant="outline"
            className="flex-1 border-yellow-600 text-yellow-300 hover:bg-yellow-900/20"
          >
            Continue Anyway
          </Button>
          <Button 
            onClick={onCancel}
            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface GeoFenceStatusProps {
  className?: string;
}

export function GeoFenceStatus({ className = "" }: GeoFenceStatusProps) {
  const [geoCheck, setGeoCheck] = useState<GeoFenceCheck | null>(null);

  useEffect(() => {
    checkGeoFence().then(result => {
      setGeoCheck(result);
    });
  }, []);

  if (!geoCheck || geoCheck.is_alberta) {
    return null; // Don't show status if in Alberta
  }

  return (
    <div className={`text-xs text-yellow-400 bg-yellow-950/50 px-2 py-1 rounded ${className}`}>
      <div className="flex items-center gap-1">
        <MapPin className="w-3 h-3" />
        <span>Outside Alberta ({geoCheck.location})</span>
      </div>
    </div>
  );
}