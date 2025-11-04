import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Lock, BarChart3, AlertTriangle } from "lucide-react";

interface MethodologyModalProps {
  open: boolean;
  onClose: () => void;
}

export function MethodologyModal({ open, onClose }: MethodologyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-2xl bg-gray-900 border-gray-700 text-gray-100 max-h-[90vh] overflow-y-auto"
        aria-describedby="methodology-description"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Methodology & Privacy
          </DialogTitle>
        </DialogHeader>

        <div id="methodology-description" className="space-y-6 py-4">
          {/* Privacy Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-400">
              <Shield className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Privacy Protection</h3>
            </div>
            
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                <strong className="text-gray-200">What we store:</strong> We store only a dated, salted hash of your submission. 
                No names, emails, IP addresses, or personally identifiable information (PII) are collected or retained.
              </p>
              
              <p>
                <strong className="text-gray-200">K-anonymity principle:</strong> We display data <strong>only</strong> when 
                groups reach <strong>n≥20</strong> signals. This threshold prevents re-identification and aligns with 
                statistical disclosure control norms used by official statistics agencies.
              </p>
              
              <p>
                <strong className="text-gray-200">Rate limiting:</strong> We use coarse geofencing and rate limits 
                (per IP per 24h) to deter abuse, storing only hashed, truncated IP addresses for 24 hours.
              </p>
            </div>
          </div>

          {/* Data Display Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-400">
              <Lock className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Data Display Rules</h3>
            </div>
            
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                <strong className="text-gray-200">District unlocking:</strong> Districts appear on the map only after 
                receiving 20 or more signals. Until then, they remain "locked" to protect individual privacy.
              </p>
              
              <p>
                <strong className="text-gray-200">Aggregate data only:</strong> All statistics shown (meter value, velocity, 
                coverage) are aggregates across multiple participants. Individual responses are never displayed or shared.
              </p>
              
              <p>
                <strong className="text-gray-200">Small-cell suppression:</strong> If a district drops below the n≥20 threshold 
                due to data cleanup or validation, it is automatically re-locked.
              </p>
            </div>
          </div>

          {/* Non-Coordination Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Non-Coordinative Purpose</h3>
            </div>
            
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                <strong className="text-gray-200">Evidence collection:</strong> This site collects sentiment evidence and 
                public stories about working conditions. It does <strong>not</strong> plan, promote, or coordinate industrial action.
              </p>
              
              <p>
                <strong className="text-gray-200">Public accountability:</strong> The Digital Strike Meter serves as a 
                reference dashboard for journalists, researchers, and the public to understand educator sentiment regarding 
                the use of the notwithstanding clause in Bill 2.
              </p>
              
              <p>
                <strong className="text-gray-200">Legal context:</strong> Alberta's Back to School Act (Bill 2) prohibits 
                strike action through August 31, 2028. This site provides factual information about that deadline without 
                advocating for any specific action.
              </p>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-purple-400">
              <BarChart3 className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Analytics & Tracking</h3>
            </div>
            
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                <strong className="text-gray-200">Privacy-preserving analytics:</strong> We track only aggregate events 
                (signal submissions, shares, district unlocks) without user-level tracking or persistent identifiers.
              </p>
              
              <p>
                <strong className="text-gray-200">No cookies:</strong> This site does not use tracking cookies or 
                third-party analytics services that collect personal data.
              </p>
              
              <p>
                <strong className="text-gray-200">Daily aggregates only:</strong> All analytics are reported as daily 
                totals and averages, never as individual user journeys.
              </p>
            </div>
          </div>

          {/* Technical References */}
          <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
            <h4 className="text-sm font-semibold text-gray-200 mb-2">Technical References</h4>
            <ul className="space-y-1 text-xs text-gray-400">
              <li>
                • K-anonymity model:{" "}
                <a 
                  href="https://epic.org/wp-content/uploads/privacy/reidentification/Sweeney_Article.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Sweeney (2002)
                </a>
              </li>
              <li>
                • Statistical disclosure control: Statistics Canada, UK ONS guidelines
              </li>
              <li>
                • Bill 2 legal context:{" "}
                <a 
                  href="https://ablawg.ca/2025/10/30/back-to-school-notwithstanding-the-charter/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  ABLawg analysis
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="text-center text-sm text-gray-500">
            <p>
              Questions about our methodology or privacy practices?{" "}
              <a href="mailto:privacy@digitalstrike.ca" className="text-blue-400 hover:underline">
                Contact us
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
