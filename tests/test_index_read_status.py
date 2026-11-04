#!/usr/bin/env python3
"""
Test Suite for index.html Read Status Integration
Couple-Calendar v2.2.0 - Track Read-Integration
"""

import unittest
import os
import re

REPO_ROOT = '/Users/yohan/couple-calendar'

class TestIndexReadStatusIntegration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.index_path = os.path.join(REPO_ROOT, 'index.html')
        with open(cls.index_path, encoding='utf-8') as f:
            cls.html = f.read()

    def test_css_and_engine_linked_in_head(self):
        self.assertIn('modules/read_status.css', self.html)
        self.assertIn('modules/read_status_engine.js', self.html)

    def test_mark_all_read_button_exists(self):
        self.assertIn('id="btn-mark-all-read"', self.html)
        self.assertIn('handleMarkAllNotesAsRead()', self.html)

    def test_notes_badge_in_markup(self):
        self.assertIn('id="notes-badge"', self.html)

    def test_update_notes_badge_function(self):
        self.assertIn('function updateNotesBadge()', self.html)
        self.assertIn('ReadStatusEngine.getUnreadNotesCount', self.html)

    def test_handle_mark_all_notes_as_read(self):
        self.assertIn('function handleMarkAllNotesAsRead()', self.html)
        self.assertIn('ReadStatusEngine.markAllNotesAsRead', self.html)

    def test_render_note_card_list_has_read_status(self):
        self.assertIn('ReadStatusEngine.isNoteRead', self.html)
        self.assertIn('badge-unread-new', self.html)
        self.assertIn('dot-unread-pulse', self.html)
        self.assertIn('read-status-label', self.html)
        self.assertIn('btn-toggle-read', self.html)

    def test_calendar_has_unread_memo_indicator(self):
        self.assertIn('ReadStatusEngine.getUnreadMemosCountForDate', self.html)
        self.assertIn('badge-memo-unread', self.html)

    def test_open_day_detail_has_memo_read_system(self):
        self.assertIn('function handleMarkScheduleMemoRead', self.html)
        self.assertIn('schedule-memo-box', self.html)
        self.assertIn('btn-mark-memo-read', self.html)

    def test_merge_states_preserves_read_status(self):
        self.assertIn('ReadStatusEngine.mergeReadStatus', self.html)

    def test_version_v220(self):
        self.assertIn('v2.2.0', self.html)

if __name__ == '__main__':
    unittest.main()
