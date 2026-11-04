#!/usr/bin/env python3
"""
Test Suite for Brush Reveal Effect Module
Couple-Calendar v2.3.0
Worker Session Unit Tests
"""

import unittest
import os
import subprocess
import re

MODULE_JS = '/Users/yohan/couple-calendar/modules/brush_reveal_effect.js'
MODULE_CSS = '/Users/yohan/couple-calendar/modules/brush_reveal.css'

class TestBrushRevealModule(unittest.TestCase):

    def setUp(self):
        self.assertTrue(os.path.exists(MODULE_JS), "brush_reveal_effect.js 파일이 존재하지 않습니다.")
        self.assertTrue(os.path.exists(MODULE_CSS), "brush_reveal.css 파일이 존재하지 않습니다.")
        with open(MODULE_JS, 'r', encoding='utf-8') as f:
            self.js_code = f.read()
        with open(MODULE_CSS, 'r', encoding='utf-8') as f:
            self.css_code = f.read()

    def test_01_files_exist_and_non_empty(self):
        """1. JS와 CSS 모듈 파일이 정상 크기로 존재하는지 검증"""
        self.assertGreater(len(self.js_code), 500, "JS 파일 크기가 너무 작습니다.")
        self.assertGreater(len(self.css_code), 300, "CSS 파일 크기가 너무 작습니다.")

    def test_02_node_import_brush_reveal_engine(self):
        """2. Node.js CommonJS 환경에서 모듈이 정상 require() 되는지 검증"""
        cmd = [
            'node', '-e',
            "const engine = require('./modules/brush_reveal_effect.js'); "
            "if (!engine || typeof engine !== 'object') process.exit(1); "
            "console.log('OK');"
        ]
        res = subprocess.run(cmd, cwd='/Users/yohan/couple-calendar', capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, f"Node.js import 실패: {res.stderr}")
        self.assertIn("OK", res.stdout)

    def test_03_engine_has_attach_api(self):
        """3. BrushRevealEngine.attach API 함수 존재 및 함수 타입 검증"""
        cmd = [
            'node', '-e',
            "const engine = require('./modules/brush_reveal_effect.js'); "
            "if (typeof engine.attach !== 'function') process.exit(1); "
            "console.log('ATTACH_OK');"
        ]
        res = subprocess.run(cmd, cwd='/Users/yohan/couple-calendar', capture_output=True, text=True)
        self.assertEqual(res.returncode, 0)
        self.assertIn("ATTACH_OK", res.stdout)

    def test_04_engine_has_sweep_reveal_api(self):
        """4. BrushRevealEngine.sweepReveal API 함수 존재 검증"""
        cmd = [
            'node', '-e',
            "const engine = require('./modules/brush_reveal_effect.js'); "
            "if (typeof engine.sweepReveal !== 'function') process.exit(1); "
            "console.log('SWEEP_OK');"
        ]
        res = subprocess.run(cmd, cwd='/Users/yohan/couple-calendar', capture_output=True, text=True)
        self.assertEqual(res.returncode, 0)
        self.assertIn("SWEEP_OK", res.stdout)

    def test_05_engine_has_burst_sparkles_api(self):
        """5. BrushRevealEngine.burstSparkles API 함수 존재 검증"""
        cmd = [
            'node', '-e',
            "const engine = require('./modules/brush_reveal_effect.js'); "
            "if (typeof engine.burstSparkles !== 'function') process.exit(1); "
            "console.log('SPARKLES_OK');"
        ]
        res = subprocess.run(cmd, cwd='/Users/yohan/couple-calendar', capture_output=True, text=True)
        self.assertEqual(res.returncode, 0)
        self.assertIn("SPARKLES_OK", res.stdout)

    def test_06_engine_has_calculate_scratched_percent_api(self):
        """6. BrushRevealEngine.calculateScratchedPercent API 함수 존재 검증"""
        cmd = [
            'node', '-e',
            "const engine = require('./modules/brush_reveal_effect.js'); "
            "if (typeof engine.calculateScratchedPercent !== 'function') process.exit(1); "
            "console.log('CALC_OK');"
        ]
        res = subprocess.run(cmd, cwd='/Users/yohan/couple-calendar', capture_output=True, text=True)
        self.assertEqual(res.returncode, 0)
        self.assertIn("CALC_OK", res.stdout)

    def test_07_css_unrevealed_properties(self):
        """7. .note-content.unrevealed 스타일이 8px 블러 및 0.15 불투명도를 갖는지 검증"""
        self.assertIn(".note-content.unrevealed", self.css_code)
        match = re.search(r'\.note-content\.unrevealed\s*\{([^}]+)\}', self.css_code)
        self.assertTrue(match, ".note-content.unrevealed 블록을 찾을 수 없습니다.")
        block = match.group(1)
        self.assertIn("blur(8px)", block)
        self.assertIn("0.15", block)

    def test_08_css_revealed_properties(self):
        """8. .note-content.revealed 스타일이 0px 블러 및 400ms transition을 갖는지 검증"""
        self.assertIn(".note-content.revealed", self.css_code)
        match = re.search(r'\.note-content\.revealed\s*\{([^}]+)\}', self.css_code)
        self.assertTrue(match, ".note-content.revealed 블록을 찾을 수 없습니다.")
        block = match.group(1)
        self.assertIn("blur(0px)", block)
        self.assertIn("400ms", block)

    def test_09_css_container_and_canvas_styles(self):
        """9. .brush-reveal-container 및 .brush-reveal-canvas 선택자 정의 검증"""
        self.assertIn(".brush-reveal-container", self.css_code)
        self.assertIn(".brush-reveal-canvas", self.css_code)
        self.assertIn("touch-action: none", self.css_code)

    def test_10_css_guide_chip_and_pulse_animation(self):
        """10. .brush-reveal-guide 칩 및 @keyframes pulseGuide 키프레임 검증"""
        self.assertIn(".brush-reveal-guide", self.css_code)
        self.assertIn("@keyframes pulseGuide", self.css_code)
        self.assertIn("backdrop-filter", self.css_code)

    def test_11_css_sparkle_particle_keyframes(self):
        """11. .sparkle-particle 및 @keyframes burstParticle 키프레임 검증"""
        self.assertIn(".sparkle-particle", self.css_code)
        self.assertIn("@keyframes burstParticle", self.css_code)

    def test_12_mock_burst_sparkles_execution(self):
        """12. 가상 DOM 환경에서 burstSparkles() 실행 시 8개의 파티클 생성 검증"""
        node_script = """
        global.document = {
            createElement: function(tag) {
                return {
                    tagName: tag,
                    className: '',
                    textContent: '',
                    style: {
                        left: '', top: '',
                        setProperty: function(k, v) { this[k] = v; }
                    }
                };
            }
        };
        const engine = require('./modules/brush_reveal_effect.js');
        const children = [];
        const container = {
            appendChild: function(c) { children.push(c); }
        };
        engine.burstSparkles(100, 100, container);
        if (children.length !== 8) {
            console.error('Expected 8 particles, got ' + children.length);
            process.exit(1);
        }
        console.log('SPARKLES_COUNT_OK_8');
        """
        cmd = ['node', '-e', node_script]
        res = subprocess.run(cmd, cwd='/Users/yohan/couple-calendar', capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, f"Mock execution failed: {res.stderr}")
        self.assertIn("SPARKLES_COUNT_OK_8", res.stdout)

    def test_13_index_html_includes_brush_reveal_assets(self):
        """13. index.html에 brush_reveal.css 및 brush_reveal_effect.js가 포함되어 있는지 검증"""
        with open('/Users/yohan/couple-calendar/index.html', 'r', encoding='utf-8') as f:
            html = f.read()
        self.assertIn('href="modules/brush_reveal.css"', html)
        self.assertIn('src="modules/brush_reveal_effect.js"', html)

    def test_14_index_html_attaches_brush_reveal_to_unread_notes(self):
        """14. index.html에서 미확인 쪽지에 BrushRevealEngine.attach가 연동되어 있는지 검증"""
        with open('/Users/yohan/couple-calendar/index.html', 'r', encoding='utf-8') as f:
            html = f.read()
        self.assertIn('BrushRevealEngine.attach', html)

    def test_15_sw_caches_brush_reveal_modules(self):
        """15. sw.js 캐시 목록에 brush_reveal 파일들이 포함되어 있는지 검증"""
        with open('/Users/yohan/couple-calendar/sw.js', 'r', encoding='utf-8') as f:
            sw = f.read()
        self.assertIn('modules/brush_reveal.css', sw)
        self.assertIn('modules/brush_reveal_effect.js', sw)


if __name__ == '__main__':
    unittest.main()

