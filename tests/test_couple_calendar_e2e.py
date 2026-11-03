#!/usr/bin/env python3
"""
Test Suite for Couple-Calendar (SweetSync Calendar)
Verifies:
1. Drink Quota & Ticket Deduction Logic
2. Gist Payload Data Format & Serialization
3. Single HTML Integrity & Key UI Component Structure
"""

import os
import re
import json
import unittest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML_PATH = os.path.join(BASE_DIR, "index.html")

class TestCoupleCalendarLogic(unittest.TestCase):
    def test_drink_ticket_deduction_math(self):
        """Test the mathematical logic of drink ticket quota deduction."""
        def compute_tickets(quota, drinks, target_year, target_month):
            month_str = f"{target_year:04d}-{target_month:02d}"
            # count drinks matching the month
            monthly_drinks = [d for d in drinks if d.get('date', '').startswith(month_str)]
            used_count = len(monthly_drinks)
            remaining = quota - used_count
            
            if remaining >= 4:
                status = "plenty"
            elif 1 <= remaining < 4:
                status = "warning"
            elif remaining == 0:
                status = "exhausted"
            else:
                status = "overlimit"
                
            return {
                "quota": quota,
                "used": used_count,
                "remaining": remaining,
                "status": status
            }

        sample_drinks = [
            {"id": "d1", "date": "2026-11-01", "drinker": "user1", "type": "beer"},
            {"id": "d2", "date": "2026-11-03", "drinker": "together", "type": "soju"},
            {"id": "d3", "date": "2026-11-05", "drinker": "user2", "type": "wine"},
        ]
        
        # Test normal case: Quota 8, used 3 -> remaining 5 (plenty)
        res = compute_tickets(8, sample_drinks, 2026, 11)
        self.assertEqual(res["used"], 3)
        self.assertEqual(res["remaining"], 5)
        self.assertEqual(res["status"], "plenty")
        
        # Test warning case: Quota 5, used 3 -> remaining 2 (warning)
        res = compute_tickets(5, sample_drinks, 2026, 11)
        self.assertEqual(res["remaining"], 2)
        self.assertEqual(res["status"], "warning")
        
        # Test exhausted case: Quota 3, used 3 -> remaining 0 (exhausted)
        res = compute_tickets(3, sample_drinks, 2026, 11)
        self.assertEqual(res["remaining"], 0)
        self.assertEqual(res["status"], "exhausted")
        
        # Test overlimit case: Quota 2, used 3 -> remaining -1 (overlimit)
        res = compute_tickets(2, sample_drinks, 2026, 11)
        self.assertEqual(res["remaining"], -1)
        self.assertEqual(res["status"], "overlimit")

    def test_gist_payload_schema(self):
        """Verify the JSON schema compatibility for GitHub Gist storage."""
        schema = {
            "version": "1.0.0",
            "lastUpdated": "2026-11-02T17:00:00Z",
            "couple": {
                "user1": {"name": "남편", "nickname": "곰돌이", "avatar": "🐻"},
                "user2": {"name": "아내", "nickname": "토끼", "avatar": "🐰"},
                "anniversary": "2020-05-20",
                "monthlyDrinkQuota": 8
            },
            "drinks": [],
            "schedules": [],
            "notes": []
        }
        
        # Serialization / deserialization roundtrip
        dumped = json.dumps(schema, ensure_ascii=False)
        loaded = json.loads(dumped)
        self.assertIn("monthlyDrinkQuota", loaded["couple"])
        self.assertIn("drinks", loaded)
        self.assertIn("schedules", loaded)
        self.assertIn("notes", loaded)


class TestCoupleCalendarHTML(unittest.TestCase):
    def setUp(self):
        self.assertTrue(os.path.exists(HTML_PATH), f"Target HTML does not exist: {HTML_PATH}")
        with open(HTML_PATH, "r", encoding="utf-8") as f:
            self.content = f.read()

    def test_html_structure_and_components(self):
        """Verify essential HTML components and scripts are present."""
        self.assertIn("<!DOCTYPE html>", self.content)
        self.assertIn("달콤살벌 캘린더", self.content)
        
        # Check for core modules
        self.assertIn("id=\"drink-ticket-banner\"", self.content)
        self.assertIn("id=\"calendar-view\"", self.content)
        self.assertIn("id=\"notes-view\"", self.content)
        self.assertIn("id=\"stats-view\"", self.content)
        self.assertIn("id=\"settings-modal\"", self.content)
        self.assertIn("id=\"quick-record-modal\"", self.content)

    def test_drink_quota_features_in_html(self):
        """Verify drink quota and deduction UI elements exist."""
        self.assertIn("음주 티켓", self.content)
        self.assertIn("ticket", self.content.lower())

    def test_couple_profile_juni_and_yongi(self):
        """Verify couple names are set to 주니 and 용이."""
        self.assertIn("주니", self.content)
        self.assertIn("용이", self.content)

    def test_calendar_drink_count_badge(self):
        """Verify drink count badge (1회, 2회...) is rendered on calendar days."""
        self.assertIn("badge-drink-count", self.content)

    def test_split_mailboxes_juni_and_yongi(self):
        """Verify notes view is split into 주니->용이 and 용이->주니 mailboxes."""
        self.assertIn("juni-to-yongi", self.content)
        self.assertIn("yongi-to-juni", self.content)

    def test_notification_and_chime_system(self):
        """Verify Web Audio chime, Web Notification and in-app toast for new notes."""
        self.assertIn("playNewNoteChime", self.content)
        self.assertIn("Notification", self.content)
        self.assertIn("new-note-toast", self.content)

    def test_gist_sync_features_in_html(self):
        """Verify GitHub Gist synchronization code is embedded."""
        self.assertIn("api.github.com/gists", self.content)
        self.assertIn("syncKey", self.content)
        self.assertIn("localStorage", self.content)

    def test_spouse_latest_note_alert_card(self):
        """Verify spouse latest note alert card component, role toggling, and quick actions."""
        self.assertIn("id=\"latest-note-alert-card\"", self.content)
        self.assertIn("renderLatestNoteAlertCard", self.content)
        self.assertIn("quickReactLatestNote", self.content)
        self.assertIn("quickReplyLatestNote", self.content)
        self.assertIn("toggleMyRole", self.content)

    def test_pwa_and_service_worker_readiness(self):
        """Verify PWA Service Worker, Manifest specification, and installation readiness."""
        manifest_path = os.path.join(BASE_DIR, "manifest.json")
        sw_path = os.path.join(BASE_DIR, "sw.js")
        
        # Check files exist
        self.assertTrue(os.path.exists(manifest_path), "manifest.json must exist")
        self.assertTrue(os.path.exists(sw_path), "sw.js must exist")
        
        # Check manifest.json contents
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
        self.assertEqual(manifest.get("display"), "standalone")
        self.assertIn("start_url", manifest)
        self.assertIn("scope", manifest)
        self.assertIn("id", manifest)
        self.assertTrue(len(manifest.get("icons", [])) >= 2, "Must contain at least 2 icons (192, 512)")
        
        # Check sw.js contents
        with open(sw_path, "r", encoding="utf-8") as f:
            sw_code = f.read()
        self.assertIn("addEventListener('install'", sw_code)
        self.assertIn("addEventListener('activate'", sw_code)
        self.assertIn("addEventListener('fetch'", sw_code)
        
        # Check index.html integration
        self.assertIn("serviceWorker.register('./sw.js')", self.content)
        self.assertIn("rel=\"manifest\"", self.content)
        self.assertIn("installPwaApp()", self.content)

if __name__ == "__main__":
    unittest.main()

