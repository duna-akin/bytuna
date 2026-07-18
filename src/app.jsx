const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
  accentHue: 253,
  textureMode: "both",
  scanIntensity: 25,
}; /*EDITMODE-END*/

// picks the page's content for the current route - home keeps the
// terminal + contact together, projects/blog get a page to themselves
function renderPage(route) {
  switch (route.page) {
    case PROJECTS_ROUTE:
      return <Projects />;
    case BLOG_ROUTE:
      return <Blog />;
    default:
      return (
        <>
          <Hero />
          <Contact />
        </>
      );
  }
}

// a real page load always starts scrolled to the top; swapping content
// via JS doesn't, so we do it by hand on every route change
function useScrollOnRouteChange(route) {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [route.page]);
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  useApplyThemeVars(t);
  const route = usePageRoute();
  useScrollOnRouteChange(route);

  return (
    <>
      <TopBar />
      {renderPage(route)}
      <Footer />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Accent">
          <TweakSlider
            label="hue"
            value={t.accentHue}
            min={225}
            max={265}
            step={1}
            onChange={(v) => setTweak("accentHue", v)}
          />
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              color: "var(--fg-dimmer)",
              marginTop: -4,
            }}
          >
            225 = cyan-blue · 253 = blue · 265 = indigo. stays cool, trustworthy.
          </div>
        </TweakSection>
        <TweakSection label="Texture">
          <TweakRadio
            label="layers"
            value={t.textureMode}
            options={[
              { value: "off", label: "off" },
              { value: "grid", label: "grid" },
              { value: "scan", label: "scan" },
              { value: "both", label: "both" },
            ]}
            onChange={(v) => setTweak("textureMode", v)}
          />
          <TweakSlider
            label="scanline strength"
            value={t.scanIntensity}
            min={0}
            max={60}
            step={1}
            onChange={(v) => setTweak("scanIntensity", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

window.App = App;
