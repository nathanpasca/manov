import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEO Component — Injects meta tags, Open Graph, Twitter Cards, and canonical links.
 * IMPORTANT: This runs client-side only. For social crawlers that don't execute JS,
 * prerendering or SSR is required for dynamic OG tags to work on shared links.
 */
const SEO = ({
    title,
    description,
    image,
    type = 'website',
    url,
    author,
    publishedAt,
    modifiedAt,
    tags = [],
    noindex = false,
}) => {
    const siteName = 'Manov';
    const siteUrl =
        import.meta.env.VITE_FRONTEND_URL || 'https://manov.pascarz.site';
    const twitterHandle = '@manovnovels';

    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    const defaultDescription =
        'Read translated web novels. Free, unlimited chapters. Discover trending stories updated daily.';
    const metaDescription = description || defaultDescription;

    // Ensure image is always an absolute URL for OG/Twitter
    const metaImage = image
        ? image.startsWith('http')
            ? image
            : `${siteUrl}${image.startsWith('/') ? '' : '/'}${image}`
        : `${siteUrl}/og-image.png`;

    // Canonical URL — always absolute
    const canonicalUrl = url || siteUrl;
    const absoluteCanonical = canonicalUrl.startsWith('http')
        ? canonicalUrl
        : `${siteUrl}${canonicalUrl.startsWith('/') ? '' : '/'}${canonicalUrl}`;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={metaDescription} />
            {noindex && <meta name="robots" content="noindex, nofollow" />}
            {!noindex && <meta name="robots" content="index, follow" />}
            <link rel="canonical" href={absoluteCanonical} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={absoluteCanonical} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={metaImage} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:site_name" content={siteName} />
            <meta property="og:locale" content="en_US" />

            {/* Article-specific OG tags (for books/novels) */}
            {type === 'book' && author && (
                <meta property="book:author" content={author} />
            )}
            {type === 'book' && tags.length > 0 && (
                <meta property="book:tag" content={tags.join(', ')} />
            )}
            {publishedAt && (
                <meta property="article:published_time" content={publishedAt} />
            )}
            {modifiedAt && (
                <meta property="article:modified_time" content={modifiedAt} />
            )}

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content={twitterHandle} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={metaImage} />
        </Helmet>
    );
};

export default SEO;
