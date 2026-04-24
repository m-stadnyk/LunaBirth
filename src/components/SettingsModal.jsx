import { useState } from "react";
import { N } from "../theme/index.js";
import { useLocaleContext } from "../context/LocaleContext.jsx";
import { useFeatureFlags } from "../context/FeatureFlagContext.jsx";

function ToggleRow({ label, checked, onChange, disabled }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: N.cream,
        border: `1px solid ${N.border}`,
        borderRadius: 10,
        padding: "12px 16px",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{ color: N.text, fontSize: 15 }}>{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          border: "none",
          background: checked ? N.gold : N.border,
          position: "relative",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 23 : 3,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s",
          }}
        />
      </button>
    </div>
  );
}

function SectionDivider() {
  return <div style={{ borderTop: `1px solid ${N.border}`, margin: "20px 0" }} />;
}

function SectionLabel({ children }) {
  return (
    <p style={{ margin: "0 0 12px", color: N.muted, fontSize: 13 }}>{children}</p>
  );
}

function NotificationsSection({ notifications, t }) {
  const isDenied = notifications.permission === "denied";
  return (
    <>
      <SectionLabel>{t("settings.notificationsLabel")}</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <ToggleRow
          label={t("settings.waterNotifLabel")}
          checked={notifications.enabled}
          onChange={() => notifications.toggle()}
          disabled={isDenied}
        />
        {isDenied && (
          <p style={{ margin: "4px 0 0", color: N.alert, fontSize: 12, paddingLeft: 4 }}>
            {t("settings.notifDeniedHint")}
          </p>
        )}
      </div>
    </>
  );
}

function CloudSyncSection({ cloudSync, t }) {
  const [joinCode, setJoinCode] = useState("");
  const [joinMode, setJoinMode] = useState(false);

  if (!cloudSync.isSignedIn) {
    return (
      <>
        <SectionLabel>{t("settings.cloudSyncLabel")}</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={() => cloudSync.signIn()}
            disabled={cloudSync.syncing}
            style={{
              background: N.gold,
              color: "#1a1a1a",
              border: "none",
              borderRadius: 10,
              padding: "12px 16px",
              fontSize: 15,
              fontWeight: 600,
              cursor: cloudSync.syncing ? "not-allowed" : "pointer",
              opacity: cloudSync.syncing ? 0.7 : 1,
              textAlign: "left",
            }}
          >
            {cloudSync.syncing ? t("settings.cloudSyncSyncing") : t("settings.cloudSyncStart")}
          </button>

          {!joinMode ? (
            <button
              onClick={() => setJoinMode(true)}
              style={{
                background: "none",
                border: `1px solid ${N.border}`,
                borderRadius: 10,
                padding: "10px 16px",
                fontSize: 14,
                color: N.muted,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {t("settings.cloudSyncJoinLabel")}
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                maxLength={6}
                placeholder={t("settings.cloudSyncJoinPlaceholder")}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                style={{
                  flex: 1,
                  background: N.cream,
                  border: `1px solid ${N.border}`,
                  borderRadius: 10,
                  padding: "10px 14px",
                  color: N.text,
                  fontSize: 15,
                  fontFamily: "monospace",
                  letterSpacing: "0.15em",
                }}
              />
              <button
                onClick={() => { cloudSync.joinAsPartner(joinCode); setJoinMode(false); setJoinCode(""); }}
                disabled={joinCode.length < 6 || cloudSync.syncing}
                style={{
                  background: N.gold,
                  color: "#1a1a1a",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: joinCode.length < 6 ? "not-allowed" : "pointer",
                  opacity: joinCode.length < 6 ? 0.6 : 1,
                }}
              >
                {t("settings.cloudSyncJoin")}
              </button>
            </div>
          )}

          <p style={{ margin: "4px 0 0", color: N.muted, fontSize: 12, paddingLeft: 4 }}>
            {t("settings.cloudSyncPrivacyNote")}
          </p>

          {cloudSync.error && (
            <p style={{ margin: "4px 0 0", color: N.alert, fontSize: 12, paddingLeft: 4 }}>
              {t("settings.cloudSyncError")}
            </p>
          )}
        </div>
      </>
    );
  }

  const isPartner = cloudSync.role === "partner";
  return (
    <>
      <SectionLabel>{t("settings.cloudSyncLabel")}</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            background: N.cream,
            border: `1px solid ${N.border}`,
            borderRadius: 10,
            padding: "12px 16px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: N.gold, fontSize: 14, fontWeight: 600 }}>
              {isPartner ? t("settings.cloudSyncRolePartner") : t("settings.cloudSyncSignedIn")}
            </span>
            {cloudSync.syncing && (
              <span style={{ color: N.muted, fontSize: 12 }}>{t("settings.cloudSyncSyncing")}</span>
            )}
          </div>
          {cloudSync.lastSynced && !cloudSync.syncing && (
            <div style={{ color: N.muted, fontSize: 12, marginTop: 4 }}>
              {t("settings.cloudSyncLastSynced", { time: new Date(cloudSync.lastSynced).toLocaleTimeString() })}
            </div>
          )}
        </div>

        {!isPartner && cloudSync.inviteCode && (
          <div
            style={{
              background: N.cream,
              border: `1px solid ${N.border}`,
              borderRadius: 10,
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ color: N.muted, fontSize: 13 }}>
              {t("settings.cloudSyncJoinLabel")}
            </span>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "0.2em",
                color: N.gold,
              }}
            >
              {cloudSync.inviteCode}
            </span>
          </div>
        )}

        {!isPartner && (
          <button
            onClick={() => cloudSync.sync()}
            disabled={cloudSync.syncing}
            style={{
              background: N.cream,
              border: `1px solid ${N.border}`,
              borderRadius: 10,
              padding: "10px 16px",
              fontSize: 14,
              color: cloudSync.syncing ? N.muted : N.text,
              cursor: cloudSync.syncing ? "not-allowed" : "pointer",
              textAlign: "left",
            }}
          >
            {t("settings.cloudSyncSyncNow")}
          </button>
        )}

        <button
          onClick={() => cloudSync.signOut()}
          style={{
            background: "none",
            border: `1px solid ${N.border}`,
            borderRadius: 10,
            padding: "10px 16px",
            fontSize: 14,
            color: N.muted,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          {t("settings.cloudSyncSignOut")}
        </button>

        {cloudSync.error && (
          <p style={{ margin: "4px 0 0", color: N.alert, fontSize: 12, paddingLeft: 4 }}>
            {t("settings.cloudSyncError")}
          </p>
        )}
      </div>
    </>
  );
}

function DataSection({ onClearTodos, t }) {
  const [confirming, setConfirming] = useState(false);

  const handleClear = () => {
    onClearTodos();
    setConfirming(false);
  };

  return (
    <>
      <SectionLabel>{t("settings.dataLabel")}</SectionLabel>
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          style={{
            background: "none",
            border: `1px solid ${N.alert}`,
            borderRadius: 10,
            padding: "10px 16px",
            fontSize: 14,
            color: N.alert,
            cursor: "pointer",
            textAlign: "left",
            width: "100%",
          }}
        >
          {t("settings.clearTodosBtn")}
        </button>
      ) : (
        <div
          style={{
            background: N.cream,
            border: `1px solid ${N.alert}`,
            borderRadius: 10,
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <p style={{ margin: 0, color: N.text, fontSize: 14 }}>
            {t("settings.clearTodosConfirmText")}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleClear}
              style={{
                flex: 1,
                background: N.alert,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              {t("settings.clearTodosYes")}
            </button>
            <button
              onClick={() => setConfirming(false)}
              style={{
                flex: 1,
                background: "none",
                color: N.muted,
                border: `1px solid ${N.border}`,
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              {t("settings.clearTodosCancel")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function AppVersionSection({ appUpdate, t }) {
  const { status, checkForUpdates } = appUpdate;

  const statusText = {
    checking: t("settings.updateChecking"),
    upToDate: t("settings.updateUpToDate"),
    updating: t("settings.updateAvailable"),
  }[status] ?? null;

  return (
    <>
      <SectionLabel>{t("settings.appVersionLabel")}</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            background: N.cream,
            border: `1px solid ${N.border}`,
            borderRadius: 10,
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ color: N.text, fontSize: 15, fontVariantNumeric: "tabular-nums" }}>
            v{__APP_VERSION__}
          </span>
          <button
            onClick={checkForUpdates}
            disabled={status !== "idle"}
            style={{
              background: "none",
              border: `1px solid ${N.border}`,
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 13,
              color: status !== "idle" ? N.muted : N.text,
              cursor: status !== "idle" ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            {status === "checking"
              ? t("settings.updateChecking")
              : t("settings.checkForUpdates")}
          </button>
        </div>
        {statusText && status !== "checking" && (
          <p
            style={{
              margin: "0 0 0 4px",
              fontSize: 12,
              color: status === "updating" ? N.gold : N.muted,
            }}
          >
            {statusText}
          </p>
        )}
      </div>
    </>
  );
}

export function SettingsModal({ open, onClose, notifications, cloudSync, appUpdate, onClearTodos }) {
  const { locale, setLocale, t, supportedLocales } = useLocaleContext();
  const { flags, setFlag, flagDefs } = useFeatureFlags();

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          background: N.cardSolid,
          borderTop: `1px solid ${N.border}`,
          borderRadius: "16px 16px 0 0",
          padding: "24px 20px 40px",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: N.text, fontSize: 18, fontWeight: 500 }}>
            {t("settings.title")}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none",
              color: N.muted, fontSize: 16, cursor: "pointer", padding: "4px 8px",
            }}
          >
            {t("settings.close")}
          </button>
        </div>

        <SectionLabel>{t("settings.languageLabel")}</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {supportedLocales.map((code) => (
            <button
              key={code}
              data-active={String(code === locale)}
              onClick={() => setLocale(code)}
              style={{
                textAlign: "left",
                background: code === locale ? N.goldLight : N.cream,
                border: `1px solid ${code === locale ? N.gold : N.border}`,
                borderRadius: 10,
                padding: "12px 16px",
                color: code === locale ? N.gold : N.text,
                fontSize: 15,
                cursor: "pointer",
                fontWeight: code === locale ? 600 : 400,
              }}
            >
              {t(`settings.${code}`)}
            </button>
          ))}
        </div>

        {notifications && (
          <>
            <SectionDivider />
            <NotificationsSection notifications={notifications} t={t} />
          </>
        )}

        {cloudSync && (
          <>
            <SectionDivider />
            <CloudSyncSection cloudSync={cloudSync} t={t} />
          </>
        )}

        <SectionDivider />
        <SectionLabel>{t("settings.featuresLabel")}</SectionLabel>
        {flagDefs.length === 0 ? (
          <p style={{ margin: 0, color: N.muted, fontSize: 13 }}>
            {t("settings.noFlags")}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {flagDefs.map(({ id, labelKey }) => (
              <ToggleRow
                key={id}
                label={t(labelKey)}
                checked={flags[id]}
                onChange={(v) => setFlag(id, v)}
              />
            ))}
          </div>
        )}

        {onClearTodos && (
          <>
            <SectionDivider />
            <DataSection onClearTodos={onClearTodos} t={t} />
          </>
        )}

        {appUpdate && (
          <>
            <SectionDivider />
            <AppVersionSection appUpdate={appUpdate} t={t} />
          </>
        )}
      </div>
    </div>
  );
}
