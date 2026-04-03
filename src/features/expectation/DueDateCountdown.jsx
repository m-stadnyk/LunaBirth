import { N } from "../../theme/index.js";
import { useLocaleContext } from "../../context/LocaleContext.jsx";

const UNIT_KEYS = ["wks_days", "days", "hours"];

export function DueDateCountdown({ countdown, unit, onUnitChange, onSetDueDate, dueDate }) {
  const { t } = useLocaleContext();
  const units = UNIT_KEYS.map((key) => ({ key, label: t(`expecting.units.${key}`) }));
  const primaryLabel = unit === "wks_days" ? t("expecting.weeks") : unit === "hours" ? t("expecting.hours") : t("expecting.days");
  const secondaryLabel = t("expecting.days");
  return (
    <div style={{ textAlign: "center", padding: "20px 0 12px" }}>
      {!dueDate ? (
        /* No due date set yet — show picker */
        <div>
          <p style={{ fontSize: 14, color: N.muted, marginBottom: 12 }}>
            {t("expecting.setDueDatePrompt")}
          </p>
          <input
            data-testid="due-date-input"
            type="date"
            onChange={(e) => onSetDueDate(e.target.value)}
            style={{
              padding: "9px 14px", borderRadius: 12,
              border: `1px solid ${N.border}`, background: N.card,
              color: N.text, fontSize: 14,
            }}
          />
        </div>
      ) : (
        <>
          {/* Overdue badge */}
          {countdown?.overdue && (
            <div
              data-testid="overdue-badge"
              style={{
                display: "inline-block", fontSize: 11, background: N.alert,
                color: "#fff", borderRadius: 20, padding: "3px 12px", marginBottom: 10,
              }}
            >
              {t("expecting.overdue")}
            </div>
          )}

          {/* Big number */}
          {countdown && (
            <div style={{ marginBottom: 4 }}>
              <span
                data-testid="countdown-primary"
                style={{
                  fontFamily: "'Cormorant Garamond',serif",
                  fontSize: 72, fontWeight: 300, color: N.gold, lineHeight: 1,
                }}
              >
                {countdown.primary}
              </span>
              {" "}
              <span
                data-testid="countdown-primary-label"
                style={{ fontSize: 18, color: N.muted, fontWeight: 400 }}
              >
                {primaryLabel}
              </span>
            </div>
          )}

          {/* Secondary (weeks+days only) */}
          {countdown?.secondary != null && (
            <div style={{ marginBottom: 12 }}>
              <span
                data-testid="countdown-secondary"
                style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: N.silver }}
              >
                {countdown.secondary}
              </span>
              {" "}
              <span style={{ fontSize: 14, color: N.muted }}>{secondaryLabel}</span>
            </div>
          )}

          {/* Unit toggle */}
          <div style={{ display: "inline-flex", gap: 6, marginTop: 8 }}>
            {units.map(({ key, label }) => (
              <button
                key={key}
                data-testid={`unit-${key}`}
                data-active={String(unit === key)}
                onClick={() => onUnitChange(key)}
                style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 11,
                  border: `1px solid ${unit === key ? N.gold : N.border}`,
                  background: unit === key ? N.goldLight : "transparent",
                  color: unit === key ? N.gold : N.muted,
                  cursor: "pointer", fontWeight: unit === key ? 600 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Change date link */}
          <div style={{ marginTop: 10 }}>
            <input
              data-testid="due-date-input"
              type="date"
              value={dueDate}
              onChange={(e) => onSetDueDate(e.target.value)}
              style={{
                padding: "5px 10px", borderRadius: 10, fontSize: 11,
                border: `1px solid ${N.border}`, background: "transparent",
                color: N.muted,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
