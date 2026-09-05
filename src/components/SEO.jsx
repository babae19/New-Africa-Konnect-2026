import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords, image, url, type = 'website', schema }) => {
  const siteTitle = 'Africa Konnect';
  const defaultDescription = 'Africa Konnect connects global businesses with top vetting African tech talent. Hire software engineers, data scientists, and product managers remotely.';
  const defaultKeywords = 'Hire African Developers, Remote Tech Talent Africa, Vetted Software Engineers, Outsourcing Africa, Tech Talent Marketplace, Africa Konnect';
  const siteUrl = 'https://africakonnect.com/'; // Update with production URL
  const currentUrl = url || typeof window !== 'undefined' ? window.location.href : siteUrl;
  const metaDescription = description || defaultDescription;
  const metaKeywords = keywords || defaultKeywords;
  const metaImage = image ? `${siteUrl}${image}` : `${siteUrl}/assets/og-image.jpg`; // Ensure absolute path

  // Structured Data (JSON-LD)
  const structuredData = schema || {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Africa Konnect",
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "description": defaultDescription,
    "sameAs": [
      "https://twitter.com/africakonnect",
      "https://linkedin.com/company/africakonnect"
    ]
  };

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{title ? `${title} | ${siteTitle}` : `${siteTitle} - Hire Top African Tech Talent`}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <link rel="canonical" href={currentUrl} />
      <meta name="robots" content="index, follow" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={title || siteTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={currentUrl} />
      <meta property="twitter:title" content={title || siteTitle} />
      <meta property="twitter:description" content={metaDescription} />
      <meta property="twitter:image" content={metaImage} />
      <meta property="twitter:site" content="@africakonnect" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default SEO;
