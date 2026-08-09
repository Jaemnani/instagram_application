# 워드마크 폰트 (Geo Sans Light)

로고 서체로 쓸 **Geo Sans Light** 파일을 이 폴더에 넣으면 자동으로 적용됩니다.
파일이 없으면 Poppins 로 조용히 폴백하므로 빌드나 화면이 깨지지 않습니다.

## 넣을 파일 이름 (둘 중 하나 이상)

    public/fonts/GeoSansLight.woff2   ← 권장 (용량 가장 작음)
    public/fonts/GeoSansLight.ttf     ← TTF 만 있어도 동작

woff2 변환은 https://transfonter.org 같은 도구로 가능합니다.

## ⚠️ 라이선스 확인 필요

Geo Sans Light(Manfred Klein, 2003)는 배포처마다 라이선스 표기가 엇갈립니다.
- FontSpace: 개인용만, 상업용은 디자이너에게 별도 구매
- 일부 배포처: 상업적 사용·수정·재배포 허용

사업체 웹사이트에 쓰기 전에 디자이너(manfred-klein.ina-mar.com) 또는
받으신 배포처의 라이선스 파일(readme)로 상업적 사용 가능 여부를 확인하세요.

적용 지점: `app/globals.css` 의 @font-face 와 `--font-brand-display`
