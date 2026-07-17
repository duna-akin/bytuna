const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
  accentHue: 55,
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
            min={45}
            max={95}
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
            45 = orange · 75 = amber · 95 = yellow-green. stays warm.
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
