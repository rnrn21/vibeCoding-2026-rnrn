실행: 압축을 풀고 index.html을 Chrome/Edge에서 여세요. 인터넷 연결이나 설치가 필요 없습니다.
폴더 전체를 함께 복사해야 합니다.

기존 사이트에 넣기 (폴더 경로는 프로젝트에 맞게 변경):
<iframe src="./hanmi-eye-tracking/embed.html" title="걷는 캐릭터" style="display:block;width:100%;aspect-ratio:16/9;border:0" loading="lazy"></iframe>

직접 삽입: player.css 연결 → data-hanmi-walker 요소 복사 → metadata.js, player.js 순으로 연결.
스크립트는 해당 요소 뒤에 넣으세요. 이미지 경로는 player.js 위치를 기준으로 자동 계산합니다.
모션 감소 설정이 켜진 사용자는 정지 화면으로 시작합니다. 데모에서 재생 버튼으로 시작할 수 있습니다.

시선 추적은 원본 기능이 아닌 추가 구현입니다. 원본 이미지 위에 흰자·눈동자를 새로 합성합니다.
프레임마다 눈 좌표가 달라 metadata.js의 eyes에 73프레임의 좌표를 넣었습니다.

원본 이미지 출처: https://2026recruitment.hanmi.co.kr/img/run_gif/
73장, 25fps, 2.92초 반복. 원본 PNG 파일은 수정하지 않았습니다.
