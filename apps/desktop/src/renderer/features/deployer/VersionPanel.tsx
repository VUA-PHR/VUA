import { formatDateTime } from "../../i18n/index.ts";
import { Badge } from "../../components/primitives/Badge.tsx";
import { format, strings } from "../../i18n/index.ts";
import {
  relativeTimeKey,
  type VersionTrack,
  type VersionTrackState,
} from "./deployer-model.ts";

const copy = strings.deployer.versions;

const badgeTone: Record<VersionTrackState, "success" | "brand" | "neutral"> = {
  "up-to-date": "success",
  "update-available": "brand",
  unknown: "neutral",
};

const stateLabel: Record<VersionTrackState, string> = {
  "up-to-date": copy.stateUpToDate,
  "update-available": copy.stateUpdate,
  unknown: copy.stateUnknown,
};

/**
 * 版本轨道面板(S-XV,借鉴 Comfy-Desktop VersionStatPanel):
 * 轨道头(名称 + 状态胶囊)+ dl 事实行(已安装 / 最新 / 上次核对),
 * 相对时间显示、绝对时间挂 title;有更新时"最新版本"行高亮。
 *
 * 诚实纪律:状态结论由数据源给出(前端不做版本词法比较);面板不渲染
 * 任何动作按钮——"检查更新/立即更新"等真实意图接入端口前不出现,
 * 不放假按钮占位。
 */
export function VersionPanel({ tracks }: { tracks: readonly VersionTrack[] }) {
  return (
    <section className="vua-version-panel" aria-label={copy.title}>
      <h2 className="vua-version-panel__title">{copy.title}</h2>
      <div className="vua-version-panel__tracks">
        {tracks.map((track) => {
          const rel = track.checkedAt !== null ? relativeTimeKey(track.checkedAt, Date.now()) : null;
          return (
            <div className="vua-version-track" key={track.id}>
              <header className="vua-version-track__header">
                <h3 className="vua-version-track__title">{track.title}</h3>
                <Badge tone={badgeTone[track.state]}>{stateLabel[track.state]}</Badge>
              </header>
              <dl className="vua-version-track__facts">
                <div className="vua-version-track__fact">
                  <dt>{copy.installed}</dt>
                  <dd>{track.installed ?? copy.notInstalled}</dd>
                </div>
                <div className="vua-version-track__fact">
                  <dt>{copy.latest}</dt>
                  <dd data-highlight={track.state === "update-available" ? "true" : undefined}>
                    {track.latest ?? "—"}
                  </dd>
                </div>
                <div className="vua-version-track__fact">
                  <dt>{copy.lastChecked}</dt>
                  <dd
                    title={
                      track.checkedAt !== null
                        ? formatDateTime(track.checkedAt)
                        : undefined
                    }
                  >
                    {rel === null
                      ? "—"
                      : rel.key === "justNow"
                        ? copy.justNow
                        : format(copy[rel.key], { count: rel.count })}
                  </dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </section>
  );
}
