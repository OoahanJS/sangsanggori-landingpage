# 상상고리 랜딩 페이지 — sangsanggori.com

명함 QR로 들어오는 회사 소개 페이지. 빌드 도구 없는 정적 사이트다. 파일을 고쳐서 `main`에 올리면 1분쯤 뒤 반영된다.

## 구조

| 파일 | 내용 |
|---|---|
| `index.html` | 첫 페이지 (기관·업체용). 6단락: 펴내고 잇다 → 「나의 이름은」 → 하는 일 → 숫자·함께한 곳 → 해온 일 → 대표 → 연락처 |
| `producers.html` | 생산자 집짓기 페이지 (집 + 이야기방, 함께 짓는 방식, 약속). "홈페이지"라는 흔한 말 대신 "집"과 "이야기방"으로 부른다 |
| `style.css` | 두 페이지 공통 스타일. 색·글꼴은 맨 위 `:root`에 있다 |
| `app.js` | 왼쪽 선이 채워지는 효과, 단락이 떠오르는 효과 |
| `player.js` | 영상을 페이지 안 팝업에서 재생 |
| `assets/` | 로고, QR, 공유 이미지(`og.png`), `video/`(줄인 영상과 표지) |
| `tools/make_qr.py` | QR 만들기: `python tools/make_qr.py "주소" assets/qr-이름.svg` |
| `contact.vcf` | "연락처 저장" 파일 |

## 올리는 법

```
git add -A
git commit -m "무엇을 바꿨는지"
git pull --rebase origin main
git push origin main
```

- 호스팅: GitHub Pages (저장소 `OoahanJS/sangsanggori-landingpage`, `main` 브랜치, `CNAME` 파일).
- DNS와 메일 전달은 워드프레스닷컴 도메인 설정에 있다. 네임서버를 옮기거나 워드프레스 요금제를 사지 않는다.
- `style.css`, `app.js`, `player.js`를 고치면 `index.html`·`producers.html` 안의 `?v=숫자`도 바꾼다. 안 바꾸면 방문자 휴대폰에 예전 파일이 남는다.
- 리뉴얼 전 페이지는 태그 `v1-landing`에 있다.

## 자주 하는 업데이트

**실적 한 줄 추가** — `index.html`의 `<ul class="index">` 안에 최신 것이 위로 오게 넣는다.

```html
<li><span class="yr">2027</span><div><h3>기관 — 한 일</h3><p>한 줄 설명.</p></div></li>
```

유튜브 영상을 붙이려면 `</div>` 뒤에 추가한다 (세로 영상은 `data-shape="short"`).

```html
<a class="go" data-yt="영상ID" data-shape="wide" href="https://youtu.be/영상ID" rel="noopener">▶ 보기</a>
```

**함께한 기관·기업 추가** — `<p class="partners">` 안에 ` · 이름`을 잇는다. 10곳이 넘어가면 숫자 띠의 `10+`도 고친다.

**「나의 이름은」 얼굴 추가** — 원본을 줄여 `assets/video/`에 넣고 `<ul class="faces">`에 `<li>`를 복사해 이름만 바꾼다.

```
ffmpeg -i 원본.mp4 -vf "scale=540:960,fps=30" -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -c:a aac -b:a 80k -movflags +faststart assets/video/myname-이름-01.mp4
ffmpeg -ss 1.5 -i 원본.mp4 -frames:v 1 -vf "scale=540:960" -q:v 4 assets/video/myname-이름-01.jpg
```

**공유 이미지(`assets/og.png`)** — 첫 화면이 바뀌면 1200×630으로 다시 캡처한다.

## 지킬 것 (지숙 결정)

- 주소는 **"대전광역시 서구"까지만**. 도로명·호수는 쓰지 않는다.
- 연락 메일은 `contact@sangsanggori.com`. 개인 메일 주소는 페이지에 쓰지 않는다.
- 바탈스톤은 작게만 (제호, 소설 실적, WEB 줄). 채널처럼 크게 내세우지 않는다.
- 로컬헌터는 "제작 · 운영 참여" 실적으로만. 채널 영상을 끌어다 붙이지 않는다.
- 업체 사이트 링크와 새 기관·업체 이름은 **지숙이 확인한 뒤** 넣는다. 영상 속 사람도 동의를 받은 뒤에 올린다.
- 막사발 문법은 핵심 문장만. 내레이션 규칙 같은 방법은 공개하지 않는다.
- 아직 공개하지 않은 사업은 지숙이 말하기 전에는 넣지 않는다.
- 가격, 폼 주소, 프롬프트, 문서 ID는 넣지 않는다.
- 디자인: 종이색·먹색에 빨강 하나, 쪽빛은 "잇다"에만. 진한 띠는 숫자 띠 하나. 3D 모형은 쓰지 않는다 (로고는 실제 그림 그대로).
- 푸터 문구 `JsisOn OÜ (Estonia, 2025)` / `한국 독점 라이선스 운영: 상상고리`는 그대로 둔다.
