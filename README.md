# 모서리 공작소 (MOSEORI) — 인테리어 업체 홈페이지

> 홈페이지 제작 포트폴리오용 **가상 브랜드**입니다. 사진은 Higgsfield(GPT Image 2.6)로 생성했습니다.

**사이트:** https://tpdms0159.github.io/moseori-interior/

구축 아파트 리모델링·맞춤 목공 업체 컨셉의 4페이지 정적 사이트입니다.

| 페이지 | 내용 |
|---|---|
| `index.html` | 블라인드 히어로, 평면도 드로잉, 대표 사례, 페인트 롤러 비포·애프터, 조명 스위치 |
| `studio.html` | 작업실 소개, 접힌 도면 카드, 수평계 반응 진행 과정, 사람·위치 |
| `works.html` | 서랍형 사례 카드, FLIP 필터, 벽지처럼 펼쳐지는 상세 |
| `contact.html` | 평수 슬라이더 실시간 평면·견적, 상담 폼(도장 확인) |

## 기술
- HTML / CSS / Vanilla JS, 빌드 도구 없음
- 폰트: Hahmlet(제목) · Pretendard(본문) · Newsreader Italic(숫자·영문) — 자간은 넓히지 않음
- `prefers-reduced-motion` 대응, 터치 기기에서는 줄자 커서 비활성

기획·인터랙션 상세는 [PLAN.md](PLAN.md) 참고.

## 로컬 실행
```bash
python3 -m http.server 5191
```
