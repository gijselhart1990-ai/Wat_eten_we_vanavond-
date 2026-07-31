"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { formatAmount } from "../lib/shoppingList";
import type {
  PicnicCartSelection,
  PicnicMatchResponse,
  PicnicProductMatch,
  PicnicShoppingItemInput,
} from "../lib/picnic/types";
import styles from "./PicnicPanel.module.css";

interface PicnicStatus {
  configured: boolean;
  connected: boolean;
}

type BusyState = "status" | "login" | "verify" | "match" | "cart" | "logout" | null;
type SelectionMap = Record<string, PicnicCartSelection>;

async function callApi<T>(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "De aanvraag kon niet worden uitgevoerd.");
  return data;
}

function money(cents: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function PicnicPanel({ items }: { items: PicnicShoppingItemInput[] }) {
  const [status, setStatus] = useState<PicnicStatus | null>(null);
  const [busy, setBusy] = useState<BusyState>("status");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [awaiting2FA, setAwaiting2FA] = useState(false);
  const [matches, setMatches] = useState<PicnicProductMatch[]>([]);
  const [selections, setSelections] = useState<SelectionMap>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    callApi<PicnicStatus>("/api/picnic/status")
      .then(setStatus)
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setBusy(null));
  }, []);

  const selectedProducts = useMemo(() => matches.flatMap((match) => {
    const selection = selections[match.item.id];
    if (!selection) return [];
    const product = match.options.find((option) => option.id === selection.productId);
    return product ? [{ match, product, selection }] : [];
  }), [matches, selections]);

  const totalCents = selectedProducts.reduce((total, current) => total + current.product.priceCents * current.selection.quantity, 0);

  function clearMessages() {
    setError("");
    setNotice("");
  }

  async function connect(event: FormEvent) {
    event.preventDefault();
    clearMessages();
    setBusy("login");
    try {
      const result = await callApi<{ connected: boolean; requires2FA: boolean }>("/api/picnic/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setPassword("");
      if (result.requires2FA) {
        setAwaiting2FA(true);
        setNotice("Picnic heeft een sms-code verstuurd.");
      } else {
        setStatus({ configured: true, connected: true });
        setNotice("Je Picnic-account is verbonden.");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Inloggen is mislukt.");
    } finally {
      setBusy(null);
    }
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    clearMessages();
    setBusy("verify");
    try {
      await callApi<{ connected: boolean }>("/api/picnic/verify", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      setCode("");
      setAwaiting2FA(false);
      setStatus({ configured: true, connected: true });
      setNotice("Je Picnic-account is verbonden.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "De verificatie is mislukt.");
    } finally {
      setBusy(null);
    }
  }

  async function disconnect() {
    clearMessages();
    setBusy("logout");
    try {
      await callApi<{ connected: boolean }>("/api/picnic/logout", { method: "POST", body: "{}" });
      setStatus({ configured: true, connected: false });
      setMatches([]);
      setSelections({});
      setAwaiting2FA(false);
      setNotice("De Picnic-koppeling is verbroken.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Uitloggen is mislukt.");
    } finally {
      setBusy(null);
    }
  }

  async function findProducts() {
    clearMessages();
    setBusy("match");
    try {
      const result = await callApi<PicnicMatchResponse>("/api/picnic/match", {
        method: "POST",
        body: JSON.stringify({ items }),
      });
      const initialSelections: SelectionMap = {};
      result.matches.forEach((match) => {
        const first = match.options[0];
        if (first) initialSelections[match.item.id] = { productId: first.id, quantity: first.suggestedQuantity };
      });
      setMatches(result.matches);
      setSelections(initialSelections);
      const missing = result.matches.filter((match) => !match.options.length).length;
      setNotice(missing ? `${missing} boodschap${missing === 1 ? "" : "pen"} kon niet automatisch worden gevonden.` : "Alle boodschappen zijn gekoppeld. Controleer de keuzes hieronder.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Producten zoeken is mislukt.");
    } finally {
      setBusy(null);
    }
  }

  function selectProduct(match: PicnicProductMatch, productId: string) {
    const product = match.options.find((option) => option.id === productId);
    setSelections((current) => {
      if (!product) {
        const next = { ...current };
        delete next[match.item.id];
        return next;
      }
      return { ...current, [match.item.id]: { productId, quantity: product.suggestedQuantity } };
    });
  }

  function changeQuantity(itemId: string, quantity: number) {
    setSelections((current) => current[itemId] ? {
      ...current,
      [itemId]: { ...current[itemId], quantity: Math.max(1, Math.min(99, quantity || 1)) },
    } : current);
  }

  async function addToCart() {
    if (!selectedProducts.length) return;
    const confirmed = window.confirm(`Voeg ${selectedProducts.length} geselecteerde producten voor ongeveer ${money(totalCents)} toe aan je Picnic-mandje?`);
    if (!confirmed) return;

    clearMessages();
    setBusy("cart");
    try {
      await callApi<{ ok: boolean; added: number }>("/api/picnic/cart", {
        method: "POST",
        body: JSON.stringify({ selections: selectedProducts.map(({ selection }) => selection) }),
      });
      setNotice("De geselecteerde producten staan in je Picnic-mandje. Controleer en rond de bestelling af in de Picnic-app.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Toevoegen aan het mandje is mislukt.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="picnic-title">
      <header className={styles.header}>
        <div className={styles.titleWrap}>
          <span className={styles.logo} aria-hidden="true">P</span>
          <div>
            <span className="eyebrow">Boodschappen bestellen</span>
            <h2 id="picnic-title">Picnic-koppeling</h2>
          </div>
        </div>
        <span className={`${styles.status} ${status?.connected ? styles.connected : ""}`}>
          <i />{busy === "status" ? "Controleren…" : status?.connected ? "Verbonden" : "Niet verbonden"}
        </span>
      </header>

      {error && <p className={styles.error} role="alert">{error}</p>}
      {notice && <p className={styles.notice} role="status">{notice}</p>}

      {status && !status.configured && <div className={styles.setup}>
        <strong>Nog één beheerinstelling nodig</strong>
        <p>Voeg in Netlify een geheime omgevingsvariabele <code>PICNIC_SESSION_SECRET</code> van minimaal 32 willekeurige tekens toe en start daarna een nieuwe deployment.</p>
      </div>}

      {status?.configured && !status.connected && !awaiting2FA && <form className={styles.loginForm} onSubmit={connect}>
        <div className={styles.formCopy}><strong>Verbind je eigen Picnic-account</strong><p>Je inloggegevens worden alleen rechtstreeks naar Picnic gestuurd en niet opgeslagen.</p></div>
        <label><span>E-mail of telefoonnummer</span><input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></label>
        <label><span>Wachtwoord</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        <button className="primary-button" type="submit" disabled={busy !== null}>{busy === "login" ? "Verbinden…" : "Account verbinden"}</button>
      </form>}

      {status?.configured && !status.connected && awaiting2FA && <form className={styles.verifyForm} onSubmit={verify}>
        <div><strong>Vul de sms-code in</strong><p>De verificatiecode blijft maximaal tien minuten geldig.</p></div>
        <input inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} aria-label="Picnic verificatiecode" required />
        <button className="primary-button" type="submit" disabled={busy !== null}>{busy === "verify" ? "Controleren…" : "Code bevestigen"}</button>
      </form>}

      {status?.connected && <div className={styles.connectedBody}>
        <div className={styles.toolbar}>
          <div><strong>{items.length} niet-afgevinkte boodschappen</strong><p>Picnic zoekt maximaal drie passende alternatieven per boodschap.</p></div>
          <div className={styles.toolbarActions}>
            <button className="secondary-button" type="button" onClick={disconnect} disabled={busy !== null}>Verbreken</button>
            <button className="primary-button" type="button" onClick={findProducts} disabled={busy !== null || !items.length}>{busy === "match" ? "Zoeken…" : matches.length ? "Opnieuw zoeken" : "Zoek in Picnic"}</button>
          </div>
        </div>

        {matches.length > 0 && <div className={styles.review}>
          <div className={styles.reviewHeading}><div><span className="eyebrow">Controle vóór toevoegen</span><h3>Controleer producten en aantallen</h3></div><strong>{money(totalCents)}</strong></div>
          <div className={styles.matches}>
            {matches.map((match) => {
              const selection = selections[match.item.id];
              return <article className={styles.match} key={match.item.id}>
                <div className={styles.requested}><strong>{match.item.name}</strong><span>{formatAmount(match.item.amount, match.item.unit)}</span></div>
                {match.options.length ? <>
                  <label className={styles.productSelect}><span>Picnic-product</span><select value={selection?.productId || ""} onChange={(event) => selectProduct(match, event.target.value)}><option value="">Overslaan</option>{match.options.map((option) => <option value={option.id} key={option.id}>{option.name} · {option.unitQuantity} · {money(option.priceCents)}</option>)}</select></label>
                  <label className={styles.quantity}><span>Aantal</span><input type="number" min={1} max={99} disabled={!selection} value={selection?.quantity || 1} onChange={(event) => changeQuantity(match.item.id, Number(event.target.value))} /></label>
                </> : <span className={styles.notFound}>Niet gevonden — voeg dit artikel handmatig toe in Picnic.</span>}
              </article>;
            })}
          </div>
          <footer className={styles.reviewFooter}>
            <p>Er wordt niets besteld of betaald. De producten worden alleen aan je mandje toegevoegd.</p>
            <button className="primary-button" type="button" onClick={addToCart} disabled={busy !== null || !selectedProducts.length}>{busy === "cart" ? "Toevoegen…" : `Voeg ${selectedProducts.length} producten toe`}</button>
          </footer>
        </div>}
      </div>}

      <p className={styles.disclaimer}>Deze persoonlijke koppeling gebruikt een onofficiële Picnic-interface. Rond bestellen en betalen altijd zelf af in de officiële Picnic-app.</p>
    </section>
  );
}
