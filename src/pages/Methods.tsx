import { useEffect, lazy, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { CCICalculation } from "@/components/methods/CCICalculation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, BarChart3, AlertTriangle, Clock, Globe, Database } from "lucide-react";

// Lazy load the heavy chart component
const BootstrapVisualizer = lazy(() => import("@/components/methods/BootstrapVisualizer").then(module => ({ default: module.BootstrapVisualizer })));

// Loading fallback for charts
const ChartLoader = () => (
  <div className="flex items-center justify-center p-12">
    <div className="text-center space-y-4">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
      <p className="text-sm text-muted-foreground">Loading visualization...</p>
    </div>
  </div>
);

export default function MethodsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>Methods v1.0 - Bill 2 Monitor</title>
        <meta name="description" content="Independent measurement methodology for teacher working conditions in Alberta. CCI formulas, bootstrap confidence intervals, and privacy protections." />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <Header />

        <main className="mx-auto max-w-6xl px-6 py-12">
          {/* Hero Section */}
          <section className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Methods v1.0
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Independent, methods-first measurement system for teacher working conditions in Alberta. 
              Transparent formulas, rigorous statistics, and privacy-by-design.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span className="bg-primary/10 px-3 py-1 rounded-full">📊 Statistical Rigor</span>
              <span className="bg-primary/10 px-3 py-1 rounded-full">🔒 Privacy First</span>
              <span className="bg-primary/10 px-3 py-1 rounded-full">📍 Alberta Only</span>
              <span className="bg-primary/10 px-3 py-1 rounded-full">⚖️ Independent</span>
            </div>
          </section>

          {/* CCI Formula Section */}
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-bold">Climate Conditions Index (CCI)</h2>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              <CCICalculation />
              
              <div className="space-y-6">
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">Formula</CardTitle>
                    <CardDescription className="text-gray-400">
                      Exact calculation method
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-black rounded-lg p-4 font-mono text-sm">
                      <div className="text-blue-400">CCI = 10 × (0.4 × S + 0.6 × (10 − E))</div>
                      <div className="text-gray-400 mt-2">where:</div>
                      <div className="text-white mt-1">S = job_satisfaction (1-10)</div>
                      <div className="text-white">E = work_exhaustion (1-10)</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">Components</CardTitle>
                    <CardDescription className="text-gray-400">
                      Weighted combination of two factors
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Job Satisfaction</span>
                      <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm">40% weight</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Work Exhaustion (inverted)</span>
                      <span className="bg-green-600 text-white px-2 py-1 rounded text-sm">60% weight</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-3">
                      Exhaustion is inverted (10 − E) because lower exhaustion is better
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">Scale Interpretation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-red-400">0-39</span>
                        <span className="text-gray-300">Challenging climate</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-yellow-400">40-59</span>
                        <span className="text-gray-300">Neutral climate</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-400">60-100</span>
                        <span className="text-gray-300">Positive climate</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-700 pt-2 mt-2">
                        <span className="text-blue-400">50</span>
                        <span className="text-gray-300">True neutral</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Bootstrap CI Section */}
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Database className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-bold">Bootstrap Confidence Intervals</h2>
            </div>
            
            <Suspense fallback={<ChartLoader />}>
              <BootstrapVisualizer />
            </Suspense>
            
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Why Bootstrap?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-300">
                  <p>We use bootstrap resampling because:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>No assumptions about data distribution</li>
                    <li>Works well with moderate sample sizes</li>
                    <li>Provides accurate uncertainty estimates</li>
                    <li>Standard method in official statistics</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Resamples (B)</span>
                    <span className="text-white font-mono">2000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Confidence Level</span>
                    <span className="text-white font-mono">95%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">CI Method</span>
                    <span className="text-white font-mono">Percentile</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Suppression Threshold</span>
                    <span className="text-red-400 font-mono">n &lt; 20</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Privacy Section */}
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-bold">Privacy Protections</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    k-Anonymity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-300">
                  <p><strong>n≥20 Rule:</strong> Data only published when groups have ≥20 participants</p>
                  <p className="text-xs text-gray-500">Prevents re-identification of individual teachers</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Geo-fuzzing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-300">
                  <p><strong>2km radius:</strong> All coordinates randomized before storage</p>
                  <p className="text-xs text-gray-500">Original location never stored or transmitted</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Tenure Buckets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-300">
                  <p><strong>Coarse categories:</strong> 0-5, 6-15, 16+ years only</p>
                  <p className="text-xs text-gray-500">Exact years never collected or stored</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Auto-suppression
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-300">
                  <p><strong>Rare combos:</strong> Automatically aggregate up when n&lt;20</p>
                  <p className="text-xs text-gray-500">District → District+Tenure → District only</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Retention
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-300">
                  <p><strong>90 days:</strong> Raw stories deleted after 90 days</p>
                  <p className="text-xs text-gray-500">Only themed bundles persist long-term</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    No PII
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-300">
                  <p><strong>Anonymous:</strong> No names, emails, or IDs collected</p>
                  <p className="text-xs text-gray-500">Device hashes salted and rotated</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Update Cadence Section */}
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-bold">Update Cadence</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Daily</CardTitle>
                  <CardDescription className="text-gray-400">
                    6:00 AM Mountain Time
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-300">
                  <p>• CCI aggregates updated</p>
                  <p>• District counts refreshed</p>
                  <p>• New signals processed</p>
                  <p>• Event log extended</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Weekly</CardTitle>
                  <CardDescription className="text-gray-400">
                    Monday 6:00 AM Mountain Time
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-300">
                  <p>• Weekly snapshot generated</p>
                  <p>• CSV + codebook published</p>
                  <p>• Press brief created</p>
                  <p>• Journalists notified</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Monthly</CardTitle>
                  <CardDescription className="text-gray-400">
                    First Monday of month
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-300">
                  <p>• Methodology review</p>
                  <p>• Bias assessment</p>
                  <p>• Advisory board consultation</p>
                  <p>• Publication of learnings</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Bias Disclaimer Section */}
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h2 className="text-3xl font-bold">Limitations & Bias</h2>
            </div>

            <Card className="bg-yellow-900/20 border-yellow-700">
              <CardHeader>
                <CardTitle className="text-xl text-yellow-300">Important Disclaimer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-yellow-200">
                  <p className="font-semibold mb-2">Convenience Sample</p>
                  <p className="text-sm">
                    This is a convenience sample, not a random sample. Participants self-select, 
                    which may introduce bias. Interpret results as a <strong>lower bound</strong> of actual conditions.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm text-yellow-200">
                  <div>
                    <p className="font-semibold mb-1">Potential Biases:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Self-selection bias</li>
                      <li>Digital divide (internet access)</li>
                      <li>Geographic concentration</li>
                      <li>Temporal bias (time of day/week)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Mitigations:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Large sample sizes</li>
                      <li>Transparency about methods</li>
                      <li>Independent oversight</li>
                      <li>Multiple data sources</li>
                    </ul>
                  </div>
                </div>

                <div className="border-t border-yellow-700 pt-4">
                  <p className="text-sm text-yellow-300">
                    <strong>Recommendation:</strong> Use these data as one input among many 
                    when assessing teacher working conditions. Triangulate with other sources 
                    and professional judgment.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Contact Section */}
          <section className="text-center">
            <h2 className="text-2xl font-bold mb-4">Questions?</h2>
            <p className="text-muted-foreground mb-6">
              Our methodology is open for review and improvement.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="mailto:methods@bill2monitor.ca" className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                Email Methodology Team
              </a>
              <a href="/advisory-board" className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors border border-gray-600">
                View Advisory Board
              </a>
              <a href="/snapshots/latest/aggregates.csv" className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors border border-gray-600">
                Download Raw Data
              </a>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-800 py-8 mt-16">
          <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
            <p>Bill 2 Monitor - Independent Teacher Working Conditions Index (Alberta)</p>
            <p className="mt-2">Last updated: {new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="mt-2">Version 1.0 | Methods subject to monthly review</p>
          </div>
        </footer>
      </div>
    </>
  );
}