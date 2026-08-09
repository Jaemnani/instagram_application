import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

import { getInstagramData } from "@/lib/data";

export const alt = "키딩성수 — 성수동 베이비 스튜디오 (돌사진·가족사진)";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** 오른쪽 사진 패널 폭. 나머지는 텍스트 패널. */
const PHOTO_W = 452;

/**
 * 공유용 OG 이미지 (카카오톡·페이스북·슬랙).
 *
 * 설계 메모:
 * - 텍스트는 라틴 문자만 쓴다. satori 는 woff2 를 못 읽어 한글을 넣으려면 수 MB TTF 를
 *   번들해야 하고, OG 이미지 안의 글자는 어차피 색인되지 않는다.
 * - 스튜디오 사진이 전부 세로(비율 0.75~0.80)라 1200×630 풀블리드로 깔면 대부분 잘린다.
 *   → 좌측 텍스트 패널 + 우측 세로 사진 패널로 나눠 크롭을 최소화한다.
 * - satori 미지원: `inset` 단축, `background` 단축 그라데이션, <img> 의 objectFit.
 *   좌표·크기는 px 로 명시하고 사진은 backgroundSize:cover 로 깐다.
 */
export default async function OpengraphImage() {
  const { posts, profile } = await getInstagramData();

  // 사진 패널 비율에 가장 가까운 커버를 골라 잘림을 줄인다.
  const panelRatio = PHOTO_W / size.height;
  const covers = posts
    .map((p) => p.coverImage)
    .filter(
      (im): im is NonNullable<typeof im> =>
        !!im && !im.src.endsWith(".svg") && !!im.width && !!im.height,
    )
    .sort(
      (a, b) =>
        Math.abs(a.width / a.height - panelRatio) -
        Math.abs(b.width / b.height - panelRatio),
    );

  const candidate =
    covers[0] ??
    (profile.profilePicture && !profile.profilePicture.src.endsWith(".svg")
      ? profile.profilePicture
      : null);

  // object-fit:cover 와 같은 배율 — 패널을 가득 채우도록 긴 쪽을 기준으로 확대한다.
  const coverScale = candidate
    ? Math.max(PHOTO_W / candidate.width, size.height / candidate.height)
    : 1;

  let photo: string | null = null;
  if (candidate) {
    try {
      const buf = await readFile(path.join(process.cwd(), "public", candidate.src));
      photo = `data:image/jpeg;base64,${buf.toString("base64")}`;
    } catch {
      // 사진을 못 읽어도 텍스트만으로 이미지를 만들어 빌드가 깨지지 않게 한다.
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#f8f5f0",
        }}
      >
        {/* 좌측 — 텍스트 패널 */}
        <div
          style={{
            // 폭을 직접 주면 satori(Yoga) 의 content-box 계산에서 padding 이 더해져
            // 사진 패널이 캔버스 밖으로 밀린다 → 남는 공간을 flexGrow 로 채운다.
            flexGrow: 1,
            height: size.height,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingLeft: 72,
            paddingRight: 56,
          }}
        >
          <div style={{ fontSize: 21, letterSpacing: 7, color: "#b4694e" }}>
            NO POSED, JUST KIDDING
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 68,
              fontWeight: 700,
              letterSpacing: -1.5,
              color: "#1c1917",
              lineHeight: 1.1,
            }}
          >
            KIDDING
          </div>
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              letterSpacing: -1.5,
              color: "#1c1917",
              lineHeight: 1.1,
            }}
          >
            SEONGSU
          </div>
          <div style={{ marginTop: 24, fontSize: 26, color: "#5a534b", lineHeight: 1.45 }}>
            Baby &amp; Family Photo Studio
          </div>
          <div style={{ fontSize: 26, color: "#8a8279" }}>Seongsu-dong, Seoul</div>

          {/* 얇은 규칙선 — 사이트의 에디토리얼 리듬과 맞춘다 */}
          <div
            style={{
              marginTop: 34,
              width: 96,
              height: 3,
              backgroundColor: "#b4694e",
              display: "flex",
            }}
          />
        </div>

        {/* 우측 — 세로 사진 패널.
            satori 는 이 위치에서 backgroundImage(data URI) 를 페인트하지 못하고
            <img> 의 objectFit 도 무시하므로, cover 크기를 직접 계산해 넘긴다. */}
        {photo && candidate && (
          <div
            style={{
              width: PHOTO_W,
              height: size.height,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              backgroundColor: "#efe9e1",
            }}
          >
            <img
              src={photo}
              alt=""
              width={Math.round(candidate.width * coverScale)}
              height={Math.round(candidate.height * coverScale)}
            />
          </div>
        )}
      </div>
    ),
    size,
  );
}
