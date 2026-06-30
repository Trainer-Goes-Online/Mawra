/**
 * Shared legal/compliance disclaimer used in the footer of every page except
 * the checkout payment page. Styling (.foot-disclaimer / .foot-copy) lives in
 * funnel.css, which the root layout loads globally on every route.
 */
export default function FooterDisclaimer() {
  return (
    <div className="foot-disclaimer">
      <p>
        All content, systems and coaching services provided by Coach Mawra
        are intended for educational and informational purposes only and do not
        guarantee specific results. This is not medical advice. Always consult a
        qualified healthcare professional before making changes to your diet,
        exercise or lifestyle. Client results and testimonials vary based on
        individual factors such as consistency, medical history, lifestyle and
        adherence to the process. Outcomes are not typical or guaranteed. This
        website is not affiliated with or endorsed by Meta. FACEBOOK and INSTAGRAM
        are trademarks of Meta Platforms, Inc.
      </p>
      <p className="foot-copy">© 2026 Coach Mawra. All rights reserved.</p>
    </div>
  );
}
