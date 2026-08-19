import type { Dictionary } from "./ko";

/** 简体中文。事实信息（地址、交通、停车、设施、营业时间）与韩文版一致。 */
export const zh: Dictionary = {
  meta: {
    siteTagline: "首尔圣水洞儿童摄影工作室｜周岁照 · 全家福",
    description:
      "「No posed, Just Kidding!」首尔圣水洞的儿童摄影工作室。不摆拍，在孩子玩耍的瞬间记录自然的表情。周岁照、全家福、宝宝写真。",
    titleSuffix: "圣水洞儿童摄影工作室",
    keywords: [
      "首尔儿童摄影",
      "圣水洞 写真",
      "韩国周岁照",
      "首尔全家福",
      "首尔林 摄影棚",
      "韩国宝宝写真",
      "圣水 场地租赁",
      "首尔百日照",
    ],
  },

  ui: {
    book: "预约拍摄咨询",
    bookViaKakao: "通过 KakaoTalk 预约",
    scroll: "Scroll",
    scrollHint: "跳至正文",
    homeAria: "回到首页",
    language: "语言",
    viewOnInstagram: "在 Instagram 查看原贴 →",
    naverMap: "在 NAVER 地图查看 →",
    googleMap: "在 Google 地图查看 →",
    photoCount: (n: number) => `${n} 张照片`,
    video: "视频",
    enlarge: (title: string, i: number) => `放大查看 ${title} 第 ${i} 张照片`,
    close: "关闭",
    prevPhoto: "上一张",
    nextPhoto: "下一张",
    lightboxLabel: (title: string) => `查看 ${title} 的照片`,
  },

  hero: {
    tagline: "No posed, Just Kidding!",
  },

  statement: {
    label: "工作室理念",
    lines: [
      "No posed, Just Kidding!",
      "我们不摆拍。孩子尽情玩耍的时候，",
      "镜头在等待最可爱的瞬间。",
    ],
  },

  story: {
    eyebrow: "Story",
    title: "我们怎么拍",
    intro: " 是位于首尔城东区圣水洞的儿童摄影工作室。",
    lead: "我们不说「看这里、笑一个」这样让人别扭的话，而是决定就这么陪着玩。不强求完美的照片。孩子玩闹的时候，相机在旁边等着那个自然而然的瞬间。",
    items: [
      {
        heading: "名字就是拍法",
        body: "kidding 是「顽皮、闹着玩」的意思。这既是工作室取这个名字的理由，也是我们唯一的想法。与其指挥孩子「看这里、笑一个」，不如让他自己玩——相机在一旁等着。",
      },
      {
        heading: "不强求完美的照片",
        body: "比起工整的构图，我们更先看这个孩子适合怎样的气氛。因为我们相信，笑着、玩得开心的那一刻才是最好看的样子。所以成片里留下的，更多是那天真实的表情，而不是排练好的姿势。",
      },
      {
        heading: "像游乐场一样的空间",
        body: "我们不想做一个换上漂亮衣服、拍完照就走的地方，而想做一个孩子能像在自己最喜欢的玩具房里一样尽情笑、尽情闹的地方。圣水洞这间几乎由我们亲手布置的工作室，就是从这个想法开始的。",
      },
    ],
  },

  services: {
    eyebrow: "Services",
    title: "拍摄项目",
    lead: "从周岁照到全家福、成长记录，按孩子的月龄和场合安排。具体日程与需要准备的东西会在咨询时说明。",
    items: [
      {
        name: "周岁照拍摄",
        description:
          "在圣水洞记录孩子的第一个生日。不要求固定姿势，拍下孩子玩闹之间的表情。",
      },
      {
        name: "百日 · 成长记录",
        description: "从 50 天、百日纪念到成长快照，按时期记录孩子长大的样子。",
      },
      {
        name: "全家福",
        description: "父母和孩子一起入镜。比起排得整整齐齐的构图，更看重这个家庭本来的气氛。",
      },
      {
        name: "场地租赁",
        description: "出租圣水洞的工作室空间。有自然光的拍摄空间，可用于您自己的拍摄。",
      },
    ],
  },

  gallery: {
    eyebrow: "Gallery",
    title: "近期拍摄",
    lead: "发布在 Instagram 上的拍摄记录。",
    empty: "还没有同步到任何帖子。",
    related: "其他拍摄记录",
    scrollPrev: "查看上一组",
    scrollNext: "查看下一组",
    comments: "评论",
  },

  faq: {
    eyebrow: "FAQ",
    title: "常见问题",
    lead: "预约、位置、停车——拍摄前大家最常确认的内容。",
    items: [
      {
        q: "kidding seongsu 是一家怎样的工作室？",
        a: "位于首尔城东区圣水洞的儿童摄影工作室。正如「No posed, Just Kidding!」这个名字，我们不会说「看这里、笑一个」，而是让孩子尽情玩，拍下其间自然的瞬间。提供周岁照、全家福、百日及成长记录拍摄，也出租场地。",
      },
      {
        q: "怎么预约和咨询？",
        a: "通过 KakaoTalk 频道接受预约与咨询，也可以从 Instagram @kidding.seongsu 主页下方的链接进入。欢迎用中文联系。",
      },
      {
        q: "怎么过去？",
        a: "首尔城东区纛岛路4街 21-1 三层。从水仁盆唐线首尔林站 2 号出口，或 2 号线圣水站 4 号出口步行约 10 分钟。",
      },
      {
        q: "有停车位吗？",
        a: "建筑内侧有停车位，每次预约可免费停放 1 辆车。其余车辆请使用附近的停车场。",
      },
      {
        q: "营业时间是？",
        a: "周一至周五 10:00–19:00，周六与周日 10:00–18:00。拍摄采取预约制。",
      },
      {
        q: "带宝宝过去方便吗？",
        a: "备有儿童座椅，也支持免接触支付。",
      },
      {
        q: "可以带宠物一起拍吗？",
        a: "可以带宠物。请务必自备牵引绳和宠物尿垫（纸尿裤）。",
      },
    ],
  },

  location: {
    eyebrow: "Location",
    title: "交通与位置",
    lead: "位于首尔林站与圣水站之间的圣水洞。拍摄采取预约制。",
    address: "地址",
    addressForMaps: "用于地图应用和出租车",
    postalCode: (code: string) => `邮编 ${code}`,
    hours: "营业时间",
    hoursWeekday: "周一至周五 10:00 – 19:00",
    hoursWeekend: "周六 · 周日 10:00 – 18:00",
    hoursShort: "周一至周五 10:00–19:00 · 周末 10:00–18:00（预约制）",
    phone: "电话",
    directions: "怎么走",
    directionsItems: [
      "水仁盆唐线 首尔林站 2 号出口步行约 10 分钟",
      "2 号线 圣水站 4 号出口步行约 10 分钟",
      "可使用建筑内侧停车场（免费 1 辆，其余请用附近停车场）",
    ],
    amenities: "设施",
    amenityItems: [
      "儿童座椅",
      "可停车",
      "可带宠物",
      "免接触支付",
      "预约制",
    ],
  },

  book: {
    eyebrow: "Reservation",
    title: "在计划拍摄吗？",
    body: "告诉我们希望的日期和孩子的月龄，我们会回复可预约的时段。",
  },

  footer: {
    studio: "工作室",
    links: "快速链接",
    about: "关于工作室",
    privacy: "隐私政策",
    kakao: "KakaoTalk 预约",
    syncNote: "帖子由官方 Instagram 自动同步。",
  },

  notFound: {
    title: "找不到该页面",
    body: "可能是网址有误，或该帖子已被删除或修改。",
    home: "回到首页",
  },

  privacy: {
    title: "隐私政策",
    metaDescription: "关于本网站如何处理个人信息的说明。",
    intro: " 不通过本网站收集用户的个人信息。以下是本网站处理哪些信息的说明。",
    clauses: [
      {
        title: "1. 我们收集的个人信息",
        body: [
          "本网站没有注册、登录或咨询表单等需要输入个人信息的功能。因此我们不会收集或保存姓名、联系方式、邮箱等任何个人信息。",
        ],
      },
      {
        title: "2. 网站上的内容",
        body: [
          "本网站显示的照片与文字，来自工作室运营的官方 Instagram 账号，通过 Instagram 官方 API 获取后展示。拍摄照片的发布均在被拍摄者同意的范围内进行。",
          "如希望删除已发布的照片，请通过下方联系方式联系我们，核实后会尽快撤下。",
        ],
      },
      {
        title: "3. Cookie 与分析工具",
        body: [
          "本网站不使用广告或追踪用途的 Cookie。托管服务可能出于运营与安全目的临时记录访问日志（IP 地址、浏览器类型等），工作室不会单独查阅或保存这些记录。",
        ],
      },
      {
        title: "4. 外部链接",
        body: [
          "本网站包含指向 Instagram、KakaoTalk 频道、地图服务等外部网站的链接。这些网站上的个人信息处理，遵循各自的隐私政策。",
        ],
      },
      {
        title: "5. 联系方式",
        body: [
          "关于隐私或网站内容的咨询，请通过 KakaoTalk 频道或 Instagram 私信与我们联系。",
        ],
      },
      {
        title: "6. 政策变更",
        body: ["本隐私政策如有变更，将在本页面公告。"],
      },
    ],
  },
};
