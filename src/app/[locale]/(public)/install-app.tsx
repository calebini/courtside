'use client';

import Image from 'next/image';
import {useEffect, useState, useSyncExternalStore} from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>;
}

export interface InstallAppLabels {
  readonly button: string;
  readonly iosInstructions: string;
  readonly kicker: string;
  readonly manualInstructions: string;
  readonly summary: string;
  readonly title: string;
}

type InstallEnvironment = 'checking' | 'installed' | 'ios' | 'manual';

function isRunningStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && navigator.standalone === true);
}

function isIOSDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function getInstallEnvironment(): InstallEnvironment {
  if (isRunningStandalone()) {
    return 'installed';
  }

  return isIOSDevice() ? 'ios' : 'manual';
}

function getServerInstallEnvironment(): InstallEnvironment {
  return 'checking';
}

function subscribeToInstallEnvironment() {
  return () => undefined;
}

export function InstallApp({labels}: {labels: InstallAppLabels}) {
  const environment = useSyncExternalStore(
    subscribeToInstallEnvironment,
    getInstallEnvironment,
    getServerInstallEnvironment
  );
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installFinished, setInstallFinished] = useState(false);

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => setInstallFinished(true);

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (environment === 'installed' || installFinished) {
    return null;
  }

  async function install() {
    if (!installEvent) {
      return;
    }

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    setInstallFinished(choice.outcome === 'accepted');
  }

  return (
    <section className="install-app" aria-labelledby="install-app-title">
      <Image
        alt=""
        className="install-app-icon"
        height={72}
        loading="eager"
        src="/icons/courtside-192.png"
        width={72}
      />
      <div className="install-app-copy">
        <p className="eyebrow">{labels.kicker}</p>
        <h2 id="install-app-title">{labels.title}</h2>
        <p>{labels.summary}</p>
      </div>
      <div className="install-app-action" aria-live="polite">
        {installEvent ? (
          <button type="button" onClick={install}>{labels.button}</button>
        ) : null}
        {!installEvent && environment === 'ios' ? <p>{labels.iosInstructions}</p> : null}
        {!installEvent && environment === 'manual' ? <p>{labels.manualInstructions}</p> : null}
      </div>
    </section>
  );
}
