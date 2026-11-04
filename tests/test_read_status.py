#!/usr/bin/env python3
"""
Test Suite for Read Status Engine
Couple-Calendar v2.2.0 - Track Read-C
"""

import unittest
import os
import subprocess
import json

class TestReadStatusEngine(unittest.TestCase):

    def setUp(self):
        self.engine_path = '/Users/yohan/couple-calendar/modules/read_status_engine.js'
        self.css_path = '/Users/yohan/couple-calendar/modules/read_status.css'
        self.assertTrue(os.path.exists(self.engine_path), "read_status_engine.js 파일이 존재하지 않습니다.")
        self.assertTrue(os.path.exists(self.css_path), "read_status.css 파일이 존재하지 않습니다.")
        with open(self.css_path, encoding='utf-8') as f:
            self.css_content = f.read()

    def _eval_js(self, js_expr):
        runner = f"""
        const ReadStatusEngine = require('{self.engine_path}');
        const result = ({js_expr});
        console.log(JSON.stringify(result));
        """
        proc = subprocess.run(['node', '-e', runner], capture_output=True, text=True, check=True)
        return json.loads(proc.stdout.strip())

    def test_engine_file_exists(self):
        self.assertTrue(os.path.exists(self.engine_path))

    def test_isNoteRead_author(self):
        res = self._eval_js("ReadStatusEngine.isNoteRead({ author: 'user1', readBy: [] }, 'user1')")
        self.assertTrue(res, "작성자 본인은 항상 읽음 상태여야 함")

    def test_isNoteRead_recipient(self):
        unread_res = self._eval_js("ReadStatusEngine.isNoteRead({ author: 'user2', readBy: [] }, 'user1')")
        self.assertFalse(unread_res, "미확인 쪽지는 false여야 함")
        read_res = self._eval_js("ReadStatusEngine.isNoteRead({ author: 'user2', readBy: ['user1'] }, 'user1')")
        self.assertTrue(read_res, "readBy에 포함된 경우 true여야 함")

    def test_markNoteAsRead_implementation(self):
        res = self._eval_js("""
            (() => {
                const note = { id: 'n1', author: 'user2', readBy: [] };
                ReadStatusEngine.markNoteAsRead(note, 'user1');
                return note;
            })()
        """)
        self.assertTrue(res.get('read'), "note.read는 true여야 함")
        self.assertIn('user1', res.get('readBy', []), "readBy에 user1이 추가되어야 함")
        self.assertIsNotNone(res.get('readAt'), "readAt 타임스탬프가 기록되어야 함")

    def test_markNoteAsUnread_implementation(self):
        res = self._eval_js("""
            (() => {
                const note = { id: 'n1', author: 'user2', readBy: ['user1'], read: true, readAt: '2026-11-04' };
                ReadStatusEngine.markNoteAsUnread(note, 'user1');
                return note;
            })()
        """)
        self.assertFalse(res.get('read'), "note.read는 false여야 함")
        self.assertNotIn('user1', res.get('readBy', []))

    def test_getUnreadNotesCount_implementation(self):
        res = self._eval_js("""
            (() => {
                const notes = [
                    { id: '1', author: 'user2', readBy: [] },
                    { id: '2', author: 'user2', readBy: ['user1'] },
                    { id: '3', author: 'user1', readBy: [] }
                ];
                return ReadStatusEngine.getUnreadNotesCount(notes, 'user1');
            })()
        """)
        self.assertEqual(res, 1, "user1 기준 미확인 쪽지는 1건이어야 함")

    def test_markAllNotesAsRead_implementation(self):
        res = self._eval_js("""
            (() => {
                const notes = [
                    { id: '1', author: 'user2', readBy: [] },
                    { id: '2', author: 'user2', readBy: [] }
                ];
                const count = ReadStatusEngine.markAllNotesAsRead(notes, 'user1');
                return { count, notes };
            })()
        """)
        self.assertEqual(res['count'], 2)
        for n in res['notes']:
            self.assertTrue(n['read'])
            self.assertIn('user1', n['readBy'])

    def test_isScheduleMemoRead_implementation(self):
        self.assertTrue(self._eval_js("ReadStatusEngine.isScheduleMemoRead({ memo: '' }, 'user1')"))
        self.assertTrue(self._eval_js("ReadStatusEngine.isScheduleMemoRead({ memo: '약속', author: 'user1' }, 'user1')"))
        self.assertFalse(self._eval_js("ReadStatusEngine.isScheduleMemoRead({ memo: '약속', author: 'user2', memoReadBy: [] }, 'user1')"))

    def test_markScheduleMemoAsRead_implementation(self):
        res = self._eval_js("""
            (() => {
                const s = { id: 's1', memo: '장보기', author: 'user2' };
                ReadStatusEngine.markScheduleMemoAsRead(s, 'user1');
                return s;
            })()
        """)
        self.assertTrue(res['memoRead'])
        self.assertIn('user1', res['readBy'])

    def test_getUnreadMemosCountForDate_implementation(self):
        res = self._eval_js("""
            (() => {
                const schedules = [
                    { id: '1', date: '2026-11-04', memo: '체크', author: 'user2', readBy: [] },
                    { id: '2', date: '2026-11-04', memo: '', author: 'user2' }
                ];
                return ReadStatusEngine.getUnreadMemosCountForDate(schedules, '2026-11-04', 'user1');
            })()
        """)
        self.assertEqual(res, 1)

    def test_mergeReadStatus_implementation(self):
        res = self._eval_js("""
            (() => {
                const local = { id: '1', read: false, readBy: [] };
                const remote = { id: '1', read: true, readBy: ['user1'], readAt: '2026-11-04T12:00:00Z' };
                return ReadStatusEngine.mergeReadStatus(local, remote);
            })()
        """)
        self.assertTrue(res['read'])
        self.assertIn('user1', res['readBy'])
        self.assertEqual(res['readAt'], '2026-11-04T12:00:00Z')

    def test_css_file_exists(self):
        self.assertTrue(os.path.exists(self.css_path))

    def test_css_note_card_classes(self):
        required_classes = [
            '.note-card.unread',
            '.note-card.read',
            '.badge-unread-new',
            '.dot-unread-pulse',
            '.read-status-label',
            '.btn-mark-all-read',
            '.badge-memo-unread',
            '.schedule-memo-box.unread'
        ]
        for selector in required_classes:
            self.assertIn(selector, self.css_content, f"CSS 선택자 {selector} 누락")

    def test_css_reduced_motion(self):
        self.assertIn('@media (prefers-reduced-motion: reduce)', self.css_content)

if __name__ == '__main__':
    unittest.main()
