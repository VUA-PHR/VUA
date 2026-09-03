import { useState } from "react";
import { Badge } from "../../components/primitives/Badge.tsx";
import { Button } from "../../components/primitives/Button.tsx";
import { Icon } from "@vua/design-system";
import { format, strings } from "../../i18n/index.ts";
import type { RepoInfo } from "../../gateway/index.ts";
import { relativeCheckedTime } from "./packages-model.ts";

const copy = strings.packages;

/** 上次核对的相对时间;非法时间戳原样展示(不猜测),缺失走"从未核对" */
function checkedText(repo: RepoInfo, now: number): string {
  if (repo.lastCheckedAt === undefined) return copy.repos.neverChecked;
  const relative = relativeCheckedTime(repo.lastCheckedAt, now);
  if (relative === null) return repo.lastCheckedAt;
  return format(copy.repos[relative.key], { count: relative.count });
}

/**
 * 仓库订阅区(S-XVI):
 * - 健康点 = 中性色圆点 + 文字标签,不进红绿灯语义;unreachable 属异常才用红;
 * - 启停是语义开关(停用不删数据),官方/精选行只读(本切片无任何删除入口);
 * - "添加社区仓库"先弹风险说明;真实订阅随包引擎接入(fixture 只演示弹层,不真加)。
 */
export function RepoSection({
  repos,
  onToggle,
}: {
  repos: readonly RepoInfo[];
  onToggle: (repoId: string, enabled: boolean) => void;
}) {
  const [riskOpen, setRiskOpen] = useState(false);
  const now = Date.now();
  return (
    <div className="vua-packages__main">
      <div className="vua-packages__toolbar">
        <Button variant="default" onClick={() => setRiskOpen(true)}>
          {copy.repos.addCommunity}
        </Button>
      </div>
      <ul className="vua-packages__repos">
        {repos.map((repo) => (
          <li key={repo.id} className="vua-packages__repo">
            <label className="vua-packages__repo-toggle">
              <input
                type="checkbox"
                checked={repo.enabled}
                aria-label={format(copy.repos.toggleAria, { name: repo.name })}
                onChange={(event) => onToggle(repo.id, event.target.checked)}
              />
            </label>
            <span className="vua-packages__repo-name">{repo.name}</span>
            <Badge tone="neutral">{copy.sources[repo.kind]}</Badge>
            <span className="vua-packages__health" data-health={repo.health}>
              <span className="vua-packages__health-dot" aria-hidden="true" />
              <span className="vua-caption">{copy.repos.health[repo.health]}</span>
            </span>
            <span className="vua-caption vua-text-secondary">{checkedText(repo, now)}</span>
            {repo.packageCount !== undefined ? (
              <span className="vua-caption vua-text-secondary">
                {format(copy.repos.packageCount, { count: repo.packageCount })}
              </span>
            ) : null}
            {repo.url ? (
              <span className="vua-caption vua-text-secondary vua-packages__repo-url">
                {repo.url}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {riskOpen ? (
        <div
          className="vua-packages-dialog"
          role="dialog"
          aria-modal="true"
          aria-label={copy.repos.riskTitle}
          onClick={() => setRiskOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setRiskOpen(false);
          }}
        >
          <div
            className="vua-packages-dialog__panel"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="vua-packages-dialog__title">{copy.repos.riskTitle}</h2>
            <div className="vua-packages__warning-strip">
              <Icon name="warning" size={16} />
              <p className="vua-caption">{copy.repos.riskBody}</p>
            </div>
            <div className="vua-packages-dialog__footer">
              <Button variant="primary" autoFocus onClick={() => setRiskOpen(false)}>
                {copy.repos.riskAcknowledge}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
