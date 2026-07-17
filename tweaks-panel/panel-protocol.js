function useEditModeProtocol() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onMsg = (e) => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);
      else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    // listener needs to be attached before we announce, otherwise the
    // host's reply can come back before we're ready to hear it
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
  };

  return { open, dismiss };
}

Object.assign(window, { useEditModeProtocol });
