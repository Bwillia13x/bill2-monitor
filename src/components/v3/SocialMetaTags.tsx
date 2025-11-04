import { Helmet } from "react-helmet-async";

interface SocialMetaTagsProps {
  title?: string;
  description?: string;
  meterValue?: number;
  image?: string;
  url?: string;
}

export function SocialMetaTags({
  title = "Digital Strike - Alberta Educators Standing Up",
  description = "Evidence-based, non-coordinative platform tracking educator dissatisfaction with the notwithstanding clause. Add your anonymous signal.",
  meterValue,
  image = "/og-image.png",
  url = typeof window !== 'undefined' ? window.location.href : '',
}: SocialMetaTagsProps) {
  // Dynamic title with meter value
  const dynamicTitle = meterValue 
    ? `Alberta Dissatisfaction: ${meterValue} — Add Yours | Digital Strike`
    : title;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{dynamicTitle}</title>
      <meta name="title" content={dynamicTitle} />
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={dynamicTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Digital Strike" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={dynamicTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#0a0a0a" />
      <meta name="keywords" content="Alberta, educators, teachers, Bill 2, notwithstanding clause, Charter rights, education, digital strike" />
      <meta name="author" content="Digital Strike" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
}
