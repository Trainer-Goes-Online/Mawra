import type { Metadata } from "next";
import Script from "next/script";
import UtmTracker from "./_components/UtmTracker";

export function generateMetadata(): Metadata {
  return {
    title: "Coach Mawra · Lose The Weight & Keep It Off For Life",
    description:
      "Women's Fat Loss & Identity Transformation Specialist · TEDx Speaker · 500+ Transformations · 60+ Kilos Lost & Maintained.",
    icons: {
      icon: "/assets/favicon.ico",
    },
  };
}

// Single env var, read server-side (pixel IDs aren't secrets, so no NEXT_PUBLIC_
// copy is needed). This server component renders the ID into the inline pixel
// script below AND exposes it to client code via window.__tgoMetaPixelId, so
// app/_lib/analytics.ts can re-init the pixel for Advanced Matching.
const META_PIXEL_ID = process.env.META_PIXEL_ID || "";
// Analytics IDs are env-driven so each deployment uses its own (and nothing
// loads if they're unset — keeps the page fast and avoids leaking data).
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || "";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;1,6..72,300;1,6..72,400;1,6..72,500&family=Geist:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="preload" as="image" href="/assets/mawra.webp" fetchPriority="high" />
        <link rel="stylesheet" href="/funnel.css?v=23" />
      </head>
      <body>
        {/* Google Analytics (gtag.js) — only if NEXT_PUBLIC_GA_ID is set */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-gtag" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}

        {/* Microsoft Clarity — only if NEXT_PUBLIC_CLARITY_ID is set */}
        {CLARITY_ID && (
          <Script id="ms-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${CLARITY_ID}");
            `}
          </Script>
        )}

        {/* Meta Pixel — base + cookie-aware Manual Advanced Matching.
            H&W posture: PageView is the ONLY browser-side Meta event. The inline
            script reads the tgo_mam cookie and re-inits the pixel with hashed
            identity BEFORE firing PageView, so returning/identified visitors
            ship a high-EMQ PageView. The single conversion signal is the
            server-side custom `sales` event (see app/_lib/meta-capi.ts). */}
        {META_PIXEL_ID && (
          <>
            <Script id="meta-pixel-init" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                window.__tgoMetaPixelId = '${META_PIXEL_ID}';
                fbq('init', '${META_PIXEL_ID}');
                try {
                  var m = document.cookie.match(/(?:^|;\\s*)tgo_mam=([^;]+)/);
                  if (m) {
                    var mam = JSON.parse(decodeURIComponent(m[1]));
                    if (mam && typeof mam === 'object' && Object.keys(mam).length) {
                      fbq('init', '${META_PIXEL_ID}', mam);
                    }
                  }
                } catch (e) {}
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                alt=""
                src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
              />
            </noscript>
          </>
        )}

        <UtmTracker />
        {children}
      </body>
    </html>
  );
}
