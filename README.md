# myTravelNote

여행 계획을 위한 프로젝트입니다.

## 설정 방법

### Google Maps MCP 서버 설정 (선택사항)

1. **Google Maps API 키 발급**
   - Google Cloud Console에서 프로젝트 생성
   - Maps JavaScript API, Places API, Geocoding API 활성화
   - API 키 생성

2. **MCP 서버 설치**
   ```bash
   git clone https://github.com/modelcontextprotocol/servers-archived.git
   cd servers-archived/src/google-maps
   npm install
   npm run build
   ```

3. **Claude Desktop 설정**
   - `claude_desktop_config.json` 파일 생성
   - API 키 설정 (절대 git에 커밋하지 마세요!)

## 보안 주의사항

- API 키는 절대 git에 커밋하지 마세요
- `.gitignore`에 설정 파일들이 포함되어 있습니다
- 개인 설정 파일은 로컬에서만 관리하세요