#!/usr/bin/env python3
"""
Test Suite for Realtime Sync Engine (v2.4.0)
Couple-Calendar - Track Realtime-C
"""

import unittest
import os
import subprocess
import json

REPO_ROOT = '/Users/yohan/couple-calendar'

class TestRealtimeSyncEngine(unittest.TestCase):

    def setUp(self):
        self.engine_path = os.path.join(REPO_ROOT, 'modules', 'realtime_sync_engine.js')
        self.css_path = os.path.join(REPO_ROOT, 'modules', 'realtime_sync.css')
        self.assertTrue(os.path.exists(self.engine_path), "realtime_sync_engine.js 파일이 존재해야 함")
        self.assertTrue(os.path.exists(self.css_path), "realtime_sync.css 파일이 존재해야 함")
        with open(self.css_path, encoding='utf-8') as f:
            self.css_content = f.read()

    def _eval_js(self, js_expr):
        runner = f"""
        const RealtimeSyncEngine = require('{self.engine_path}');
        const result = ({js_expr});
        console.log(JSON.stringify(result));
        """
        proc = subprocess.run(['node', '-e', runner], capture_output=True, text=True, check=True)
        return json.loads(proc.stdout.strip())

    def test_engine_file_exists(self):
        self.assertTrue(os.path.exists(self.engine_path))

    def test_engine_exports_required_methods(self):
        res = self._eval_js("""
            (() => {
                return {
                    hasInit: typeof RealtimeSyncEngine.init === 'function',
                    hasBroadcast: typeof RealtimeSyncEngine.broadcastDelta === 'function',
                    hasOnDelta: typeof RealtimeSyncEngine.onDeltaReceived === 'function',
                    hasOnStatus: typeof RealtimeSyncEngine.onStatusChange === 'function',
                    hasLatency: typeof RealtimeSyncEngine.getLatency === 'function',
                    hasStatus: typeof RealtimeSyncEngine.getStatus === 'function',
                    hasDisconnect: typeof RealtimeSyncEngine.disconnect === 'function'
                };
            })()
        """)
        for k, v in res.items():
            self.assertTrue(v, f"{k} 메서드가 존재해야 함")

    def test_broadcastDelta_structure(self):
        res = self._eval_js("""
            (() => {
                const delta = RealtimeSyncEngine.broadcastDelta('notes', 'create', { id: 'n-99', content: '실시간 쪽지' }, 'user1');
                return delta;
            })()
        """)
        self.assertTrue(res.get('id', '').startswith('delta_'))
        self.assertEqual(res.get('entityType'), 'notes')
        self.assertEqual(res.get('action'), 'create')
        self.assertEqual(res.get('senderRole'), 'user1')
        self.assertEqual(res.get('item', {}).get('id'), 'n-99')
        self.assertIsNotNone(res.get('timestamp'))

    def test_broadcastDelta_different_entities(self):
        res = self._eval_js("""
            (() => {
                const sDelta = RealtimeSyncEngine.broadcastDelta('schedules', 'update', { id: 's-1' }, 'user2');
                const lDelta = RealtimeSyncEngine.broadcastDelta('ledger', 'delete', { id: 'tx-1' }, 'user1');
                return { sType: sDelta.entityType, lType: lDelta.entityType, lAction: lDelta.action };
            })()
        """)
        self.assertEqual(res['sType'], 'schedules')
        self.assertEqual(res['lType'], 'ledger')
        self.assertEqual(res['lAction'], 'delete')

    def test_initial_latency_metric(self):
        res = self._eval_js("RealtimeSyncEngine.getLatency()")
        self.assertIsInstance(res, int)
        self.assertGreater(res, 0)
        self.assertLess(res, 200, "초저지연 핑은 200ms 미만이어야 함")

    def test_css_classes_exist(self):
        required_selectors = [
            '.sync-status-badge.live',
            '.sync-latency-pill',
            '.delta-flash',
            '@keyframes deltaFlashHighlight',
            '@keyframes livePulse'
        ]
        for sel in required_selectors:
            self.assertIn(sel, self.css_content, f"CSS 선택자 {sel} 누락")

    def test_css_reduced_motion_supported(self):
        self.assertIn('@media (prefers-reduced-motion: reduce)', self.css_content)

if __name__ == '__main__':
    unittest.main()
