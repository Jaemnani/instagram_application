import type { IgComment, IgMedia, IgProfile } from "./types";

/**
 * 개발/데모용 fixture.
 * IG_LONG_LIVED_TOKEN 이 없을 때 sync가 이 데이터를 사용한다.
 * media_url 은 실제 다운로드 파이프라인을 검증하기 위해 picsum.photos를 가리킨다.
 */

const img = (seed: string, w = 1080, h = 1080) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export function loadFixture(): {
  profile: IgProfile;
  media: IgMedia[];
  comments: Record<string, IgComment[]>;
} {
  const profile: IgProfile = {
    id: "demo",
    username: "demo_roastery",
    name: "데모 로스터리",
    biography:
      "스페셜티 원두를 직접 로스팅하는 동네 카페입니다. 매일 신선하게 볶은 커피와 수제 디저트를 만나보세요.",
    profile_picture_url: img("avatar", 320, 320),
    media_count: 4,
    followers_count: 5120,
    website: "https://example.com",
  };

  const media: IgMedia[] = [
    {
      id: "1001",
      media_type: "IMAGE",
      media_url: img("coffee1"),
      permalink: "https://www.instagram.com/p/demo1001/",
      timestamp: "2026-06-20T09:00:00+0000",
      like_count: 342,
      comments_count: 2,
      caption:
        "오늘의 싱글 오리진, 에티오피아 예가체프\n\n자몽 같은 산미와 꽃향이 매력적인 원두입니다. 핸드드립으로 내려 드시면 더욱 좋아요. 매장에서 갓 볶은 원두 200g 단위로 구매 가능합니다.\n\n#스페셜티커피 #예가체프 #핸드드립 #동네카페",
    },
    {
      id: "1002",
      media_type: "CAROUSEL_ALBUM",
      media_url: img("dessert-cover"),
      permalink: "https://www.instagram.com/p/demo1002/",
      timestamp: "2026-06-18T11:30:00+0000",
      like_count: 521,
      comments_count: 2,
      caption:
        "주말 한정 수제 디저트 라인업 🍰\n\n바스크 치즈케이크, 클래식 티라미수, 제철 과일 타르트까지. 커피와 가장 잘 어울리는 조합으로 준비했습니다.\n\n#수제디저트 #치즈케이크 #티라미수 #카페디저트",
      children: {
        data: [
          { id: "1002a", media_type: "IMAGE", media_url: img("dessert1") },
          { id: "1002b", media_type: "IMAGE", media_url: img("dessert2") },
          { id: "1002c", media_type: "IMAGE", media_url: img("dessert3") },
        ],
      },
    },
    {
      id: "1003",
      media_type: "VIDEO",
      media_url: "https://example.com/video.mp4",
      thumbnail_url: img("latteart"),
      permalink: "https://www.instagram.com/p/demo1003/",
      timestamp: "2026-06-15T15:00:00+0000",
      like_count: 198,
      comments_count: 1,
      caption:
        "라떼아트 클래스 모집 ☕️\n\n매주 토요일 오후, 소수 정예로 진행하는 라떼아트 원데이 클래스입니다. 초보자도 환영해요. 자세한 일정은 프로필 링크를 확인해주세요.\n\n#라떼아트 #원데이클래스 #바리스타 @barista_kim",
    },
    {
      id: "1004",
      media_type: "IMAGE",
      media_url: img("interior"),
      permalink: "https://www.instagram.com/p/demo1004/",
      timestamp: "2026-06-10T08:00:00+0000",
      like_count: 410,
      comments_count: 2,
      caption:
        "새단장한 매장 내부를 공개합니다\n\n따뜻한 우드톤과 큰 창으로 햇살이 가득 들어오는 공간이에요. 노트북 작업, 모임, 혼커피 모두 환영합니다. 콘센트도 넉넉해요!\n\n#카페인테리어 #분위기좋은카페 #작업하기좋은카페",
    },
  ];

  const comments: Record<string, IgComment[]> = {
    "1001": [
      { id: "c1", text: "예가체프 너무 좋아요! 다음 주에 들를게요 ☕️", username: "coffee_lover_99", timestamp: "2026-06-20T10:12:00+0000", like_count: 5 },
      { id: "c2", text: "원두 200g 온라인 주문도 되나요?", username: "morning_brew", timestamp: "2026-06-20T12:40:00+0000", like_count: 1 },
    ],
    "1002": [
      { id: "c3", text: "바스크 치즈케이크 인생 디저트입니다 🍰", username: "dessert_diary", timestamp: "2026-06-18T13:05:00+0000", like_count: 8 },
      { id: "c4", text: "티라미수 재입고 언제 되나요?", username: "sweettooth_kim", timestamp: "2026-06-18T15:22:00+0000", like_count: 2 },
    ],
    "1003": [
      { id: "c5", text: "지난 클래스 정말 유익했어요. 또 신청합니다!", username: "latte_newbie", timestamp: "2026-06-15T16:30:00+0000", like_count: 4 },
    ],
    "1004": [
      { id: "c6", text: "분위기 너무 좋네요, 작업하러 가야겠어요 💻", username: "remote_worker", timestamp: "2026-06-10T09:10:00+0000", like_count: 3 },
      { id: "c7", text: "콘센트 많은 카페 최고죠 👍", username: "cafe_hopper", timestamp: "2026-06-10T11:45:00+0000", like_count: 6 },
    ],
  };

  return { profile, media, comments };
}
