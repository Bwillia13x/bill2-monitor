// Device fingerprinting for rate limiting and fraud prevention

interface FingerprintComponents {
  userAgent: string;
  language: string;
  timezone: string;
  screenResolution: string;
  colorDepth: string;
  platform: string;
  canvasHash?: string;
  webglHash?: string;
  audioHash?: string;
}

async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    canvas.width = 200;
    canvas.height = 50;
    
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 200, 50);
    
    ctx.font = '18pt Arial';
    ctx.fillStyle = '#333';
    ctx.fillText('Civic Data Platform', 10, 35);
    
    return canvas.toDataURL();
  } catch {
    return '';
  }
}

function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';
    
    const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      return `${vendor}~${renderer}`;
    }
    return '';
  } catch {
    return '';
  }
}

function getAudioFingerprint(): string {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const compressor = audioContext.createDynamicsCompressor();
    oscillator.connect(compressor);
    
    const fingerprint = `${compressor.threshold.value}-${compressor.knee.value}-${compressor.ratio.value}`;
    audioContext.close();
    
    return fingerprint;
  } catch {
    return '';
  }
}

export async function getDeviceHash(): Promise<string> {
  const components: FingerprintComponents = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth?.toString() || '',
    platform: navigator.platform,
  };
  
  // Add advanced fingerprinting if available
  components.canvasHash = getCanvasFingerprint();
  components.webglHash = getWebGLFingerprint();
  components.audioHash = getAudioFingerprint();
  
  const fingerprintString = Object.entries(components)
    .filter(([_, value]) => value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
  
  return hashString(fingerprintString);
}

export async function getASNIdentifier(): Promise<string> {
  try {
    // This would ideally call an IP geolocation service
    // For now, return a hash of the IP (if available) or use a placeholder
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return hashString(data.ip || 'unknown');
  } catch {
    // Fallback: hash a combination of network-related properties
    const networkInfo = `${navigator.connection?.effectiveType || ''}-${navigator.connection?.rtt || ''}`;
    return hashString(networkInfo || 'fallback-asn');
  }
}

export async function getRateLimitIdentifiers(): Promise<{
  deviceHash: string;
  asnIdentifier: string;
}> {
  const [deviceHash, asnIdentifier] = await Promise.all([
    getDeviceHash(),
    getASNIdentifier(),
  ]);
  
  return { deviceHash, asnIdentifier };
}