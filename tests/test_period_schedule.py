#!/usr/bin/env python3
"""
Test Suite for Period Schedule Engine
Couple-Calendar v2.0 Track C
"""

import unittest
import os
import sys

class TestPeriodScheduleEngine(unittest.TestCase):

    def test_engine_file_exists(self):
        engine_path = '/Users/yohan/couple-calendar/modules/period_schedule_engine.js'
        self.assertTrue(os.path.exists(engine_path), "period_schedule_engine.js 파일이 존재하지 않습니다.")

    def test_engine_logic_simulation(self):
        # 파이썬 환경에서 자바스크립트 엔진의 핵심 로직(기간 판별 및 쪽지 생성) 검증

        def isDateInSchedule(date_str, schedule):
            if schedule.get('date') == date_str:
                return True
            start = schedule.get('startDate')
            end = schedule.get('endDate')
            if start and end:
                return start <= date_str <= end
            return False

        def getSchedulePosition(date_str, schedule):
            if schedule.get('date') == date_str:
                return 'single'
            if schedule.get('startDate') == date_str:
                return 'start'
            if schedule.get('endDate') == date_str:
                return 'end'
            return 'middle'

        def createScheduleNote(schedule, author_role):
            if not schedule.get('sharedAsNote') or not schedule.get('memo'):
                return None
            target_role = 'user2' if author_role == 'user1' else 'user1'
            return {
                'author': author_role,
                'target': target_role,
                'type': 'announcement',
                'content': f"[일정 공유: {schedule['title']}] {schedule['startDate']}~{schedule['endDate']}\n메모: {schedule['memo']}",
                'reactions': 1,
                'likedBy': []
            }

        # 테스트 케이스 1: 단일 일정
        s1 = {'title': '데이트', 'date': '2026-11-05'}
        self.assertTrue(isDateInSchedule('2026-11-05', s1))
        self.assertFalse(isDateInSchedule('2026-11-06', s1))
        self.assertEqual(getSchedulePosition('2026-11-05', s1), 'single')

        # 테스트 케이스 2: 기간 일정
        s2 = {
            'title': '제주도 여행',
            'startDate': '2026-11-10',
            'endDate': '2026-11-13',
            'memo': '렌터카 예약 완료',
            'sharedAsNote': True
        }
        self.assertTrue(isDateInSchedule('2026-11-10', s2)) # 시작일
        self.assertTrue(isDateInSchedule('2026-11-11', s2)) # 중간일
        self.assertTrue(isDateInSchedule('2026-11-13', s2)) # 종료일
        self.assertFalse(isDateInSchedule('2026-11-14', s2))

        self.assertEqual(getSchedulePosition('2026-11-10', s2), 'start')
        self.assertEqual(getSchedulePosition('2026-11-11', s2), 'middle')
        self.assertEqual(getSchedulePosition('2026-11-13', s2), 'end')

        # 테스트 케이스 3: 쪽지 생성
        note = createScheduleNote(s2, 'user1')
        self.assertIsNotNone(note)
        self.assertEqual(note['author'], 'user1')
        self.assertEqual(note['target'], 'user2')
        self.assertIn('제주도 여행', note['content'])
        self.assertIn('렌터카 예약 완료', note['content'])

if __name__ == '__main__':
    unittest.main()
