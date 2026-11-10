/**
 * Couple-Calendar Period Schedule Engine
 * 프로젝트: couple-calendar
 */
window.PeriodScheduleEngine = (function() {

    /**
     * 특정 날짜가 일정 범위에 포함되는지 판별
     * @param {string} dateStr - 'YYYY-MM-DD'
     * @param {object} schedule - {startDate, endDate, date}
     */
    function isDateInSchedule(dateStr, schedule) {
        if (schedule.date === dateStr) return true;
        const start = new Date(schedule.startDate);
        const end = new Date(schedule.endDate);
        const target = new Date(dateStr);
        return target >= start && target <= end;
    }

    /**
     * 일정 내 위치 판별 (CSS 클래스용)
     */
    function getSchedulePosition(dateStr, schedule) {
        if (schedule.date === dateStr) return 'single';
        if (schedule.startDate === dateStr) return 'start';
        if (schedule.endDate === dateStr) return 'end';
        return 'middle';
    }

    /**
     * 일정 쪽지 객체 생성
     */
    function createScheduleNote(schedule, authorRole) {
        if (!schedule.sharedAsNote || !schedule.memo) return null;

        return {
            author: authorRole,
            target: authorRole === 'user1' ? 'user2' : 'user1',
            type: 'announcement',
            content: `[일정 공유: ${schedule.title}] ${schedule.startDate}~${schedule.endDate}\n메모: ${schedule.memo}`,
            reactions: 1,
            likedBy: []
        };
    }

    /**
     * 해당 날짜의 모든 일정 반환
     */
    function getSchedulesForDay(dateStr, schedulesList) {
        return schedulesList.filter(s => isDateInSchedule(dateStr, s));
    }

    return {
        isDateInSchedule,
        getSchedulePosition,
        createScheduleNote,
        getSchedulesForDay
    };
})();
