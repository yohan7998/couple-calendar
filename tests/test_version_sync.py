import re
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

class VersionSyncTestCase(unittest.TestCase):
    """
    달콤살벌 캘린더 버전 정합성 검증 테스트 슈트
    헤더 뱃지, 타이틀, 메타 태그, PWA Service Worker 캐시, JS 전역 상수가
    단 1글자의 오차도 없이 100% 일치하는지 정밀 검증
    """

    def setUp(self):
        self.index_path = REPO_ROOT / 'index.html'
        self.sw_path = REPO_ROOT / 'sw.js'
        self.assertTrue(self.index_path.exists(), "index.html이 존재해야 합니다.")
        self.assertTrue(self.sw_path.exists(), "sw.js가 존재해야 합니다.")
        self.index_content = self.index_path.read_text(encoding='utf-8')
        self.sw_content = self.sw_path.read_text(encoding='utf-8')

    def test_title_and_meta_version_match(self):
        # 1. <title>달콤살벌 캘린더 💖⚔️ (v3.X.X)</title>
        title_match = re.search(r'<title>달콤살벌 캘린더 💖⚔️ \((v\d+\.\d+\.\d+)\)</title>', self.index_content)
        self.assertIsNotNone(title_match, "index.html의 <title>에 버전이 명시되어 있어야 합니다.")
        title_version = title_match.group(1)

        # 2. <meta name="version" content="v3.X.X">
        meta_match = re.search(r'<meta\s+name=["\']version["\']\s+content=["\'](v\d+\.\d+\.\d+)["\']', self.index_content)
        self.assertIsNotNone(meta_match, "index.html의 <meta name='version'>이 명시되어 있어야 합니다.")
        meta_version = meta_match.group(1)
        self.assertEqual(title_version, meta_version, f"title 버전({title_version})과 meta 버전({meta_version})이 일치해야 합니다.")

        # 3. APP_CURRENT_VERSION 상수
        const_match = re.search(r'const\s+APP_CURRENT_VERSION\s*=\s*[\'"](v\d+\.\d+\.\d+)[\'"]', self.index_content)
        self.assertIsNotNone(const_match, "index.html에 APP_CURRENT_VERSION 상수가 정의되어 있어야 합니다.")
        const_version = const_match.group(1)
        self.assertEqual(title_version, const_version, f"title 버전({title_version})과 APP_CURRENT_VERSION({const_version})이 일치해야 합니다.")

        # 4. 헤더 뱃지 텍스트
        badge_match = re.search(r'class=["\']app-version-badge["\'][^>]*>(v\d+\.\d+\.\d+)\s*🥕</span>', self.index_content)
        self.assertIsNotNone(badge_match, "index.html의 .app-version-badge에 당근 이모지와 함께 버전이 표기되어 있어야 합니다.")
        badge_version = badge_match.group(1)
        self.assertEqual(title_version, badge_version, f"title 버전({title_version})과 헤더 뱃지 버전({badge_version})이 일치해야 합니다.")

        # 5. Service Worker CACHE_NAME
        sw_match = re.search(r'const\s+CACHE_NAME\s*=\s*[\'"]couple-calendar-(v\d+\.\d+\.\d+)[\'"]', self.sw_content)
        self.assertIsNotNone(sw_match, "sw.js의 CACHE_NAME에 버전이 명시되어 있어야 합니다.")
        sw_version = sw_match.group(1)
        self.assertEqual(title_version, sw_version, f"title 버전({title_version})과 sw.js CACHE_NAME 버전({sw_version})이 일치해야 합니다.")

    def test_no_legacy_hardcoded_versions_in_html(self):
        """과거 버전(v3.3.0, v2.8.6 등) 잔재가 index.html에 남아있지 않아야 함"""
        self.assertNotIn('v3.3.0', self.index_content, "index.html에 과거 버전 v3.3.0 잔재가 없어야 합니다.")
        self.assertNotIn('v2.8.6', self.index_content, "index.html에 과거 버전 v2.8.6 잔재가 없어야 합니다.")

if __name__ == '__main__':
    unittest.main()
