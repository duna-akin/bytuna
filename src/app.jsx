const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
  accentHue: 253,
  textureMode: "both",
  scanIntensity: 25,
}; /*EDITMODE-END*/

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  useApplyThemeVars(t);

  return (
    <>
      <TopBar />
      <Hero />
      <Projects />
      <Blog />
      <Contact />
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
