/**
 * Warehouse 相册(G8 增量,用户反馈 #3):多图商品的浏览组件。
 *
 * 两种交互(同一数据源 imageUrls,详情媒体的完整图片数组):
 * - CardAlbumMedia(卡片):悬停 CARD_ALBUM_HOVER_DELAY_MS 后进入相册模式,
 *   光标在媒体区内的横向位置映射图片序号(位置翻页),圆点指示当前位置;
 *   悬停开始即预载全部图片,离开时回到主图。纯指针增强,键盘用户经详情
 *   相册获得等价能力。
 * - DetailAlbum(详情抽屉):左/右点击区翻页、中间点击区放大(灯箱),
 *   三个区域都是真实按钮(键盘可达);灯箱内点击任意处或 Esc 关闭。
 *
 * 加载语义:每张图都经 catalogImageUrl(vuaimg 缓存协议);卡片主图与详情
 * 当前图用 MediaSlot auto 模式(转圈自动重试,无手动按钮,见反馈 #2)。
 */
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { catalogImageUrl } from "../../app/catalog-image.ts";
import { MediaSlot } from "../../components/primitives/MediaSlot.tsx";
import { strings } from "../../i18n/index.ts";
import { albumIndexFromOffset, CARD_ALBUM_HOVER_DELAY_MS } from "./warehouse-model.ts";

const copy = strings.warehouse;

/* ---- 卡片相册:悬停激活 + 位置翻页 ---- */

export function CardAlbumMedia({
  imageUrls,
  title,
}: {
  imageUrls: readonly string[];
  title: string;
}) {
  // hovering = 悬停中(触发预载);active = 相册模式(延迟后开启)
  const [hovering, setHovering] = useState(false);
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<ReadonlySet<number>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const areaRef = useRef<HTMLDivElement | null>(null);

  const stopTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  // 卸载清理定时器
  useEffect(() => stopTimer, []);

  if (imageUrls.length <= 1) {
    const only = imageUrls[0];
    return only !== undefined ? (
      <MediaSlot src={catalogImageUrl(only)} alt={title} aspectRatio="1 / 1" retry="auto" />
    ) : null;
  }

  const primary = imageUrls[0] as string;

  const enter = () => {
    setHovering(true);
    stopTimer();
    timerRef.current = setTimeout(() => setActive(true), CARD_ALBUM_HOVER_DELAY_MS);
  };
  const leave = () => {
    stopTimer();
    setHovering(false);
    setActive(false);
    setIndex(0);
  };
  const move = (event: ReactMouseEvent) => {
    if (!active) return;
    const rect = areaRef.current?.getBoundingClientRect();
    if (rect === undefined) return;
    setIndex(albumIndexFromOffset(event.clientX - rect.left, rect.width, imageUrls.length));
  };

  return (
    <div
      ref={areaRef}
      className="vua-warehouse-album"
      onMouseEnter={enter}
      onMouseLeave={leave}
      onMouseMove={move}
    >
      {/* 主图常驻:相册未激活时是唯一内容;激活后垫在堆叠层下面,
       *  当前图未加载完时经透明间隙露出,避免闪烁 */}
      <MediaSlot src={catalogImageUrl(primary)} alt={title} aspectRatio="1 / 1" retry="auto" />
      {/* 悬停即挂载全部图片开始预载(隐藏不影响请求);激活后按光标位置翻页。
       *  堆叠层对读屏隐藏——装饰性增强,等价能力在详情相册 */}
      {hovering || active ? (
        <div className="vua-warehouse-album__stack" aria-hidden="true">
          {imageUrls.map((url, i) => (
            <img
              key={url}
              className="vua-warehouse-album__img"
              src={catalogImageUrl(url)}
              alt=""
              data-loaded={loaded.has(i) || undefined}
              hidden={!active || i !== index || !loaded.has(i)}
              onLoad={() =>
                setLoaded((prev) => {
                  if (prev.has(i)) return prev;
                  const next = new Set(prev);
                  next.add(i);
                  return next;
                })
              }
            />
          ))}
        </div>
      ) : null}
      {/* 当前图未加载完:转圈等待(复用 MediaSlot 的等待指示样式) */}
      {active && !loaded.has(index) ? (
        <span
          className="vua-media-slot__spinner"
          role="status"
          aria-label={strings.media.loading}
        />
      ) : null}
      {active ? (
        <div
          className="vua-warehouse-album__dots vua-warehouse-album__dots--overlay"
          aria-hidden="true"
        >
          {imageUrls.map((url, i) => (
            <span key={url} data-current={i === index || undefined} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ---- 详情相册:点击区翻页 + 中间放大 ---- */

export function DetailAlbum({
  imageUrls,
  title,
}: {
  imageUrls: readonly string[];
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  // 翻页方向(S-IX-3 翻页卡片):驱动 3D 翻转过渡的旋转方向
  const [flipDir, setFlipDir] = useState<1 | -1>(1);

  // Esc 关闭灯箱;stopPropagation 防止冒泡触发抽屉自身的 Esc 关闭
  useEffect(() => {
    if (!zoomed) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setZoomed(false);
      }
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [zoomed]);

  if (imageUrls.length <= 1) {
    const only = imageUrls[0];
    return only !== undefined ? (
      <MediaSlot src={catalogImageUrl(only)} alt={title} aspectRatio="1 / 1" retry="auto" />
    ) : null;
  }

  const total = imageUrls.length;
  const safeIndex = Math.min(index, total - 1);
  const current = imageUrls[safeIndex] as string;
  const flip = (delta: number) => {
    setFlipDir(delta > 0 ? 1 : -1);
    setIndex((i) => (i + delta + total) % total);
  };

  return (
    <div className="vua-warehouse-detail-album">
      {/* key 切换即重建 MediaSlot:换图走完整的 转圈→就绪 语义,缓存命中时近乎瞬时;
       *  翻转容器同 key 重建,触发 3D 翻页过渡(reduced-motion/effects-off 瞬切) */}
      <div
        key={current}
        className="vua-warehouse-detail-album__flip"
        data-dir={flipDir}
      >
        <MediaSlot
          src={catalogImageUrl(current)}
          alt={title}
          aspectRatio="1 / 1"
          retry="auto"
        />
      </div>
      {/* 点击区:左 25% 上一张 / 中 50% 放大 / 右 25% 下一张;皆为真实按钮(键盘可达) */}
      <div className="vua-warehouse-detail-album__zones">
        <button
          type="button"
          className="vua-warehouse-detail-album__zone vua-warehouse-detail-album__zone--prev"
          aria-label={copy.album.prevImage}
          onClick={() => flip(-1)}
        >
          ‹
        </button>
        <button
          type="button"
          className="vua-warehouse-detail-album__zone vua-warehouse-detail-album__zone--zoom"
          aria-label={copy.album.zoomImage}
          onClick={() => setZoomed(true)}
        />
        <button
          type="button"
          className="vua-warehouse-detail-album__zone vua-warehouse-detail-album__zone--next"
          aria-label={copy.album.nextImage}
          onClick={() => flip(1)}
        >
          ›
        </button>
      </div>
      <div className="vua-warehouse-detail-album__meta">
        <span className="vua-warehouse-album__dots" aria-hidden="true">
          {imageUrls.map((url, i) => (
            <span key={url} data-current={i === safeIndex || undefined} />
          ))}
        </span>
        <span className="vua-caption vua-text-secondary">
          {safeIndex + 1} / {total}
        </span>
      </div>
      {zoomed ? (
        // 灯箱:点击任意处关闭;无翻页(保持单一职责,翻页在抽屉内完成)
        <div
          className="vua-warehouse-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={() => setZoomed(false)}
        >
          <img src={catalogImageUrl(current)} alt={title} />
          <button
            type="button"
            className="vua-warehouse-lightbox__close"
            aria-label={copy.album.closeZoom}
            autoFocus
            onClick={() => setZoomed(false)}
          >
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
}
