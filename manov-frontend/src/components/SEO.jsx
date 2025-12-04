import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, image, type = 'website' }) => {
    const siteName = 'Manov';
    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    const defaultDescription = 'Read your favorite novels with AI-powered translations.';
    const metaDescription = description || defaultDescription;

    // Use a default image if none provided (you might want to add a real og-image.jpg to your public folder)
    const metaImage = image || '/og-image.jpg';

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={metaDescription} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={metaImage} />
            <meta property="og:site_name" content={siteName} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={metaImage} />
        </Helmet>
    );
};

export default SEO;
